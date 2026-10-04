"""FastAPI application entrypoint for NEXUS Developer Orchestrator."""

import io
import logging
import os
import re
import sys
import uuid
import zipfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel

# Ensure repository root is on sys.path
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

# Load backend/.env if present
env_path = _REPO_ROOT / "backend" / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from backend.orchestrator import db, execution, goal_parser, model, planner
from backend.orchestrator.state import Workflow
from backend.tools import workspace_tools

logger = logging.getLogger("nexus.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema and ensure workspace directories
    db.init_db()
    workspace_tools.ensure_workspace_root()
    yield


app = FastAPI(title="NEXUS AI Developer Orchestrator", lifespan=lifespan)

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

DEMO_MODE_DEFAULT = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")


class GoalRequest(BaseModel):
    goal: str
    auto_execute: bool = True
    demo_mode: bool = DEMO_MODE_DEFAULT


class ExecuteRequest(BaseModel):
    demo_mode: bool = DEMO_MODE_DEFAULT


def _create_workflow_zip(workflow_id: str) -> bytes:
    sandbox_dir = workspace_tools.get_sandbox_dir(workflow_id)
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(sandbox_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, sandbox_dir)
                zf.write(abs_path, arcname=rel_path)
    zip_buffer.seek(0)
    return zip_buffer.getvalue()


@app.get("/")
def root():
    reachable, model_name, provider = model.check_connection()
    return {
        "service": "NEXUS AI Developer Orchestrator API",
        "status": "online",
        "provider": provider,
        "model": model_name,
        "reachable": reachable,
        "mode": f"live ({provider})" if reachable else "deterministic fallback demo mode",
    }


@app.get("/health")
def health():
    reachable, model_name, provider = model.check_connection()
    is_prod = bool(os.environ.get("PORT") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"))
    return {
        "status": "ok",
        "backend": "online",
        "provider": provider,
        "model": model_name,
        "model_reachable": reachable,
        "mode": provider if reachable else "deterministic_fallback",
        "deployment": "production" if is_prod else "local",
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
    workflows = db.list_workflows(limit=limit)
    return [w.to_dict() for w in workflows]


@app.get("/workflows/{workflow_id}")
def read_workflow(workflow_id: str):
    workflow = db.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")
    return workflow.to_dict()


@app.get("/workflows/{workflow_id}/tasks/{task_id}")
def read_task(workflow_id: str, task_id: str):
    task = db.get_task(workflow_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found in workflow '{workflow_id}'")
    return task.to_dict()


@app.get("/workflows/{workflow_id}/events")
def read_events(workflow_id: str):
    events = db.get_events(workflow_id)
    return [e.to_dict() for e in events]


@app.get("/workflows/{workflow_id}/artifacts")
def read_artifacts(workflow_id: str):
    return workspace_tools.list_directory(workflow_id)


@app.get("/workflows/{workflow_id}/zip")
@app.get("/api/workflows/{workflow_id}/zip")
def download_workflow_zip(workflow_id: str):
    """Download the complete generated project files as a ZIP archive."""
    wf = db.get_workflow(workflow_id)
    project_name = "nexus_project"
    if wf and wf.requirements:
        raw_name = wf.requirements.get("project_name", "nexus_project")
        project_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", raw_name).lower()

    zip_bytes = _create_workflow_zip(workflow_id)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{project_name}.zip"'},
    )


@app.get("/api/generate-zip")
def api_generate_zip(workflow_id: str | None = None):
    """Compatibility endpoint for ZIP download."""
    if not workflow_id:
        wfs = db.list_workflows(limit=1)
        if not wfs:
            raise HTTPException(status_code=404, detail="No workflows found")
        workflow_id = wfs[0].workflow_id
    return download_workflow_zip(workflow_id)


@app.get("/workflows/{workflow_id}/dashboard", response_class=HTMLResponse)
@app.get("/workflows/{workflow_id}/preview", response_class=HTMLResponse)
def view_preview(workflow_id: str):
    """Serve the generated interactive preview HTML."""
    try:
        html = workspace_tools.read_file(workflow_id, "index.html")
        return HTMLResponse(content=html, status_code=200)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Project preview not yet generated. Execution may still be running.",
        )


@app.get("/workflows/{workflow_id}/artifact/{file_path:path}")
def serve_artifact(workflow_id: str, file_path: str):
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
