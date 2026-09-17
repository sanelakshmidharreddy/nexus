"""SQLite persistence layer for workflows, tasks, and execution events."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from backend.orchestrator.state import Event, Task, Workflow

DEFAULT_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "nexus.db")
)


def get_db_path(custom_path: str | None = None) -> str:
    """Return configured database path or default."""
    if custom_path:
        return custom_path
    return os.environ.get("NEXUS_DB_PATH", DEFAULT_DB_PATH)


def init_db(db_path: str | None = None) -> None:
    """Initialize SQLite database tables and run lightweight migrations if needed."""
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
              updated_at TEXT,
              evaluation_json TEXT,
              artifacts_json TEXT
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
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
              event_id TEXT PRIMARY KEY,
              workflow_id TEXT,
              task_id TEXT,
              agent TEXT,
              event_type TEXT,
              message TEXT,
              status TEXT,
              timestamp TEXT
            );
            """
        )
        # Ensure evaluation_json and artifacts_json columns exist in workflows
        cursor.execute("PRAGMA table_info(workflows);")
        columns = [col[1] for col in cursor.fetchall()]
        if "evaluation_json" not in columns:
            cursor.execute("ALTER TABLE workflows ADD COLUMN evaluation_json TEXT;")
        if "artifacts_json" not in columns:
            cursor.execute("ALTER TABLE workflows ADD COLUMN artifacts_json TEXT;")

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
              workflow_id, original_goal, requirements_json, status, created_at, updated_at,
              evaluation_json, artifacts_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                workflow.workflow_id,
                workflow.original_goal,
                json.dumps(workflow.requirements),
                workflow.status,
                workflow.created_at,
                workflow.updated_at,
                json.dumps(workflow.evaluation) if workflow.evaluation is not None else None,
                json.dumps(workflow.artifacts) if workflow.artifacts is not None else None,
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


def update_task_state(
    workflow_id: str,
    task_id: str,
    status: str,
    output: str | None = None,
    error: str | None = None,
    retry_count: int | None = None,
    db_path: str | None = None,
) -> None:
    """Update a task's status, output, error, or retry count."""
    path = get_db_path(db_path)
    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        updates = ["status = ?"]
        params = [status]

        if output is not None:
            updates.append("output = ?")
            params.append(output)
        if error is not None:
            updates.append("error = ?")
            params.append(error)
        if retry_count is not None:
            updates.append("retry_count = ?")
            params.append(retry_count)

        params.extend([task_id, workflow_id])
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE task_id = ? AND workflow_id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()
    finally:
        conn.close()


def update_workflow_state(
    workflow_id: str,
    status: str | None = None,
    evaluation: dict | None = None,
    artifacts: list[dict] | None = None,
    db_path: str | None = None,
) -> None:
    """Update workflow status, evaluation payload, or generated artifacts."""
    path = get_db_path(db_path)
    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        updates = ["updated_at = ?"]
        params = [now]

        if status is not None:
            updates.append("status = ?")
            params.append(status)
        if evaluation is not None:
            updates.append("evaluation_json = ?")
            params.append(json.dumps(evaluation))
        if artifacts is not None:
            updates.append("artifacts_json = ?")
            params.append(json.dumps(artifacts))

        params.append(workflow_id)
        query = f"UPDATE workflows SET {', '.join(updates)} WHERE workflow_id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()
    finally:
        conn.close()


def save_event(event: Event, db_path: str | None = None) -> None:
    """Persist an execution event to the events table."""
    path = get_db_path(db_path)
    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO events (event_id, workflow_id, task_id, agent, event_type, message, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event.event_id,
                event.workflow_id,
                event.task_id,
                event.agent,
                event.event_type,
                event.message,
                event.status,
                event.timestamp,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_events(workflow_id: str, db_path: str | None = None) -> list[Event]:
    """Retrieve all execution events for a workflow in chronological order."""
    path = get_db_path(db_path)
    if not os.path.exists(path):
        return []

    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT event_id, workflow_id, task_id, agent, event_type, message, status, timestamp
            FROM events
            WHERE workflow_id = ?
            ORDER BY timestamp ASC
            """,
            (workflow_id,),
        )
        rows = cursor.fetchall()
        return [
            Event(
                event_id=r[0],
                workflow_id=r[1],
                task_id=r[2],
                agent=r[3],
                event_type=r[4],
                message=r[5],
                status=r[6],
                timestamp=r[7],
            )
            for r in rows
        ]
    finally:
        conn.close()


def get_workflow(workflow_id: str, db_path: str | None = None) -> Workflow | None:
    """Retrieve a Workflow, its Tasks, evaluation, and artifacts by workflow_id."""
    path = get_db_path(db_path)
    if not os.path.exists(path):
        return None

    conn = sqlite3.connect(path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT workflow_id, original_goal, requirements_json, status, created_at, updated_at,
                   evaluation_json, artifacts_json
            FROM workflows
            WHERE workflow_id = ?
            """,
            (workflow_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None

        w_id, orig_goal, req_json, status, created_at, updated_at, eval_json, art_json = row

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
                    retry_count=retries or 0,
                )
            )

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
            evaluation=json.loads(eval_json) if eval_json else None,
            artifacts=json.loads(art_json) if art_json else [],
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
            retry_count=retries or 0,
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
