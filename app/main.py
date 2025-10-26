import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

from .llm_provider import get_llm_and_embeddings
from .ingest import ingest_file_bytes
from .retrieval import retrieve_context, build_rag_prompt
from .chat import chat_answer
from .recommendations import generate_recommendations
from .chroma_client import reset_chroma_collection
from .auth import (
    init_db, get_db, handle_signup, handle_login,
    SignupRequest, LoginRequest, TokenResponse, decode_token,
)
from .anomaly import detect_anomalies_from_records, parse_csv_bytes, load_isoforest_model

load_dotenv()
app = FastAPI(title="FinAgent - LLM Financial Analyzer (agent)")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class QueryRequest(BaseModel):
    query: str


@app.on_event("startup")
def startup_event():
    # init database
    try:
        init_db()
    except Exception:
        pass
    # initialize provider
    try:
        app.state.llm, app.state.embed = get_llm_and_embeddings()
    except Exception as e:
        # provider may not be fully configured yet; keep app running and fail at call time
        app.state.llm = None
        app.state.embed = None
        app.state.llm_error = str(e)
    # load anomaly model if provided
    try:
        model_path = os.getenv("ANOMALY_MODEL_PATH", "").strip()
        app.state.anomaly_model = load_isoforest_model(model_path) if model_path else None
        app.state.anomaly_model_path = model_path
    except Exception:
        app.state.anomaly_model = None
        app.state.anomaly_model_path = None


@app.get("/health")
def health():
    return {"status": "ok", "provider": os.getenv("LLM_PROVIDER", "local")}


# -------- AUTH ---------
@app.post("/auth/signup")
def signup(data: SignupRequest, db=Depends(get_db)):
    try:
        handle_signup(db, data)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db=Depends(get_db)):
    try:
        token = handle_login(db, data)
        return TokenResponse(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


def _require_auth_optional(authorization: str | None = Header(default=None)):
    """If REQUIRE_AUTH=true, validate Authorization: Bearer token; else allow anonymous."""
    if os.getenv("REQUIRE_AUTH", "false").lower() not in ("1", "true", "yes"):
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    sub = decode_token(token)
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return sub


@app.post("/ingest")
async def ingest(file: UploadFile = File(...), _user=Depends(_require_auth_optional)):
    content = await file.read()
    try:
        result = ingest_file_bytes(file.filename, content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def query(req: QueryRequest, _user=Depends(_require_auth_optional)):
    if app.state.llm is None:
        raise HTTPException(status_code=500, detail={"error": "LLM provider not configured", "reason": getattr(app.state, 'llm_error', 'unknown')})
    try:
        # Retrieve context from vector store and perform RAG
        docs, metas = retrieve_context(req.query, top_k=int(os.getenv("RETRIEVAL_K", "5")))
        prompt = build_rag_prompt(req.query, docs)
        resp = app.state.llm(prompt)
        return {"query": req.query, "response": resp, "sources": metas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/collections/stats")
def collection_stats(_user=Depends(_require_auth_optional)):
    try:
        from .chroma_client import get_chroma_collection
        coll = get_chroma_collection()
        count = None
        # Prefer native count if available
        if hasattr(coll, "count"):
            try:
                count = coll.count()
            except Exception:
                count = None
        # Fallback: attempt length of internal store or 0
        if count is None:
            count = getattr(coll, "_store", None)
            count = len(count) if isinstance(count, list) else 0
        return {"collection": getattr(coll, "name", "documents"), "count": int(count)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/collections/reset")
def collection_reset(_user=Depends(_require_auth_optional)):
    try:
        before = reset_chroma_collection()
        # fetch count after reset
        from .chroma_client import get_chroma_collection
        coll = get_chroma_collection()
        after = getattr(coll, "count", lambda: len(getattr(coll, "_store", [])))()
        return {"collection": getattr(coll, "name", "documents"), "before": int(before), "after": int(after)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Anomaly Detection ---------
class AnomalyJSONRequest(BaseModel):
    records: list[dict]
    contamination: float | None = 0.05
    top_k: int | None = 10
    explain: bool | None = False


@app.post("/anomaly/detect")
async def anomaly_detect(
    file: UploadFile | None = File(default=None),
    _user=Depends(_require_auth_optional),
    req: AnomalyJSONRequest | None = None,
):
    """
    Detect anomalies from a CSV file upload or JSON body of records.
    Prefer file upload when provided. If neither provided, 400.
    """
    try:
        if file is not None:
            data = await file.read()
            records = parse_csv_bytes(data)
            contamination = 0.05
            top_k = 10
            explain = False
        elif req is not None:
            records = req.records
            contamination = req.contamination or 0.05
            top_k = req.top_k or 10
            explain = bool(req.explain)
        else:
            raise HTTPException(status_code=400, detail="Provide either a CSV file or JSON records")

        result = detect_anomalies_from_records(
            records,
            contamination=contamination,
            top_k=top_k,
            explain=explain,
            model=getattr(app.state, "anomaly_model", None),
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomaly/status")
def anomaly_status():
    loaded = getattr(app.state, "anomaly_model", None) is not None
    path = getattr(app.state, "anomaly_model_path", None)
    return {"loaded": bool(loaded), "path": path}


# -------- Chat (RAG + Web + LLM) ---------
class ChatRequest(BaseModel):
    prompt: str


@app.post("/chat")
def chat(req: ChatRequest, _user=Depends(_require_auth_optional)):
    try:
        return chat_answer(req.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Recommendations (Budget, Debt, Emergency Fund, Risk) ---------
class RecommendationRequest(BaseModel):
    monthly_income: float | None = None
    current_needs: float | None = None
    current_wants: float | None = None
    current_savings: float | None = None
    debts: list[dict] | None = None
    monthly_expenses: float | None = None
    risk_profile: str | None = None
    age: int | None = None
    income: float | None = None
    savings: float | None = None
    debt: float | None = None
    investment_horizon_years: int | None = None


@app.post("/recommendations")
def recommendations(req: RecommendationRequest, _user=Depends(_require_auth_optional)):
    """Generate personalized financial recommendations based on user data."""
    try:
        user_data = req.dict(exclude_none=True)
        return generate_recommendations(user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
