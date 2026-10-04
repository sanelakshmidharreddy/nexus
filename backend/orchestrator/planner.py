"""Planner Agent: transforms structured requirements into an execution plan and task DAG."""

import json
import logging
import os
import re
from backend.orchestrator import model
from backend.orchestrator.state import Task, validate_dag

logger = logging.getLogger("nexus.planner")


def build_execution_plan(requirements: dict) -> dict:
    """Construct structured execution plan from requirements."""
    tech = requirements.get("technologies_identified", {})
    features = requirements.get("requested_features", [])
    project_name = requirements.get("project_name", "Developer Project")
    objective = requirements.get("objective", "Build a production-grade application")

    frontend_tech = tech.get("frontend", "React 18 + Vite (Tailwind / Modern CSS)")
    backend_tech = tech.get("backend", "FastAPI (Python 3.11+)")
    database_tech = tech.get("database", "SQLite Relational Database")
    apis = tech.get("apis", [
        "GET /api/items - Retrieve list of records",
        "POST /api/items - Create new record",
        "GET /api/summary - Summary telemetry and metrics"
    ])

    structure = [
        "frontend/src/App.jsx",
        "frontend/src/components/ExpenseList.jsx" if "expense" in project_name.lower() else "frontend/src/components/MainView.jsx",
        "frontend/src/components/ExpenseForm.jsx" if "expense" in project_name.lower() else "frontend/src/components/ActionForm.jsx",
        "frontend/package.json",
        "backend/main.py",
        "backend/models.py",
        "backend/database.py",
        "backend/requirements.txt",
        "README.md",
        "index.html",
    ]

    return {
        "project_name": project_name,
        "objective": objective,
        "frontend": frontend_tech,
        "backend": backend_tech,
        "database": database_tech,
        "features": features,
        "apis": apis,
        "architecture": f"Modern decoupled client-server architecture with {frontend_tech} web frontend consuming {backend_tech} REST endpoints backed by {database_tech}.",
        "project_structure": structure,
    }


def plan(requirements: dict, prefer_deterministic: bool = False) -> list[Task]:
    """Generate the structured DAG tasks to fulfill the requirements."""
    plan_meta = build_execution_plan(requirements)
    requirements["execution_plan"] = plan_meta

    tasks = [
        Task(
            task_id="T1",
            title="Requirement Analysis & Specification",
            description=f"Analyze developer goal: '{plan_meta['objective'][:80]}', extract domain constraints, and identify target technology stack.",
            assigned_agent="analyzer",
            dependencies=[],
            status="pending",
        ),
        Task(
            task_id="T2",
            title="System Architecture & API Planning",
            description=f"Formulate system contract, {plan_meta['database']} schema, {plan_meta['backend']} endpoints, and {plan_meta['frontend']} component tree.",
            assigned_agent="planner",
            dependencies=["T1"],
            status="pending",
        ),
        Task(
            task_id="T3",
            title="Frontend Component Code Generation",
            description="Generate responsive React client UI with interactive state, forms, telemetry dashboards, and API client integration.",
            assigned_agent="code_generator",
            dependencies=["T2"],
            status="pending",
        ),
        Task(
            task_id="T4",
            title="Backend API & Database Model Generation",
            description="Generate FastAPI application, async router endpoints, Pydantic validation schemas, and SQLite database migration scripts.",
            assigned_agent="code_generator",
            dependencies=["T3"],
            status="pending",
        ),
        Task(
            task_id="T5",
            title="Project Manifests & Documentation Generation",
            description="Generate package.json, requirements.txt, environment configurations, standalone web preview, and comprehensive README.md.",
            assigned_agent="code_generator",
            dependencies=["T4"],
            status="pending",
        ),
        Task(
            task_id="T6",
            title="Automated Project Evaluation & Integrity Verification",
            description="Validate generated project structure, ensure file safety, verify frontend-backend API contracts, and confirm zero missing dependencies.",
            assigned_agent="evaluator",
            dependencies=["T5"],
            status="pending",
        ),
    ]

    validate_dag(tasks)
    return tasks
