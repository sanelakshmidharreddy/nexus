# NEXUS — AI Developer Orchestrator

> **Hackathon Track: Developer Tools**  
> *"Build tools that help developers create, test, deploy, or collaborate faster using AI."*

NEXUS is an autonomous multi-agent developer pipeline that translates natural language engineering requirements into complete, production-grade applications. It guides the project through four distinct developer lifecycle stages: **CREATE**, **TEST**, **DEPLOY**, and **COLLABORATE**, and delivers a downloadable project ZIP archive with automated verification reports.

---

## The Four-Stage Developer Workflow

```text
               Developer Requirement / Feature Directive
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CREATE STAGE                                                             │
│    • Analyzer Agent: Scopes features, constraints, target technology stack. │
│    • Planner / Architect Agent: Formulates decoupled DAG & API contracts.   │
│    • Code Generator Agent: Produces React frontend, FastAPI backend, SQLite.│
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. TEST STAGE                                                               │
│    • Evaluator Agent: Generates automated pytest test suite.                │
│    • Real Static Validation: AST syntax analysis, route contracts audit.    │
│    • Autonomous Repair: Triggers self-healing regeneration on defects.     │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. DEPLOY STAGE                                                             │
│    • Dockerfile: Multi-stage container configuration.                       │
│    • Cloud Blueprints: render.yaml web service & vercel.json SPA rewrites.  │
│    • CI/CD Workflow: Automated GitHub Actions pipeline (.github/workflows). │
│    • Exact CLI Instructions: Copyable local & cloud execution commands.     │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. COLLABORATE STAGE                                                        │
│    • Pull Request Summary: Formal PULL_REQUEST.md with verification checklist│
│    • Release History: Semantic versioning in CHANGELOG.md.                   │
│    • Senior Code Review: Architectural assessment in CODE_REVIEW.md.        │
│    • Documentation: Comprehensive README.md and runnable index.html preview.│
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ZIP EXPORT & LIVE PREVIEW
             (/workflows/{id}/zip & /workflows/{id}/preview)
```

---

## Key Capabilities

1. **Conversational Developer Workspace (`/app`)**:
   - ChatGPT / Claude style interface with run history sidebar, suggested prompt chips, and unified assistant messages.
   - Four collapsible stage blocks showing real-time backend agent progress and rich outputs.
   - Iterative modification path: ask follow-up changes (e.g. "add dark mode", "add a login page") to safely patch sandbox files and re-evaluate.
2. **Calm Landing Page (`/`)**:
   - Senior engineer copy with interactive architecture overview, static workflow diagram, feature breakdowns, and limits disclosure.
3. **OmniRoute Multi-Key LLM Routing**:
   - Routes requests through OpenAI-compatible OmniRoute gateway with automated key rotation and 1 retry on 429/5xx status codes.
   - Optional local Ollama support and deterministic fallback for offline judging.
4. **Sandboxed Workspace**:
   - All file writes are strictly constrained to `workspace/generated_projects/<workflow_id>/` with path traversal protection.

---

## Technology Stack

- **Backend**: FastAPI (Python 3.11+), SQLite relational database, Pydantic schemas, Uvicorn server.
- **Frontend**: React 18, Vite, Lucide icons, Vanilla CSS design system (Light default with Dark toggle).
- **AI Gateway**: OmniRoute (multi-key routing), Google Gemini, Anthropic Claude, Ollama.

---

## Local Development Setup

### 1. Backend Setup
```bash
# Clone and enter directory
cd backend

# Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
```

Configure environment variables in `backend/.env`:
```env
LLM_PROVIDER=omniroute
OMNIROUTE_BASE_URL=https://your-omniroute-endpoint/v1
OMNIROUTE_API_KEY=your_key_here
OMNIROUTE_MODEL=ddgw/gpt-5.4-mini
PORT=8000
```

Start the backend:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 2. Frontend Setup
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
- **Landing Page**: `http://localhost:5173/`
- **App Workspace**: `http://localhost:5173/app`

---

## Production Deployment Guide

### Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect repository `https://github.com/sanelakshmidharreddy/nexus`.
3. Runtime: `Python 3.11`.
4. Build Command: `pip install -r backend/requirements.txt`
5. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. Health Check Path: `/health`
7. Set Environment Variables in Render Dashboard:
   - `LLM_PROVIDER`: `omniroute` (or `gemini`)
   - `OMNIROUTE_BASE_URL`: your OmniRoute base URL
   - `OMNIROUTE_API_KEY`: your OmniRoute API key
   - `OMNIROUTE_MODEL`: `ddgw/gpt-5.4-mini`
   - `DEMO_MODE`: `false` (or `true` for offline mode)
   - `CORS_ORIGINS`: `https://nexus-livid-six.vercel.app`

### Deploying Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Root Directory: `frontend`.
3. Framework Preset: `Vite`.
4. Set Environment Variable in Vercel Project Settings:
   - `VITE_API_URL`: `https://nexus-backend-1diy.onrender.com`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Fast liveness health check & telemetry |
| `POST` | `/goals` | Start new developer workflow (returns `run_id`, executes in background) |
| `GET` | `/workflows` | List recent workflow history |
| `GET` | `/workflows/{id}` | Retrieve workflow state, tasks, and evaluation score |
| `POST` | `/workflows/{id}/modify` | Apply iterative modifications (e.g. "add dark mode") |
| `GET` | `/workflows/{id}/events` | Stream chronological execution events |
| `GET` | `/workflows/{id}/artifacts` | List all generated project files |
| `GET` | `/workflows/{id}/artifact/{path}` | Inspect specific generated file |
| `GET` | `/workflows/{id}/preview` | Live runnable HTML preview |
| `GET` | `/workflows/{id}/zip` | **Download complete project as `.zip` archive** |
| `POST` | `/workflows/{id}/deploy/github` | Push deliverable to GitHub (if token present) |

---

## Security & Privacy Guarantee

- **Zero Secrets Committed**: All `.env`, `.env.*`, and SQLite database files (`*.db`) are strictly gitignored.
- **Client-Side Isolation**: The React frontend receives only public API data; no keys are bundled into frontend assets.
- **Sandbox Confinement**: Code generation is strictly restricted to `workspace/generated_projects/` with automatic path traversal sanitization.
