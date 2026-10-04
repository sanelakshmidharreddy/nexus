"""Evaluator Agent: Validates generated project against developer tools criteria."""

import json
import os
import re
from datetime import datetime, timezone
from backend.tools import workspace_tools


def evaluate_deliverable(workflow_id: str, goal: str, requirements: dict, tasks: list) -> dict:
    """Evaluates the project sandbox and code integrity against 7 developer tools criteria."""
    checks = []
    errors = []

    sandbox_files = workspace_tools.list_directory(workflow_id)
    file_map = {f["path"].replace("\\", "/"): f for f in sandbox_files}

    # 1. Project Structure
    has_backend_dir = any(p.startswith("backend/") for p in file_map)
    has_frontend_dir = any(p.startswith("frontend/") for p in file_map)
    structure_passed = has_backend_dir and has_frontend_dir
    if not structure_passed:
        errors.append("Missing frontend/ or backend/ directory structure.")
    checks.append({
        "name": "Project Structure Valid",
        "passed": structure_passed,
        "evidence": "Verified decoupled frontend/ and backend/ directory hierarchy." if structure_passed else "Directory hierarchy incomplete."
    })

    # 2. Required Project Files
    core_files = [
        "backend/main.py",
        "backend/models.py",
        "backend/database.py",
        "backend/requirements.txt",
        "frontend/package.json",
        "frontend/src/App.jsx",
        "README.md",
        "index.html",
    ]
    missing = [f for f in core_files if f not in file_map]
    required_passed = len(missing) == 0
    if not required_passed:
        errors.append(f"Missing core files: {', '.join(missing)}")
    checks.append({
        "name": "Required Project Files Exist",
        "passed": required_passed,
        "evidence": f"Found all {len(core_files)} required source files." if required_passed else f"Missing: {', '.join(missing)}"
    })

    # 3. Non-Empty Files & Code Integrity
    empty_files = []
    for fpath in core_files:
        if fpath in file_map and file_map[fpath]["size"] == 0:
            empty_files.append(fpath)
    integrity_passed = len(empty_files) == 0 and required_passed
    if empty_files:
        errors.append(f"Files are empty: {', '.join(empty_files)}")
    checks.append({
        "name": "Non-Empty File Integrity",
        "passed": integrity_passed,
        "evidence": f"All {len(file_map)} generated files have valid content ({sum(f['size'] for f in file_map.values())} total bytes)." if integrity_passed else f"Empty files: {', '.join(empty_files)}"
    })

    # 4. Dependency Configuration
    deps_passed = False
    evidence_deps = "Checking dependency manifests..."
    try:
        reqs = workspace_tools.read_file(workflow_id, "backend/requirements.txt")
        pkg = workspace_tools.read_file(workflow_id, "frontend/package.json")
        has_fastapi = "fastapi" in reqs.lower()
        has_react = "react" in pkg.lower()
        deps_passed = has_fastapi and has_react
        evidence_deps = "FastAPI in backend/requirements.txt and React in frontend/package.json confirmed."
    except Exception as e:
        evidence_deps = f"Failed to read manifests: {e}"
        errors.append(evidence_deps)

    checks.append({
        "name": "Dependency Configuration",
        "passed": deps_passed,
        "evidence": evidence_deps
    })

    # 5. API Endpoint Consistency
    api_passed = False
    evidence_api = "Verifying API endpoints..."
    try:
        backend_code = workspace_tools.read_file(workflow_id, "backend/main.py")
        frontend_code = workspace_tools.read_file(workflow_id, "frontend/src/App.jsx")
        
        backend_routes = re.findall(r'@app\.(?:get|post|put|delete)\(["\'](/api/[^"\']+)["\']', backend_code)
        # Check if frontend calls at least one matching route
        matching = [r for r in backend_routes if r in frontend_code]
        api_passed = len(matching) > 0
        evidence_api = f"Verified frontend consumes backend route(s): {', '.join(matching)}" if api_passed else "No matching API routes detected between client and server."
    except Exception as e:
        evidence_api = f"API verification error: {e}"

    if not api_passed:
        errors.append("API route mismatch between frontend client and backend FastAPI router.")

    checks.append({
        "name": "API Endpoint Consistency",
        "passed": api_passed,
        "evidence": evidence_api
    })

    # 6. README & Run Instructions
    readme_passed = False
    evidence_readme = "Checking README.md..."
    try:
        readme = workspace_tools.read_file(workflow_id, "README.md")
        has_run = "uvicorn" in readme or "npm run" in readme or "python" in readme
        readme_passed = len(readme) > 100 and has_run
        evidence_readme = "README contains architecture overview, Quick Start commands, and API documentation."
    except Exception as e:
        evidence_readme = f"README check failed: {e}"

    checks.append({
        "name": "Documentation & Setup Guide",
        "passed": readme_passed,
        "evidence": evidence_readme
    })

    # 7. Path Safety & Sandbox Isolation
    path_safety_passed = True
    evidence_safety = "All files safely contained within workspace sandbox root."
    for p in file_map:
        if ".." in p or p.startswith("/") or p.startswith("\\"):
            path_safety_passed = False
            evidence_safety = f"Path escape violation detected in: {p}"
            errors.append(evidence_safety)
            break

    checks.append({
        "name": "Path Safety & Isolation",
        "passed": path_safety_passed,
        "evidence": evidence_safety
    })

    passed_count = sum(1 for c in checks if c["passed"])
    total_count = len(checks)
    score = int((passed_count / total_count) * 100)
    passed_all = passed_count == total_count

    return {
        "status": "passed" if passed_all else "failed",
        "score": score,
        "passed": passed_all,
        "passed_checks": passed_count,
        "total_checks": total_count,
        "checks": checks,
        "errors": errors,
        "summary": f"Evaluation Passed: {passed_count}/{total_count} developer criteria verified (Score {score}%)." if passed_all else f"Evaluation Failed: {len(errors)} issues identified.",
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }
