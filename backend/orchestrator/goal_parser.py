"""Analyzer Agent: transforms developer natural-language goals into structured engineering requirements."""

import json
import logging
import os
import re
from backend.orchestrator import model

logger = logging.getLogger("nexus.goal_parser")


class GoalParsingError(Exception):
    """Raised when the model fails to return valid structured requirements."""
    pass


REQUIRED_KEYS = (
    "project_name",
    "objective",
    "domain",
    "requested_features",
    "constraints",
    "technologies_identified",
    "expected_output",
    "ui_requirements",
    "technical_requirements",
)


def _build_deterministic_requirements(goal: str) -> dict:
    """Generate high-fidelity requirements tailored to the developer's prompt when offline."""
    clean_goal = goal.strip()
    lower_goal = clean_goal.lower()

    # Detect theme / project type
    if any(k in lower_goal for k in ("expense", "finance", "money", "budget", "tracker", "student")):
        project_name = "Student Expense Tracker"
        domain = "Personal Finance & Budget Management"
        features = [
            "Add and track student expenses with amount, category, and date",
            "Categorize expenses (Food, Books, Tuition, Rent, Entertainment)",
            "View total spending and monthly budget utilization",
            "Recent transactions feed with edit and delete capabilities",
            "Category breakdown visualization and spending alerts"
        ]
        frontend_tech = "React 18 + Vite (Tailwind / Modern CSS)"
        backend_tech = "FastAPI (Python 3.11+)"
        database_tech = "SQLite (Local relational database)"
        apis = [
            "POST /api/expenses - Record new expense transaction",
            "GET /api/expenses - List all expenses with pagination & filters",
            "GET /api/expenses/summary - Get total spend & category breakdown",
            "DELETE /api/expenses/{id} - Remove transaction",
            "GET /api/categories - List available expense categories"
        ]
    elif any(k in lower_goal for k in ("task", "kanban", "todo", "project")):
        project_name = "Developer Task Kanban"
        domain = "Developer Productivity & Workflow Management"
        features = [
            "Create, update, and manage task cards across stages",
            "Kanban board workflow (Backlog, In Progress, Review, Done)",
            "Tagging by priority, deadline, and component",
            "Task search and stage filtering",
            "Activity timeline of recent task updates"
        ]
        frontend_tech = "React 18 + Vite"
        backend_tech = "FastAPI (Python)"
        database_tech = "SQLite"
        apis = [
            "POST /api/tasks - Create new task",
            "GET /api/tasks - List all tasks by board column",
            "PUT /api/tasks/{id} - Update task status / details",
            "DELETE /api/tasks/{id} - Delete task"
        ]
    else:
        project_name = "Developer Project Builder"
        domain = "Custom Developer Tooling & Automation"
        features = [
            f"Core workflow implementation for: {clean_goal[:60]}",
            "Interactive responsive dashboard interface",
            "RESTful API integration with robust data persistence",
            "Real-time state management and data filtering"
        ]
        frontend_tech = "React 18 + Vite"
        backend_tech = "FastAPI (Python)"
        database_tech = "SQLite"
        apis = [
            "GET /api/items - Retrieve list of records",
            "POST /api/items - Create new record",
            "GET /api/summary - Dashboard analytics and metrics"
        ]

    return {
        "project_name": project_name,
        "objective": clean_goal,
        "domain": domain,
        "requested_features": features,
        "constraints": [
            "FastAPI backend architecture with typed Pydantic schemas",
            "Pure client-side React frontend with clean component architecture",
            "Zero external proprietary runtime dependencies",
            "SQLite relational persistence with auto-migration",
            "Production-ready project structure with full ZIP exportability"
        ],
        "technologies_identified": {
            "frontend": frontend_tech,
            "backend": backend_tech,
            "database": database_tech,
            "apis": apis,
        },
        "expected_output": f"Full runnable {project_name} codebase with frontend, backend, database models, and README.",
        "ui_requirements": [
            "Modern developer-grade responsive interface",
            "Interactive form for real-time input and instant updates",
            "Summary telemetry cards for key metrics and totals",
            "Clean tabular / card feed for transaction or item records"
        ],
        "technical_requirements": [
            "FastAPI async routing with CORS middleware enabled",
            "SQLite database with initialization script and safe transactions",
            "Clean separation between frontend components and API client service",
            "Complete package.json, requirements.txt, and runnable README.md"
        ]
    }


SYSTEM_PROMPT = """You are the NEXUS Analyzer Agent, a world-class AI Software Architect.
Analyze the developer's natural-language requirement and return a structured JSON engineering specification.
You must return a JSON object with EXACTLY these keys:
{
  "project_name": "Short, clear project title",
  "objective": "Concise summary of developer goal",
  "domain": "Application domain",
  "requested_features": ["Feature 1", "Feature 2", ...],
  "constraints": ["Constraint 1", ...],
  "technologies_identified": {
    "frontend": "e.g. React 18 + Vite",
    "backend": "e.g. FastAPI (Python)",
    "database": "e.g. SQLite",
    "apis": ["POST /api/...", "GET /api/..."]
  },
  "expected_output": "Description of the generated project package",
  "ui_requirements": ["UI requirement 1", ...],
  "technical_requirements": ["Tech requirement 1", ...]
}
Return ONLY valid JSON. No conversational commentary."""


def parse(goal: str, prefer_deterministic: bool = False) -> dict:
    """Analyze developer requirement into structured engineering requirements."""
    if not goal or not goal.strip():
        raise GoalParsingError("Goal cannot be empty")

    demo_mode = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    if prefer_deterministic or demo_mode:
        logger.info("Using deterministic analyzer specification (demo mode)")
        return _build_deterministic_requirements(goal)

    user_prompt = f"Developer Requirement:\n{goal}\n\nProduce the structured engineering requirement JSON."
    try:
        raw_json = model.generate_json(user_prompt, system=SYSTEM_PROMPT)
        cleaned = model.clean_json_text(raw_json)
        data = json.loads(cleaned)
        
        # Ensure all required keys exist
        reqs = _build_deterministic_requirements(goal)
        for key in REQUIRED_KEYS:
            if key in data and data[key]:
                reqs[key] = data[key]
        return reqs
    except Exception as exc:
        logger.warning(f"Analyzer LLM call failed ({exc}); falling back to intelligent deterministic requirements.")
        return _build_deterministic_requirements(goal)
