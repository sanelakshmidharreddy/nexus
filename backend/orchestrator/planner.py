"""Planner: transforms structured requirements into a dependency-aware plan."""

import json
import logging
import re
from backend.orchestrator import model
from backend.orchestrator.state import (
    Task,
    VALID_AGENTS,
    validate_dag,
)

logger = logging.getLogger("orchestrator.planner")

DETERMINISTIC_FALLBACK_SPEC = [
    ("T1", "Understand goal and requirements", "Analyze the goal, extract domain constraints, and establish scope.", "research", []),
    ("T2", "Inspect and analyze input data", "Examine schema, clean fields, and inspect input dataset structure.", "data", ["T1"]),
    ("T3", "Define analytics/output requirements", "Formulate core analytics algorithms, metric calculations, and output expectations.", "research", ["T2"]),
    ("T4", "Design UI/output structure", "Create component layout, chart views, and interaction hierarchy.", "ui", ["T3"]),
    ("T5", "Generate the deliverable", "Implement core codebase, UI components, and data processing pipeline.", "developer", ["T4"]),
    ("T6", "Run build/tests", "Execute builds, unit tests, and verify code integrity.", "qa", ["T5"]),
    ("T7", "Recover from failure if required", "Diagnose any build, execution, or validation defects and apply corrections.", "developer", ["T6"]),
    ("T8", "Evaluate final result against goal", "Perform comprehensive verification against original requirements.", "evaluator", ["T7"]),
]


def resolve_agent(suggested_agent: str | None, title: str, description: str) -> str:
    """Resolve assigned agent using model suggestion with deterministic keyword fallback."""
    if suggested_agent:
        cleaned = suggested_agent.strip().lower()
        if cleaned in VALID_AGENTS:
            return cleaned

    # Deterministic keyword fallback per Section 9
    text = f"{title} {description}".lower()
    if any(re.search(pat, text) for pat in (r"\bdata\b", r"\bdataset", r"analy")):
        return "data"
    if any(re.search(pat, text) for pat in (r"\bui\b", r"design", r"dashboard layout")):
        return "ui"
    if any(re.search(pat, text) for pat in (r"generate", r"implement", r"code", r"build the")):
        return "developer"
    if any(re.search(pat, text) for pat in (r"test", r"\bqa\b", r"verify build")):
        return "qa"
    if any(re.search(pat, text) for pat in (r"evaluate", r"requirement check")):
        return "evaluator"
    return "research"


