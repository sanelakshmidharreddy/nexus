# NEXUS — AI Agent Orchestration Platform

NEXUS turns a natural-language goal into a dependency-aware plan, assigns each task to the right specialist agent, executes and monitors that plan, recovers from failures by re-diagnosing and retrying, and verifies the final result against original requirements.

This repository currently implements **Phase 1 (Orchestrator Core)**: goal parsing, structured requirements extraction, dependency-aware task planning with topological DAG validation, agent assignment, and workflow persistence in SQLite.

---

## 1. Installation

Create and activate a virtual environment, then install dependencies:

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

---

## 2. Ollama Setup

Ensure the local Ollama model service is running and the default model (`qwen2.5:7b-instruct`) is pulled:

```bash
# In a separate terminal, if Ollama isn't already running:
ollama serve

# Pull the default model
ollama pull qwen2.5:7b-instruct
```

Environment variables (optional overrides):
- `OLLAMA_MODEL`: Target model (default: `qwen2.5:7b-instruct`)
- `OLLAMA_HOST`: Target Ollama host URL (default: `http://localhost:11434`)
- `NEXUS_DB_PATH`: SQLite database file path (default: `backend/nexus.db`)

---

## 3. Run & Test Commands

Start the FastAPI application:

```bash
uvicorn backend.main:app --reload --port 8000
```

### Health Check

```bash
curl http://localhost:8000/health
```
Expected response:
```json
{"status": "ok", "model": "qwen2.5:7b-instruct"}
```

### Submit a Goal

```bash
curl -X POST http://localhost:8000/goals \
  -H "Content-Type: application/json" \
  -d '{"goal": "Build a RoadSafe-style accident analytics dashboard from this dataset."}'
```

### Inspect Workflow and Tasks

Copy the returned `workflow_id`, then:

```bash
curl http://localhost:8000/workflows/<workflow_id>
curl http://localhost:8000/workflows/<workflow_id>/tasks/T1
```

## 4. Architecture & Future-Phase Compatibility

- `backend/orchestrator/`: Core planning and state management.
- `backend/agents/`: Specialist agents (Research, Data, UI, Developer, QA, Evaluator) — implemented in Phase 2.
- `backend/tools/`: Sandboxed tool execution restricted to `workspace/generated_projects/` — implemented in Phase 3.
- `backend/evaluator/`: Requirement-based verification of final deliverables — implemented in Phase 5.
- `backend/memory/`: Cross-task context and decision history — implemented in Phase 5.

---

## 5. Frontend Command Center

A React + Vite command center interface connects to the FastAPI backend:

```bash
cd frontend
npm install
npm run dev
```

Open the command center in any web browser:
- **Command Center UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **FastAPI Documentation**: `http://localhost:8000/docs`

Features included:
- Realtime backend health & Ollama model telemetry.
- Natural-language mission directive input with RoadSafe presets.
- Dependency-aware topological DAG task graph renderer.
- Specialist agent swarm monitoring (Research, Data, UI, Developer, QA, Evaluator).
- Realtime audit stream / execution log.
- Adaptive failure detection and self-healing recovery loop visualizer.
- Generated project artifacts explorer (`workspace/generated_projects/`).
- Evaluator verification checklist.
- Verified product summary with interactive RoadSafe Analytics Dashboard preview.

