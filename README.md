# NEXUS — Autonomous AI Agent Orchestration Platform

NEXUS turns a natural-language goal into a dependency-aware plan, assigns each task to the right specialist agent, executes and monitors that plan, recovers from failures by re-diagnosing and retrying, and verifies the final result against original requirements.

---

## Deployment Architecture

```
JUDGE / USER
     │
     ▼
Vercel React/Vite Frontend (https://nexus-livid-six.vercel.app)
     │  HTTPS
     ▼
Render FastAPI Backend (uvicorn backend.main:app)
     │
     ▼
NEXUS Orchestrator Core (topological DAG, SQLite persistence)
     │
     ▼
Specialist Agents (Research, Data, UI, Developer, QA, Evaluator)
     │
     ▼
Deterministic Fallback Engine (when local Ollama is offline)
```

---

## 1. Local Development

### Backend Setup

Create and activate a virtual environment, then install dependencies:

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

Start the FastAPI application:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **FastAPI Documentation**: `http://localhost:8000/docs`

### Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

- **Frontend Command Center UI**: `http://localhost:5173`

*(The frontend automatically defaults to `http://localhost:8000` in local development).*

### Optional: Local Ollama Setup

If you wish to use a local LLM rather than the built-in deterministic benchmark engine:

```bash
ollama serve
ollama pull qwen2.5:7b-instruct
```

Environment variables (optional overrides):
- `OLLAMA_MODEL`: Target model (default: `qwen2.5:7b-instruct`)
- `OLLAMA_HOST`: Target Ollama host URL (default: `http://localhost:11434`)
- `DEMO_MODE`: Enable deterministic fallback benchmark mode (`true` by default)
- `NEXUS_DB_PATH`: SQLite database path (default: `backend/nexus.db`)

---

## 2. Production Deployment

### Backend: Render

1. Create a new **Web Service** on Render connected to this repository.
2. Configure the service settings:
   - **Root Directory**: *(Leave blank / repository root)*
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Add Environment Variables:
   - `DEMO_MODE`: `true`
   - `PYTHON_VERSION`: `3.11.9`
4. Deploy the service. Once deployed, note your public Render URL (e.g., `https://nexus-orchestrator-backend.onrender.com`).

*(Note: The included `render.yaml` at the repository root pre-configures these settings automatically).*

### Frontend: Vercel

1. In the Vercel dashboard, open your project (`nexus-livid-six` or new project).
2. Navigate to **Settings** -> **Environment Variables**.
3. Add the following variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `<Your Render Backend URL>` (e.g. `https://<your-service>.onrender.com`)
4. Trigger a **Redeployment** on Vercel so the frontend builds with the production backend endpoint.

*(Production builds never default to localhost. If the backend is waking from a cold-start, the frontend displays a real-time waking/retry indicator rather than an error).*

---

## 3. API & Verification Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "backend": "online",
  "model": "qwen2.5:7b-instruct",
  "model_reachable": true,
  "mode": "ollama",
  "demo_mode": true,
  "deployment": "local"
}
```

### Submit a Goal

```bash
curl -X POST http://localhost:8000/goals \
  -H "Content-Type: application/json" \
  -d '{"goal": "Build a RoadSafe-style accident analytics dashboard from this dataset.", "auto_execute": true, "demo_mode": true}'
```

### Inspect Workflow and Tasks

```bash
curl http://localhost:8000/workflows/<workflow_id>
curl http://localhost:8000/workflows/<workflow_id>/tasks/T1
curl http://localhost:8000/workflows/<workflow_id>/events
curl http://localhost:8000/workflows/<workflow_id>/artifacts
curl http://localhost:8000/workflows/<workflow_id>/dashboard
```

---

## 4. Architecture

- `backend/orchestrator/`: Core planning, DAG validation, execution coordinator, and SQLite persistence.
- `backend/agents/`: Specialist agents (Research, Data, UI, Developer, QA, Evaluator).
- `backend/tools/`: Sandboxed tool execution restricted to `workspace/generated_projects/`.
- `backend/evaluator/`: 9-point criteria verification engine for generated deliverables.
- `backend/memory/`: Cross-task context and audit history.
- `frontend/`: React + Vite Command Center with topological graph visualizer, real-time event logs, and RoadSafe deliverable preview.
