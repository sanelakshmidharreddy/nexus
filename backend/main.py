"""FastAPI application entrypoint for NEXUS Orchestrator."""

import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.orchestrator import db, goal_parser, model, planner
from backend.orchestrator.state import Workflow


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite schema at startup
    db.init_db()
    yield


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NEXUS Orchestrator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GoalRequest(BaseModel):
    goal: str


@app.get("/health")
def health():
    """Health check endpoint.
    
    Returns 200 with model name if Ollama is reachable; returns 503 if not.
    """
    reachable, model_name = model.check_connection()
    if not reachable:
        raise HTTPException(status_code=503, detail="local model unreachable")
    return {"status": "ok", "model": model_name}


@app.post("/goals")
def create_goal(payload: GoalRequest):
    """Accept natural-language goal, parse requirements, plan tasks, persist workflow."""
    if not payload.goal or not payload.goal.strip():
        raise HTTPException(status_code=422, detail="goal must not be empty")

    try:
        requirements = goal_parser.parse(payload.goal)
        tasks = planner.plan(requirements)
    except model.ModelConnectionError as exc:
        raise HTTPException(status_code=503, detail="local model unreachable") from exc
    except goal_parser.GoalParsingError as exc:
        raise HTTPException(
            status_code=502, detail="model returned invalid requirements"
        ) from exc

    workflow = Workflow(
        workflow_id=uuid.uuid4().hex,
        original_goal=payload.goal,
        requirements=requirements,
        tasks=tasks,
        status="planned",
    )
    db.save_workflow(workflow)
    return workflow.to_dict()


@app.get("/workflows")
def list_workflows(limit: int = 20):
    """Retrieve list of recent workflows."""
    workflows = db.list_workflows(limit=limit)
    return [w.to_dict() for w in workflows]


@app.get("/workflows/{workflow_id}")
def read_workflow(workflow_id: str):
    """Retrieve full persisted workflow state."""
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