def _clean_json_text(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _build_deterministic_fallback() -> list[Task]:
    """Generate the deterministic 8-task fallback plan."""
    tasks = []
    for task_id, title, desc, agent, deps in DETERMINISTIC_FALLBACK_SPEC:
        tasks.append(
            Task(
                task_id=task_id,
                title=title,
                description=desc,
                assigned_agent=agent,
                dependencies=deps,
                status="pending",
                input_context={},
                output=None,
                error=None,
                retry_count=0,
            )
        )
    validate_dag(tasks)
    return tasks


def _parse_and_validate_tasks(raw_json: str) -> list[Task]:
    """Parse raw model output and construct validated Task objects."""
    cleaned = _clean_json_text(raw_json)
    data = json.loads(cleaned)

    # Allow { "tasks": [...] } or direct [...]
    if isinstance(data, dict) and "tasks" in data:
        raw_list = data["tasks"]
    elif isinstance(data, list):
        raw_list = data
    else:
        raise ValueError("Model output must be a JSON array of tasks or an object with a 'tasks' array")

    count = len(raw_list)
    if not (5 <= count <= 8):
        raise ValueError(f"Task count must be between 5 and 8, got {count}")

    # Temporary mapping of original identifiers to T1..Tn
    temp_id_to_final = {}
    for idx, item in enumerate(raw_list):
        final_id = f"T{idx + 1}"
        # Record any identifier the model might have provided
        if isinstance(item, dict):
            if "task_id" in item and item["task_id"]:
                temp_id_to_final[str(item["task_id"]).strip()] = final_id
            temp_id_to_final[str(idx + 1)] = final_id
            temp_id_to_final[str(idx)] = final_id
            temp_id_to_final[final_id] = final_id

    final_task_ids = {f"T{i + 1}" for i in range(count)}

    tasks: list[Task] = []
    for idx, item in enumerate(raw_list):
        if not isinstance(item, dict):
            raise ValueError(f"Task at index {idx} is not an object")

        task_id = f"T{idx + 1}"
        title = str(item.get("title", f"Task {task_id}")).strip()
        description = str(item.get("description", "")).strip()
        suggested_agent = item.get("suggested_agent") or item.get("assigned_agent")
        assigned_agent = resolve_agent(suggested_agent, title, description)

        raw_deps = item.get("dependencies", [])
        if not isinstance(raw_deps, list):
            raw_deps = []

        resolved_deps: list[str] = []
        for dep in raw_deps:
            dep_str = str(dep).strip()
            if dep_str in temp_id_to_final:
                target = temp_id_to_final[dep_str]
                if target != task_id and target not in resolved_deps:
                    resolved_deps.append(target)
            elif dep_str in final_task_ids:
                if dep_str != task_id and dep_str not in resolved_deps:
                    resolved_deps.append(dep_str)
            else:
                # Dependency refers to a nonexistent task ID
                raise ValueError(f"Unknown dependency '{dep_str}' in task {task_id}")

        tasks.append(
            Task(
                task_id=task_id,
                title=title,
                description=description,
                assigned_agent=assigned_agent,
                dependencies=resolved_deps,
                status="pending",
                input_context={},
                output=None,
                error=None,
                retry_count=0,
            )
        )

    # Validate DAG (acyclic & dependency existence)
    validate_dag(tasks)
    return tasks


def plan(requirements: dict, prefer_deterministic: bool = False) -> list[Task]:
    """Generate a 5-to-8 task dependency-aware plan from structured requirements.
    
    Retries once on invalid model output.
    Falls back to the deterministic 8-task template if model output fails twice.
    """
    import os
    if prefer_deterministic or os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes") or os.environ.get("NEXUS_DEMO_FAST", "").lower() in ("1", "true", "yes"):
        logger.info("Using fast deterministic plan for demo execution.")
        return _build_deterministic_fallback()

    req_json = json.dumps(requirements, indent=2)
    base_prompt = f"""You are an expert software project architect.
Given the following structured project requirements, generate a dependency-aware plan of 5 to 8 tasks.
Return ONLY a valid JSON array of task objects (no markdown fences, no explanatory text).

Each task object must have:
- "title": concise task title
- "description": clear explanation of work to perform
- "suggested_agent": one of ["research", "data", "ui", "developer", "qa", "evaluator"]
- "dependencies": array of task IDs that this task depends on (e.g. ["T1"]). The first task must have empty dependencies [].

Number tasks sequentially from T1 to T{{count}} (between 5 and 8 tasks total). Every dependency MUST be a valid earlier task ID (e.g. T1, T2).
Do NOT introduce circular dependencies.

Requirements:
{req_json}
"""

    system_instruction = "You are an orchestration planner that outputs strictly raw JSON arrays of 5 to 8 dependency-aware tasks."

    # Attempt 1
    try:
        raw_response = model.generate_json(base_prompt, system=system_instruction)
        try:
            return _parse_and_validate_tasks(raw_response)
        except (json.JSONDecodeError, ValueError) as err:
            logger.warning(
                "Planner attempt 1 failed: %s. Raw model output:\n%s",
                err,
                raw_response,
            )

        # Attempt 2 (retry with corrective instruction)
        retry_prompt = (
            base_prompt
            + "\n\nCRITICAL: Your previous response was invalid. Ensure you output a valid JSON array of exactly 5 to 8 tasks, with acyclic dependencies referencing only real earlier task IDs (T1..Tn). Respond with raw JSON ONLY."
        )
        raw_response_2 = model.generate_json(retry_prompt, system=system_instruction)
        try:
            return _parse_and_validate_tasks(raw_response_2)
        except (json.JSONDecodeError, ValueError) as err:
            logger.error(
                "Planner attempt 2 failed: %s. Falling back to deterministic template. Raw model output:\n%s",
                err,
                raw_response_2,
            )
            return _build_deterministic_fallback()
    except model.ModelConnectionError as exc:
        logger.warning("Ollama unreachable (%s). Using deterministic plan fallback for demo.", exc)
        return _build_deterministic_fallback()
