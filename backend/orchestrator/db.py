"""SQLite persistence layer for workflows and tasks using standard sqlite3."""

import json
import os
import sqlite3
from backend.orchestrator.state import Task, Workflow

DEFAULT_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "nexus.db")
)


def get_db_path(custom_path: str | None = None) -> str:
    """Return configured database path or default."""
    if custom_path:
        return custom_path
    return os.environ.get("NEXUS_DB_PATH", DEFAULT_DB_PATH)


def init_db(db_path: str | None = None) -> None:
    """Initialize SQLite database tables if they do not exist."""
    path = get_db_path(db_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS workflows (
              workflow_id TEXT PRIMARY KEY,
              original_goal TEXT,
              requirements_json TEXT,
              status TEXT,
              created_at TEXT,
              updated_at TEXT
            );
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
              task_id TEXT,
              workflow_id TEXT,
              title TEXT,
              description TEXT,
              assigned_agent TEXT,
              dependencies_json TEXT,
              status TEXT,
              input_context_json TEXT,
              output TEXT,
              error TEXT,
              retry_count INTEGER,
              PRIMARY KEY (task_id, workflow_id)
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_workflow(workflow: Workflow, db_path: str | None = None) -> None:
    """Persist a Workflow and its associated Tasks."""
    path = get_db_path(db_path)
    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO workflows (
              workflow_id, original_goal, requirements_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                workflow.workflow_id,
                workflow.original_goal,
                json.dumps(workflow.requirements),
                workflow.status,
                workflow.created_at,
                workflow.updated_at,
            ),
        )

        for task in workflow.tasks:
            cursor.execute(
                """
                INSERT OR REPLACE INTO tasks (
                  task_id, workflow_id, title, description, assigned_agent,
                  dependencies_json, status, input_context_json, output, error, retry_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task.task_id,
                    workflow.workflow_id,
                    task.title,
                    task.description,
                    task.assigned_agent,
                    json.dumps(task.dependencies),
                    task.status,
                    json.dumps(task.input_context),
                    task.output,
                    task.error,
                    task.retry_count,
                ),
            )
        conn.commit()
    finally:
        conn.close()


def get_workflow(workflow_id: str, db_path: str | None = None) -> Workflow | None:
    """Retrieve a Workflow and its Tasks by workflow_id, or None if not found."""
    path = get_db_path(db_path)
    if not os.path.exists(path):
        return None

    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT workflow_id, original_goal, requirements_json, status, created_at, updated_at
            FROM workflows
            WHERE workflow_id = ?
            """,
            (workflow_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        w_id, orig_goal, req_json, status, created_at, updated_at = row

        cursor.execute(
            """
            SELECT task_id, title, description, assigned_agent,
                   dependencies_json, status, input_context_json, output, error, retry_count
            FROM tasks
            WHERE workflow_id = ?
            """,
            (workflow_id,),
        )
        task_rows = cursor.fetchall()

        tasks = []
        for t_row in task_rows:
            (
                t_id,
                title,
                desc,
                agent,
                deps_json,
                t_status,
                in_ctx_json,
                out,
                err,
                retries,
            ) = t_row
            tasks.append(
                Task(
                    task_id=t_id,
                    title=title,
                    description=desc,
                    assigned_agent=agent,
                    dependencies=json.loads(deps_json) if deps_json else [],
                    status=t_status,
                    input_context=json.loads(in_ctx_json) if in_ctx_json else {},
                    output=out,
                    error=err,
                    retry_count=retries,
                )
            )

        # Sort tasks naturally by task_id (e.g., T1, T2, ...)
        def sort_key(t: Task) -> int:
            if t.task_id.startswith("T") and t.task_id[1:].isdigit():
                return int(t.task_id[1:])
            return 999

        tasks.sort(key=sort_key)

        return Workflow(
            workflow_id=w_id,
            original_goal=orig_goal,
            requirements=json.loads(req_json) if req_json else {},
            tasks=tasks,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
        )
    finally:
        conn.close()


def get_task(workflow_id: str, task_id: str, db_path: str | None = None) -> Task | None:
    """Retrieve a single Task by workflow_id and task_id, or None if not found."""
    path = get_db_path(db_path)
    if not os.path.exists(path):
        return None

    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT task_id, title, description, assigned_agent,
                   dependencies_json, status, input_context_json, output, error, retry_count
            FROM tasks
            WHERE workflow_id = ? AND task_id = ?
            """,
            (workflow_id, task_id),
        )
        row = cursor.fetchone()
        if not row:
            return None

        (
            t_id,
            title,
            desc,
            agent,
            deps_json,
            t_status,
            in_ctx_json,
            out,
            err,
            retries,
        ) = row

        return Task(
            task_id=t_id,
            title=title,
            description=desc,
            assigned_agent=agent,
            dependencies=json.loads(deps_json) if deps_json else [],
            status=t_status,
            input_context=json.loads(in_ctx_json) if in_ctx_json else {},
            output=out,
            error=err,
            retry_count=retries,
        )
    finally:
        conn.close()


def list_workflows(limit: int = 20, db_path: str | None = None) -> list[Workflow]:
    """Retrieve recent workflows ordered by created_at DESC."""
    path = get_db_path(db_path)
    if not os.path.exists(path):
        return []

    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT workflow_id
            FROM workflows
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        workflows = []
        for (w_id,) in rows:
            wf = get_workflow(w_id, db_path)
            if wf:
                workflows.append(wf)
        return workflows
    finally:
        conn.close()

