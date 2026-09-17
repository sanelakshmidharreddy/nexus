"""Sandboxed workspace tools for NEXUS agents.

All file operations and command executions are strictly restricted to:
workspace/generated_projects/<workflow_id>/
Path traversal attacks outside this sandbox are forbidden and blocked.
"""

import os
import subprocess
import time
from pathlib import Path

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORKSPACE_ROOT = os.path.abspath(os.path.join(BASE_DIR, "workspace", "generated_projects"))


class ToolSecurityError(Exception):
    """Raised when an operation attempts to escape the project sandbox."""
    pass


def get_sandbox_dir(workflow_id: str) -> str:
    """Return the absolute path to the sandbox directory for a workflow, creating it if needed."""
    clean_id = os.path.basename(workflow_id.strip())
    sandbox_path = os.path.abspath(os.path.join(WORKSPACE_ROOT, clean_id))
    os.makedirs(sandbox_path, exist_ok=True)
    return sandbox_path


def _resolve_safe_path(workflow_id: str, rel_path: str) -> str:
    """Resolve and validate that the target path remains inside the workflow sandbox."""
    sandbox_dir = get_sandbox_dir(workflow_id)
    norm_rel = os.path.normpath(rel_path.strip().lstrip("/\\"))
    target_abs = os.path.abspath(os.path.join(sandbox_dir, norm_rel))

    # Path traversal check
    if not (target_abs == sandbox_dir or target_abs.startswith(sandbox_dir + os.sep)):
        raise ToolSecurityError(f"Access denied: path '{rel_path}' escapes sandbox '{sandbox_dir}'")
    return target_abs


def write_file(workflow_id: str, rel_path: str, content: str) -> dict:
    """Safely write content to a file inside the workflow sandbox."""
    safe_path = _resolve_safe_path(workflow_id, rel_path)
    os.makedirs(os.path.dirname(safe_path), exist_ok=True)
    with open(safe_path, "w", encoding="utf-8") as f:
        f.write(content)
    size = os.path.getsize(safe_path)
    return {"status": "success", "file": rel_path, "bytes": size}


def read_file(workflow_id: str, rel_path: str) -> str:
    """Safely read content from a file inside the workflow sandbox."""
    safe_path = _resolve_safe_path(workflow_id, rel_path)
    if not os.path.exists(safe_path):
        raise FileNotFoundError(f"File '{rel_path}' not found in sandbox")
    with open(safe_path, "r", encoding="utf-8") as f:
        return f.read()


def edit_file(workflow_id: str, rel_path: str, search_str: str, replace_str: str) -> dict:
    """Safely replace a substring in a file inside the sandbox."""
    content = read_file(workflow_id, rel_path)
    if search_str not in content:
        return {"status": "warning", "message": f"Pattern '{search_str}' not found in {rel_path}"}
    updated = content.replace(search_str, replace_str, 1)
    write_file(workflow_id, rel_path, updated)
    return {"status": "success", "file": rel_path, "modified": True}


def list_directory(workflow_id: str, rel_path: str = "") -> list[dict]:
    """List directory contents within the sandbox."""
    safe_dir = _resolve_safe_path(workflow_id, rel_path)
    if not os.path.exists(safe_dir):
        return []

    items = []
    for root, dirs, files in os.walk(safe_dir):
        rel_root = os.path.relpath(root, safe_dir)
        for f in files:
            full_p = os.path.join(root, f)
            display_p = f if rel_root == "." else os.path.join(rel_root, f).replace("\\", "/")
            items.append({
                "name": f,
                "path": display_p,
                "size": os.path.getsize(full_p),
                "is_dir": False
            })
    return items


def run_command(workflow_id: str, command: str, timeout: int = 30) -> dict:
    """Execute a controlled command inside the workflow sandbox directory."""
    sandbox_dir = get_sandbox_dir(workflow_id)
    t0 = time.time()
    try:
        proc = subprocess.run(
            command,
            cwd=sandbox_dir,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        duration = round(time.time() - t0, 3)
        return {
            "status": "success" if proc.returncode == 0 else "failed",
            "exit_code": proc.returncode,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr.strip(),
            "duration": duration
        }
    except subprocess.TimeoutExpired as err:
        return {
            "status": "timeout",
            "exit_code": -1,
            "stdout": err.stdout.strip() if err.stdout else "",
            "stderr": f"Command timed out after {timeout} seconds",
            "duration": timeout
        }
    except Exception as exc:
        return {
            "status": "error",
            "exit_code": -1,
            "stdout": "",
            "stderr": str(exc),
            "duration": round(time.time() - t0, 3)
        }
