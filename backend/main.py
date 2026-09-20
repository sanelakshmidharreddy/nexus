"""FastAPI application entrypoint for NEXUS Orchestrator."""

import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

# Ensure the repository root is always on sys.path so 'backend' is importable from any directory
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from backend.orchestrator import db, execution, goal_parser, model, planner
from backend.orchestrator.state import Workflow
from backend.tools import workspace_tools

logger = logging.getLogger("nexus.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema and ensure workspace directories at startup
    db.init_db()
    workspace_tools.ensure_workspace_root()
    yield


app = FastAPI(title="NEXUS Orchestrator", lifespan=lifespan)

# Configurable CORS for development and production deployments (e.g. Vercel)
cors_env = os.environ.get("CORS_ORIGINS", "")
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://nexus-livid-six.vercel.app",
]
custom_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
allow_origins = list(set(default_origins + custom_origins))

# Allow any localhost/127.0.0.1 port and any vercel preview/production domain
allow_origin_regex = os.environ.get(
    "CORS_ORIGIN_REGEX",
    r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_MODE_DEFAULT = os.environ.get("DEMO_MODE", "true").lower() in ("true", "1", "yes")


class GoalRequest(BaseModel):
    goal: str
    auto_execute: bool = True
    demo_mode: bool = DEMO_MODE_DEFAULT


class ExecuteRequest(BaseModel):
    demo_mode: bool = DEMO_MODE_DEFAULT


@app.get("/")
def root():
    """Root status endpoint providing service metadata."""
    reachable, model_name = model.check_connection()
    return {
        "service": "NEXUS Orchestrator API",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "model_connected": reachable,
        "mode": "ollama (local ai)" if reachable else "deterministic fallback (production/demo mode)",
        "demo_mode": DEMO_MODE_DEFAULT,
    }


@app.get("/health")
def health():
    """Health check endpoint.
    
    Always returns HTTP 200 with connection status and model telemetry so
    the frontend can accurately display ONLINE, DEGRADED, or OFFLINE.
    Clearly reports whether local Ollama is active or if the server
    is operating in deterministic demo fallback mode.
    """
    reachable, model_name = model.check_connection()
    is_prod = bool(os.environ.get("PORT") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"))
    return {
        "status": "ok",
        "backend": "online",
        "model": model_name if reachable else "deterministic-fallback",
        "model_reachable": reachable,
        "mode": "ollama" if reachable else "deterministic_fallback",
        "demo_mode": DEMO_MODE_DEFAULT,
        "deployment": "production" if is_prod else "local",
        "ollama_host": model.get_ollama_host() if reachable else None,
    }


@app.post("/goals")
def create_goal(payload: GoalRequest):
    """Accept natural-language goal, parse requirements, plan tasks, persist, and trigger execution."""
    if not payload.goal or not payload.goal.strip():
        raise HTTPException(status_code=422, detail="goal must not be empty")

    requirements = goal_parser.parse(payload.goal, prefer_deterministic=payload.demo_mode)
    tasks = planner.plan(requirements, prefer_deterministic=payload.demo_mode)

    workflow = Workflow(
        workflow_id=uuid.uuid4().hex,
        original_goal=payload.goal,
        requirements=requirements,
        tasks=tasks,
        status="planned",
    )
    db.save_workflow(workflow)

    if payload.auto_execute:
        execution.start_workflow_background(workflow.workflow_id, controlled_failure_demo=payload.demo_mode)

    return workflow.to_dict()


@app.post("/workflows/{workflow_id}/execute")
def execute_workflow(workflow_id: str, payload: ExecuteRequest | None = None):
    """Trigger background execution for an existing planned workflow."""
    workflow = db.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")

    demo_mode = payload.demo_mode if payload else DEMO_MODE_DEFAULT
    execution.start_workflow_background(workflow_id, controlled_failure_demo=demo_mode)
    return {"status": "started", "workflow_id": workflow_id}


@app.get("/workflows")
def list_workflows(limit: int = 20):
    """Retrieve list of recent workflows."""
    workflows = db.list_workflows(limit=limit)
    return [w.to_dict() for w in workflows]


@app.get("/workflows/{workflow_id}")
def read_workflow(workflow_id: str):
    """Retrieve full live persisted workflow state."""
    workflow = db.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=404, detail=f"Workflow '{workflow_id}' not found"
        )
    return workflow.to_dict()


@app.get("/workflows/{workflow_id}/tasks/{task_id}")
def read_task(workflow_id: str, task_id: str):
    """Retrieve a single task from a workflow."""
    task = db.get_task(workflow_id, task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task '{task_id}' not found in workflow '{workflow_id}'",
        )
    return task.to_dict()


@app.get("/workflows/{workflow_id}/events")
def read_events(workflow_id: str):
    """Retrieve execution events timeline for a workflow."""
    events = db.get_events(workflow_id)
    return [e.to_dict() for e in events]


@app.get("/workflows/{workflow_id}/artifacts")
def read_artifacts(workflow_id: str):
    """Retrieve list of generated artifacts for a workflow."""
    return workspace_tools.list_directory(workflow_id)


@app.get("/workflows/{workflow_id}/dashboard", response_class=HTMLResponse)
def view_dashboard(workflow_id: str):
    """Serve the generated dashboard HTML directly."""
    try:
        html = workspace_tools.read_file(workflow_id, "index.html")
        base_tag = f'<base href="/workflows/{workflow_id}/artifact/" />'
        if "<base" not in html and "<head>" in html:
            html = html.replace("<head>", f"<head>\n  {base_tag}")
        return HTMLResponse(content=html, status_code=200)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Dashboard not yet generated for this workflow. Execution may still be running."
        )


@app.get("/workflows/{workflow_id}/{file_name}")
def serve_dashboard_file(workflow_id: str, file_name: str):
    """Serve direct relative files requested by the dashboard."""
    if file_name in ("styles.css", "app.js", "data.json", "index.html"):
        return serve_artifact(workflow_id, file_name)
    raise HTTPException(status_code=404, detail=f"File '{file_name}' not found")


@app.get("/workflows/{workflow_id}/artifact/{file_path:path}")
def serve_artifact(workflow_id: str, file_path: str):
    """Serve individual files (e.g. data.json, styles.css, app.js) safely from sandbox."""
    try:
        safe_path = workspace_tools._resolve_safe_path(workflow_id, file_path)
        if not os.path.exists(safe_path):
            raise HTTPException(status_code=404, detail=f"Artifact '{file_path}' not found")
        return FileResponse(safe_path)
    except workspace_tools.ToolSecurityError:
        raise HTTPException(status_code=403, detail="Access denied: path escapes sandbox")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting NEXUS FastAPI backend on {host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
