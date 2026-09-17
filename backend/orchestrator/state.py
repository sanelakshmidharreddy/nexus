"""Data models, state definitions, and DAG validation for NEXUS."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

VALID_TASK_STATES = ("pending", "running", "success", "failed", "retrying")
VALID_AGENTS = ("research", "data", "ui", "developer", "qa", "evaluator")

REQUIRED_REQUIREMENTS_KEYS = (
    "objective",
    "domain",
    "requested_features",
    "expected_output",
    "constraints",
    "data_requirements",
    "ui_requirements",
    "technical_requirements",
    "verification_requirements",
)


@dataclass
class Event:
    event_id: str
    workflow_id: str
    task_id: str | None
    agent: str | None
    event_type: str
    message: str
    status: str
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "workflow_id": self.workflow_id,
            "task_id": self.task_id,
            "agent": self.agent,
            "event_type": self.event_type,
            "message": self.message,
            "status": self.status,
            "timestamp": self.timestamp,
        }


@dataclass
class Task:
    task_id: str
    title: str
    description: str
    assigned_agent: str
    dependencies: list[str]
    status: str = "pending"
    input_context: dict = field(default_factory=dict)
    output: str | None = None
    error: str | None = None
    retry_count: int = 0

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "title": self.title,
            "description": self.description,
            "assigned_agent": self.assigned_agent,
            "dependencies": list(self.dependencies),
            "status": self.status,
            "input_context": dict(self.input_context),
            "output": self.output,
            "error": self.error,
            "retry_count": self.retry_count,
        }


@dataclass
class Workflow:
    workflow_id: str
    original_goal: str
    requirements: dict
    tasks: list[Task]
    status: str = "planned"
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    evaluation: dict | None = None
    artifacts: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "workflow_id": self.workflow_id,
            "original_goal": self.original_goal,
            "requirements": self.requirements,
            "tasks": [t.to_dict() for t in self.tasks],
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "evaluation": self.evaluation,
            "artifacts": list(self.artifacts),
        }


def validate_dag(tasks: list[Task]) -> None:
    """Validate that tasks form a directed acyclic graph (DAG) using Kahn's algorithm.

    Raises:
        ValueError("unknown dependency: <id>") if a dependency references a non-existent task.
        ValueError("cyclic dependency detected") if a cycle is present in task dependencies.
    """
    task_ids = {t.task_id for t in tasks}

    # Check for unknown dependencies
    for t in tasks:
        for dep in t.dependencies:
            if dep not in task_ids:
                raise ValueError(f"unknown dependency: {dep}")

    # In-degree of each task (number of dependencies it waits on)
    in_degree = {t.task_id: len(t.dependencies) for t in tasks}

    # Adjacency list: completing dep unlocks task (dep -> task)
    dependents: dict[str, list[str]] = {t.task_id: [] for t in tasks}
    for t in tasks:
        for dep in t.dependencies:
            dependents[dep].append(t.task_id)

    # Queue of tasks with 0 dependencies
    queue = [t.task_id for t in tasks if in_degree[t.task_id] == 0]
    visited_count = 0

    while queue:
        current = queue.pop(0)
        visited_count += 1
        for next_task_id in dependents[current]:
            in_degree[next_task_id] -= 1
            if in_degree[next_task_id] == 0:
                queue.append(next_task_id)

    if visited_count != len(tasks):
        raise ValueError("cyclic dependency detected")
