# NEXUS — AI Developer Orchestrator

> **Hackathon Track: Developer Tools**  
> *"Build tools that help developers create, test, deploy, or collaborate faster using AI."*

NEXUS is an autonomous multi-agent developer command center. It takes high-level developer requirements, orchestrates specialized AI agents through structured analysis, architecture planning, full-stack code generation, and automated project verification, and delivers a downloadable, production-ready project ZIP.

---

## The Multi-Agent Pipeline

```text
               Developer Requirement
                         │
                         ▼
                  ANALYZER AGENT
      (Feature Extraction, Tech Stack, Constraints)
                         │
                         ▼
              PLANNER / ARCHITECT AGENT
         (System Architecture & API Schemas)
                         │
                         ▼
               CODE GENERATOR AGENT
 (Full-Stack Generation: Frontend, FastAPI, DB Models, Configs)
                         │
                         ▼
                  EVALUATOR AGENT
   (7-Point Integrity Audit & Contract Verification)
                         │
                         ▼
                   FINAL PROJECT
               (Live Web Preview)
                         │
                         ▼
                   ZIP DOWNLOAD
               (/workflows/{id}/zip)
```

### Specialized Agent Roles
1. **Analyzer Agent**: Interprets natural language requirements into formal specifications, scoping features, constraints, and target technology stack.
2. **Planner / Architect Agent**: Constructs execution plans, decoupled client-server architecture, database schemas, and RESTful API endpoints.
3. **Code Generator Agent**: Generates real source files in the sandboxed workspace (`backend/main.py`, `backend/models.py`, `backend/database.py`, `frontend/src/App.jsx`, `frontend/package.json`, `README.md`, and `index.html`).
4. **Evaluator Agent**: Performs automated verification across 7 developer criteria (file structure, non-empty files, dependencies, API contracts, README, and sandbox isolation). Triggers autonomous self-healing regeneration if any defect is detected.

---

## Technology Stack

- **Backend**: FastAPI (Python 3.11+), SQLite persistence, Pydantic data schemas, Uvicorn server.
- **Frontend**: React 18, Vite, Lucide icons, responsive CSS design system.
- **AI / LLM Providers**:
  - **Google Gemini** (`gemini-3.8-flash` via `google.genai` SDK or REST API)
  - **Anthropic Claude** (via REST API)
  - **Local Ollama** (`qwen2.5:7b-instruct` / local LLMs)
  - **Offline Demo Mode** (clearly labelled deterministic fallback for zero-connectivity judging)

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
# In the repository root
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

Create `backend/.env` (see `backend/.env.example`):
```bash
cp backend/.env.example backend/.env
```
Configure your keys:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
PORT=8000
```

Start the FastAPI backend:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Health Telemetry**: `http://localhost:8000/health`

### 2. Frontend Setup
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
- **Command Center Dashboard**: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health, active LLM provider, and model telemetry |
| `POST` | `/goals` | Accept developer requirement, plan tasks, trigger background execution |
| `GET` | `/workflows` | List recent workflows (run history) |
| `GET` | `/workflows/{id}` | Full live workflow state (tasks, requirements, evaluation) |
| `GET` | `/workflows/{id}/events` | Chronological execution events timeline |
| `GET` | `/workflows/{id}/artifacts` | List of generated project files |
| `GET` | `/workflows/{id}/artifact/{path}` | View or download a specific generated file |
| `GET` | `/workflows/{id}/preview` | Live interactive web preview of generated deliverable |
| `GET` | `/workflows/{id}/zip` | **Download generated project as a `.zip` archive** |
| `GET` | `/api/generate-zip` | Backward-compatible ZIP download endpoint |

---

## Security & Isolation

- **Sandboxed Workspace**: All file operations and code generation are confined to `workspace/generated_projects/<workflow_id>/`. Path traversal escapes (`../`) are strictly blocked.
- **Zero Secrets in Frontend**: API keys and model tokens are stored securely on the backend (`backend/.env`) and never exposed in `VITE_` variables or git.
