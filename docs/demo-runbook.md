# FinAgent Demo Runbook

This runbook guides a quick demo: auth, ingest, query, stats/reset, and anomaly detection.

## Prereqs
- Python 3.10+ with virtualenv OR Docker Compose
- If doing anomaly detection, install ML extras: `pip install -r requirements-ml.txt`
- Optional: copy `.env.example` to `.env` and set JWT_SECRET (any string).

## Quick start (local)
1. Create venv and install deps:
   - Windows PowerShell:
     - `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
     - `.\.venv\Scripts\python.exe -m pip install -r requirements-ml.txt` (optional ML)
2. Run the API:
   - `.\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload`
3. Open docs at http://localhost:8000/docs

## Quick start (Docker Compose)
1. Ensure Docker Desktop is running.
2. In repo root:
   - `docker compose up --build`
3. API at http://localhost:8000, Frontend at http://localhost:5173

## Flow
1. Health: GET `/health`.
2. (Optional) Signup/Login:
   - POST `/auth/signup` { email, password }
   - POST `/auth/login` { email, password } → copy bearer token
   - If `REQUIRE_AUTH=true`, pass `Authorization: Bearer <token>` to protected routes.
3. Ingest:
   - POST `/ingest` (form-data) with a `.txt`/`.pdf`/`.csv`. Example: `data/sample/financials.csv`.
4. Query:
   - POST `/query` { "query": "What happened to revenue?" }
5. Collection stats and reset:
   - GET `/collections/stats`
   - POST `/collections/reset`
6. Anomaly detection:
   - POST `/anomaly/detect` (form-data `file=financials.csv`) or JSON body `{ records: [...], explain: true }`.
   - For JSON, include numeric fields (revenue, cogs, etc.).

## Postman
- Import `postman/FinAgent.postman_collection.json` and set `baseUrl` to your API (e.g., `http://localhost:8000`).
- Use the provided requests for quick testing.

## Notes
- PDF extraction uses PyMuPDF with pdfminer.six fallback.
- Vector store defaults to in-memory fallback if Chroma isn’t available.
- IsolationForest is used for anomaly detection; SHAP explanations are optional if `shap` is installed.
