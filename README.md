- New: Frontend (React + Vite + Bootstrap) with Login/Signup and dashboard to ingest, query, view stats, and reset.
- New: JWT auth in FastAPI with SQLAlchemy (MySQL via Docker or SQLite fallback).
LLM-Based Financial Analyzer with Investment Insight System

Starter scaffold for the Major Project by Karthikeya S (4NI22CS093).

Contents:
- `agent_prompt.md` - Agent instructions and config placeholders.
- `docker-compose.yml` - Local multi-service dev (Agent + Chroma).
- `requirements.txt` - Python dependencies for the agent service.
- `Jenkinsfile` - CI/CD pipeline.
- `plan.md` - Project plan and milestones.
- `backend/` - Spring Boot backend (Java 21, `/health`).

How to start (local dev, minimal):
1. Install Python 3.10+.
2. Create a virtualenv and install dependencies (PowerShell):
   ```powershell
   python -m venv .venv
   # If script execution is restricted, you can call the venv python directly
   .\.venv\Scripts\python.exe -m pip install --upgrade pip
   .\.venv\Scripts\python.exe -m pip install --only-binary=:all: PyMuPDF==1.24.14
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```
3. Set environment variables (OPENAI_API_KEY, etc.) before running the service.

This scaffold is intentionally minimal. See `plan.md` for next steps and milestones.

### Backend (Spring Boot)
- Java 21 toolchain (Temurin). Maven and Java run inside Docker in CI and locally if preferred.
- Run tests (Dockerized Maven):
   ```powershell
   docker run --rm -v "${PWD}/backend:/workspace" -w /workspace maven:3.9-eclipse-temurin-21 mvn -B test
   ```
- Build image (Java 21):
   ```powershell
   docker build -t finagent/backend:java21 backend
   docker run --rm -p 8080:8080 finagent/backend:java21
   ```
- Health check: http://localhost:8080/health

## Windows install tips
- PyMuPDF: if pip tries to build from source (Visual Studio error), force the prebuilt wheel:
   - PowerShell:
      - .\.venv\Scripts\Activate.ps1
      - pip install --upgrade pip
      - pip install --only-binary=:all: PyMuPDF==1.24.14
      - pip install -r requirements.txt
- ChromaDB: if installation fails due to native build tools, you can still run and test ingestion locally thanks to an in-memory fallback. For full Chroma, prefer Docker (see docker-compose) or install build tools.

## API endpoints
- GET /health → { status, provider }
- POST /ingest (multipart file) → { filename, chunks, collection }
- POST /query { query } → { query, response, sources }
- GET /collections/stats → { collection, count }
 - POST /collections/reset → { collection, before, after }

## Frontend
- Located in `frontend/`. Dev server runs on port 3000.
- Configure API base URL via `VITE_API_BASE_URL` (defaults to http://localhost:8000).
- Pages: Login, Signup, Dashboard (Health, Ingest, Query, Stats, Reset).

Run locally (Docker):
```powershell
docker compose up --build
```
Then open http://localhost:3000

For production, switch the frontend Dockerfile to `npm run build` and serve with Nginx.

## Authentication and DB
- Env vars (`.env` supported):
   - `DATABASE_URL` e.g., `mysql+pymysql://finagent:finagent@mysql:3306/finagent` (default in compose)
   - `JWT_SECRET` secret for signing JWTs
   - `REQUIRE_AUTH` true/false (default false to keep tests simple)
   - `CORS_ORIGIN` allowed origin (default *)
- Signup: `POST /auth/signup` { email, password }
- Login: `POST /auth/login` { email, password } → { access_token }
- To protect endpoints, set `REQUIRE_AUTH=true` and send `Authorization: Bearer <token>`.

## MySQL via Docker
- Compose includes a `mysql` service (MySQL 8). Data persisted in `mysql_data` volume.
- Default creds in `.env.example`. Adjust as needed.

## Tests
- Python tests:
   ```powershell
   .\.venv\Scripts\python.exe -m pytest -vv
   ```
- CI runs Java tests and a Docker smoke test for the backend automatically (see `Jenkinsfile`).

## Anomaly detection (tabular)
- Endpoint: `POST /anomaly/detect`
- Input: CSV file upload (form-data `file`) or JSON `{ records: [...], contamination?, top_k?, explain? }`
- Output: list of anomalies with scores. If `explain=true` and SHAP is installed, per-feature contributions are included.
- Install extras: `pip install -r requirements-ml.txt`

### Sample data
- See `data/sample/financials.csv` and `data/README.md`.

### Postman and runbook
- Postman collection: `postman/FinAgent.postman_collection.json`
- Demo runbook: `docs/demo-runbook.md`

## Frontend anomaly UI
- New page at `/anomaly` for CSV upload and sample JSON run. Requires login if `REQUIRE_AUTH=true`.

## Training an anomaly model (optional)
- CLI: `python scripts/train_anomaly.py data/sample/financials.csv --out models/anomaly_isoforest.joblib`
- Mount `models/` into Docker to persist the file and optionally load it later.
- Current API trains on-the-fly per request; persisted models are optional and not auto-loaded yet.

## Using a saved anomaly model
- Train and save a model:
  - `python scripts/train_anomaly.py data/sample/financials.csv --out models/anomaly_isoforest.joblib`
- To use in Docker:
  - Set `ANOMALY_MODEL_PATH=/app/models/anomaly_isoforest.joblib`
  - Ensure `./models` exists locally and docker-compose mounts it (the compose file maps `models_data:/app/models`).
- Status endpoint: `GET /anomaly/status` → `{ loaded: boolean, path: string | null }`.

## Persistence
- Chroma vectors persist if the `chroma` service has a volume. docker-compose now mounts `chroma_data:/chroma`.
- MySQL already uses `mysql_data` volume.

## Java backend features
- Health: `GET /health` (Spring Boot)
- System health aggregator: `GET /system/health` — calls agent `/health`, `/collections/stats`, and `/anomaly/status` and returns a combined view.
- Export CSV: `POST /export/csv` — accepts `{ query, response, sources }` and returns a downloadable CSV.

### Running with Docker Compose
- The Java backend is added as `backend` service on port 8080.
- Frontend reads `VITE_JAVA_BASE_URL` (defaults to `http://localhost:8080`).
- The Dashboard shows a “System status (Java)” card and an “Export CSV (Java)” action on answers.
