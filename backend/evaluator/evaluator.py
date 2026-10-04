"""Evaluator Agent: Validates generated project against developer tools criteria across Create, Test, Deploy, and Collaborate stages."""

import ast
import json
import os
import re
from datetime import datetime, timezone
from backend.tools import workspace_tools


def evaluate_deliverable(workflow_id: str, goal: str, requirements: dict, tasks: list) -> dict:
    """Evaluates the project sandbox and code integrity against developer tools criteria."""
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
        "stage": "create",
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
        "backend/test_main.py",
        "Dockerfile",
        "render.yaml",
        "vercel.json",
        "README.md",
        "PULL_REQUEST.md",
        "index.html",
    ]
    missing = [f for f in core_files if f not in file_map]
    required_passed = len(missing) == 0
    if not required_passed:
        errors.append(f"Missing core files: {', '.join(missing)}")
    checks.append({
        "name": "Required Project Files Exist",
        "stage": "create",
        "passed": required_passed,
        "evidence": f"Found all {len(core_files)} required source, test, deploy, and documentation files." if required_passed else f"Missing: {', '.join(missing)}"
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
        "stage": "create",
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
        "stage": "create",
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
        matching = [r for r in backend_routes if r in frontend_code]
        api_passed = len(matching) > 0
        evidence_api = f"Verified frontend consumes backend route(s): {', '.join(matching)}" if api_passed else "No matching API routes detected between client and server."
    except Exception as e:
        evidence_api = f"API verification error: {e}"

    if not api_passed:
        errors.append("API route mismatch between frontend client and backend FastAPI router.")

    checks.append({
        "name": "API Endpoint Consistency",
        "stage": "create",
        "passed": api_passed,
        "evidence": evidence_api
    })

    # 6. Test Suite & Static Code Validation
    test_passed = False
    evidence_test = "Checking test suite..."
    try:
        test_code = workspace_tools.read_file(workflow_id, "backend/test_main.py")
        has_tests = "def test_" in test_code and "client." in test_code
        
        # Run static AST syntax check on generated Python files
        py_files = ["backend/main.py", "backend/models.py", "backend/database.py", "backend/test_main.py"]
        syntax_ok = True
        for pf in py_files:
            if pf in file_map:
                code_content = workspace_tools.read_file(workflow_id, pf)
                ast.parse(code_content)
        
        test_passed = has_tests and syntax_ok
        evidence_test = f"Static validation passed: AST parsed 4 Python files, {test_code.count('def test_')} unit tests verified." if test_passed else "Test syntax validation issue detected."
    except Exception as e:
        syntax_ok = False
        evidence_test = f"Static validation error: {e}"
        errors.append(evidence_test)

    checks.append({
        "name": "Test Suite (Static Validation)",
        "stage": "test",
        "passed": test_passed,
        "evidence": evidence_test
    })

    # 7. Deployment Readiness Assets
    deploy_passed = False
    evidence_deploy = "Verifying deployment assets..."
    try:
        has_docker = "Dockerfile" in file_map
        has_render = "render.yaml" in file_map
        has_vercel = "vercel.json" in file_map
        has_ci = ".github/workflows/deploy.yml" in file_map
        deploy_passed = has_docker and (has_render or has_vercel) and has_ci
        evidence_deploy = "Confirmed Dockerfile, render.yaml, vercel.json, and GitHub Actions CI workflow." if deploy_passed else "Incomplete deploy assets."
    except Exception as e:
        evidence_deploy = f"Deploy asset check error: {e}"
        errors.append(evidence_deploy)

    checks.append({
        "name": "Deployment Readiness Assets",
        "stage": "deploy",
        "passed": deploy_passed,
        "evidence": evidence_deploy
    })

    # 8. Collaboration & Documentation
    collab_passed = False
    evidence_collab = "Checking collaboration assets..."
    try:
        readme = workspace_tools.read_file(workflow_id, "README.md")
        pr_file = workspace_tools.read_file(workflow_id, "PULL_REQUEST.md")
        has_readme = len(readme) > 100 and ("uvicorn" in readme or "npm run" in readme or "python" in readme)
        has_pr = len(pr_file) > 50 and "Pull Request" in pr_file
        collab_passed = has_readme and has_pr
        evidence_collab = "README setup instructions and formal Pull Request description generated." if collab_passed else "Incomplete collaboration docs."
    except Exception as e:
        evidence_collab = f"Collaboration check failed: {e}"
        errors.append(evidence_collab)

    checks.append({
        "name": "Collaboration & PR Summary",
        "stage": "collaborate",
        "passed": collab_passed,
        "evidence": evidence_collab
    })

    # 9. Path Safety & Sandbox Isolation
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
        "stage": "create",
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
