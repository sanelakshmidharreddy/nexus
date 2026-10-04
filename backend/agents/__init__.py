"""Specialist agents for NEXUS: Analyzer, Planner, Code Generator, Evaluator."""

from backend.agents.code_generator import generate_project_files
from backend.evaluator.evaluator import evaluate_deliverable

# For backwards compatibility with any existing scripts or tests
def execute_developer_agent(workflow_id: str, goal: str, requirements: dict, inject_defect: bool = False):
    return generate_project_files(workflow_id, goal, requirements)

def execute_qa_agent(workflow_id: str):
    res = evaluate_deliverable(workflow_id, "", {}, [])
    return res

def execute_research_agent(workflow_id: str, goal: str, requirements: dict):
    return {"status": "success", "agent": "analyzer", "summary": "Requirements analyzed and scoped."}

def execute_data_agent(workflow_id: str, goal: str, requirements: dict):
    return {"status": "success", "agent": "planner", "summary": "Architecture & data schema designed."}

def execute_ui_agent(workflow_id: str, goal: str, requirements: dict):
    return {"status": "success", "agent": "ui", "summary": "UI component tree planned."}

__all__ = [
    "generate_project_files",
    "evaluate_deliverable",
    "execute_developer_agent",
    "execute_qa_agent",
    "execute_research_agent",
    "execute_data_agent",
    "execute_ui_agent",
]
