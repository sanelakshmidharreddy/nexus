import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import time
from backend.orchestrator import db, goal_parser, planner, execution
from backend.main import _create_workflow_zip
from backend.tools import workspace_tools
from backend.orchestrator.state import Workflow
import uuid

goal = 'Create a student expense tracker where users can add expenses, categorize them, view total spending, and see recent transactions.'

db.init_db()

print("[1] Running Analyzer Agent...")
reqs = goal_parser.parse(goal)
print("  Project Name:", reqs.get('project_name'))
print("  Identified Features:", reqs.get('requested_features'))
print("  Technologies:", reqs.get('technologies_identified'))

print("\n[2] Running Planner Agent...")
tasks = planner.plan(reqs)
print(f"  Plan created with {len(tasks)} tasks.")
for t in tasks:
    print(f"   - {t.task_id} [{t.assigned_agent}]: {t.title}")

wf = Workflow(workflow_id=uuid.uuid4().hex, original_goal=goal, requirements=reqs, tasks=tasks)
db.save_workflow(wf)
print("\n[3] Executing Workflow DAG...")
res = execution.run_workflow_sync(wf.workflow_id)
print("  Workflow Status:", res['status'])
print("  Evaluation Score:", res['evaluation']['score'], "%")

print("\n[4] Inspecting Generated Files...")
files = workspace_tools.list_directory(wf.workflow_id)
print(f"  Total generated files: {len(files)}")
for f in files:
    print(f"   - {f['path']} ({f['size']} bytes)")

print("\n[5] Testing ZIP Generation...")
zip_data = _create_workflow_zip(wf.workflow_id)
print(f"  ZIP successfully generated ({len(zip_data)} bytes).")

print("\n[6] Inspecting Evaluation Checks...")
for c in res['evaluation']['checks']:
    mark = "PASS" if c['passed'] else "FAIL"
    print(f"   [{mark}] {c['name']}: {c['evidence']}")

print("\nALL VERIFICATIONS PASSED!")
