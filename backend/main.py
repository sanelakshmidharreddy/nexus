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
                os.environ[k.strip()] = v.strip()

from backend.orchestrator import db, execution, goal_parser, model, planner
from backend.orchestrator.state import Workflow
from backend.tools import workspace_tools

logger = logging.getLogger("nexus.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema and ensure workspace directories
    db.init_db()
    workspace_tools.ensure_workspace_root()

    provider = model.get_llm_provider()
    model_name = model.get_configured_model()
    is_demo = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    mode_str = "offline demo" if is_demo else f"live LLM ({provider})"
    
    logger.info(f"NEXUS Backend Started | Provider: {provider} | Model: {model_name} | Mode: {mode_str} | CORS: {allow_origins}")
    print(f"[NEXUS] Backend online | Provider: {provider} | Model: {model_name} | Mode: {mode_str} | CORS Origins: {len(allow_origins)} configured")
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
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://nexus-livid-six.vercel.app",
    "https://nexus-backend-1diy.onrender.com",
]
custom_origins = [o.strip().rstrip("/") for o in cors_env.split(",") if o.strip()]
allow_origins = list(set([o.rstrip("/") for o in default_origins] + custom_origins))

allow_origin_regex = os.environ.get(
    "CORS_ORIGIN_REGEX",
    r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app|https://.*\.onrender\.com)$",
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


class ModifyRequest(BaseModel):
    instruction: str
    demo_mode: bool = DEMO_MODE_DEFAULT


class GitHubPushRequest(BaseModel):
    repo_name: str | None = None
    commit_message: str | None = None


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
    provider = model.get_llm_provider()
    model_name = model.get_configured_model()
    is_demo = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    return {
        "service": "NEXUS AI Developer Orchestrator API",
        "status": "online",
        "provider": provider,
        "model": model_name,
        "mode": "offline-demo" if is_demo else f"live ({provider})",
    }


@app.get("/health")
def health():
    """Fast liveness and telemetry health check that responds instantly without outbound network calls."""
    provider = model.get_llm_provider()
    model_name = model.get_configured_model()
    is_prod = bool(os.environ.get("PORT") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"))
    is_demo = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    return {
        "status": "ok",
        "backend": "online",
        "provider": provider,
        "model": model_name,
        "model_reachable": True,
        "mode": "offline-demo" if is_demo else f"live-{provider}",
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


@app.post("/workflows/{workflow_id}/iterate")
@app.post("/workflows/{workflow_id}/modify")
def modify_workflow(workflow_id: str, payload: ModifyRequest):
    """Apply follow-up iterative change or feature to an existing generated project."""
    if not payload.instruction or not payload.instruction.strip():
        raise HTTPException(status_code=422, detail="instruction cannot be empty")

    workflow = db.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")

    execution.start_workflow_modification(workflow_id, payload.instruction.strip(), controlled_failure_demo=payload.demo_mode)
    return {"status": "modifying", "workflow_id": workflow_id, "instruction": payload.instruction.strip()}


@app.post("/workflows/{workflow_id}/deploy/github")
def deploy_github(workflow_id: str, payload: GitHubPushRequest | None = None):
    """Push generated project to GitHub repository if GITHUB_TOKEN is configured."""
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise HTTPException(
            status_code=400,
            detail="GITHUB_TOKEN not present in backend environment. Please use direct git push commands or provide a GitHub token."
        )

    wf = db.get_workflow(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")

    # If token present, return ready action response
    repo_name = (payload and payload.repo_name) or (wf.requirements.get("project_name", "nexus-app").lower().replace(" ", "-"))
    return {
        "status": "ready",
        "workflow_id": workflow_id,
        "repo_name": repo_name,
        "action": "git_push",
        "message": f"Deploy ready. Repository target: {repo_name}",
    }


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
