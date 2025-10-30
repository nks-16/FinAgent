import os
from typing import List
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
from .conversation_models import (
    ChatRequest, ChatResponse, ConversationCreate, ConversationResponse,
    ConversationWithMessages
)
from .conversation_service import (
    create_conversation_session, get_conversation_session, get_user_conversations,
    save_message, get_conversation_messages, get_conversation_with_messages,
    build_conversation_context, delete_conversation, archive_conversation,
    get_or_create_active_session
)
from .financial_db import init_financial_db, get_db as get_financial_db
from .financial_schemas import (
    UserProfileResponse, UserProfileUpdate,
    AccountCreate, AccountUpdate, AccountResponse,
    TransactionCreate, TransactionUpdate, TransactionResponse,
    BudgetCreate, BudgetUpdate, BudgetResponse,
    FinancialGoalCreate, FinancialGoalUpdate, FinancialGoalResponse,
    DebtCreate, DebtUpdate, DebtResponse,
    InvestmentCreate, InvestmentUpdate, InvestmentResponse,
    FinancialSummary
)
from .financial_service import (
    get_or_create_user_profile, update_user_profile,
    create_account, get_accounts, get_account, update_account, delete_account,
    create_transaction, get_transactions, update_transaction, delete_transaction,
    create_budget, get_budgets, update_budget,
    create_goal, get_goals, update_goal, delete_goal,
    create_debt, get_debts, update_debt, delete_debt,
    create_investment, get_investments, update_investment, delete_investment,
    get_financial_summary, get_spending_by_category, get_income_vs_expenses_trend
)

# Import ML endpoints
try:
    from .ml_endpoints import router as ml_router
    ML_ENDPOINTS_AVAILABLE = True
except ImportError:
    ML_ENDPOINTS_AVAILABLE = False

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

# Include ML router if available
if ML_ENDPOINTS_AVAILABLE:
    app.include_router(ml_router)


class QueryRequest(BaseModel):
    query: str


@app.on_event("startup")
def startup_event():
    # init database
    try:
        init_db()
    except Exception:
        pass
    # init financial database tables
    try:
        init_financial_db()
    except Exception as e:
        print(f"Financial DB init failed: {e}")
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
    contamination: float = 0.05
    top_k: int = 10
    explain: bool = False


@app.post("/anomaly/detect")
async def anomaly_detect(
    file: UploadFile = File(None),
    _user=Depends(_require_auth_optional),
):
    """
    Detect anomalies from a CSV file upload or JSON body of records.
    Prefer file upload when provided. If neither provided, 400.
    """
    try:
        if file is not None and file.filename:
            # File upload mode
            data = await file.read()
            records = parse_csv_bytes(data)
            contamination = 0.05
            top_k = 10
            explain = False
        else:
            # No file, return error asking for proper format
            raise HTTPException(
                status_code=400, 
                detail="File upload required. Use multipart/form-data with 'file' field."
            )

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


@app.post("/anomaly/detect-json")
def anomaly_detect_json(
    req: AnomalyJSONRequest,
    _user=Depends(_require_auth_optional),
):
    """
    Detect anomalies from JSON records (for testing/API calls).
    """
    try:
        result = detect_anomalies_from_records(
            req.records,
            contamination=req.contamination,
            top_k=req.top_k,
            explain=req.explain,
            model=getattr(app.state, "anomaly_model", None),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomaly/status")
def anomaly_status():
    loaded = getattr(app.state, "anomaly_model", None) is not None
    path = getattr(app.state, "anomaly_model_path", None)
    return {"loaded": bool(loaded), "path": path}


# -------- Chat (RAG + Web + LLM) ---------
# -------- Chat with Conversation History ---------

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, _user=Depends(_require_auth_optional)):
    """
    Chat endpoint with conversation history support.
    If session_id is provided, continues that conversation.
    If not, creates a new session or uses the most recent active one.
    """
    try:
        # Determine user_id (use authenticated user or anonymous)
        user_id = _user if _user else "anonymous"
        
        # Get or create session
        if req.session_id:
            session = get_conversation_session(req.session_id)
            if not session:
                raise HTTPException(status_code=404, detail=f"Session {req.session_id} not found")
            # Verify user owns this session
            if session.user_id != user_id:
                raise HTTPException(status_code=403, detail="Access denied to this session")
        else:
            # Get most recent active session or create new one
            session = get_or_create_active_session(user_id)
        
        # Save user message
        save_message(session.session_id, "user", req.query)
        
        # Build conversation context from history with financial data
        conversation_context = build_conversation_context(session.session_id, max_messages=10, user_id=user_id)
        
        # Get chat answer with context
        from .chat import chat_answer_with_context
        result = chat_answer_with_context(req.query, conversation_context)
        
        # Save assistant response
        assistant_msg = save_message(session.session_id, "assistant", result["answer"])
        
        return ChatResponse(
            answer=result["answer"],
            session_id=session.session_id,
            message_index=assistant_msg.message_index
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Conversation Management Endpoints ---------

@app.post("/conversations/new", response_model=ConversationResponse)
def create_new_conversation(
    data: ConversationCreate,
    _user=Depends(_require_auth_optional)
):
    """Create a new conversation session"""
    try:
        user_id = _user if _user else "anonymous"
        session = create_conversation_session(user_id, data.title)
        return ConversationResponse(**session.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    limit: int = 50,
    active_only: bool = False,
    _user=Depends(_require_auth_optional)
):
    """Get all conversation sessions for the current user"""
    try:
        user_id = _user if _user else "anonymous"
        conversations = get_user_conversations(user_id, limit=limit, active_only=active_only)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{session_id}", response_model=ConversationWithMessages)
def get_conversation_detail(
    session_id: str,
    _user=Depends(_require_auth_optional)
):
    """Get a conversation session with all its messages"""
    try:
        user_id = _user if _user else "anonymous"
        conversation = get_conversation_with_messages(session_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Verify user owns this conversation
        if conversation.session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/conversations/{session_id}")
def delete_conversation_endpoint(
    session_id: str,
    _user=Depends(_require_auth_optional)
):
    """Delete a conversation session and all its messages"""
    try:
        user_id = _user if _user else "anonymous"
        
        # Verify ownership before deletion
        session = get_conversation_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
        success = delete_conversation(session_id)
        if success:
            return {"message": "Conversation deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Conversation not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/conversations/{session_id}/archive")
def archive_conversation_endpoint(
    session_id: str,
    _user=Depends(_require_auth_optional)
):
    """Archive a conversation (set as inactive)"""
    try:
        user_id = _user if _user else "anonymous"
        
        # Verify ownership before archiving
        session = get_conversation_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this conversation")
        
        success = archive_conversation(session_id)
        if success:
            return {"message": "Conversation archived successfully"}
        else:
            raise HTTPException(status_code=404, detail="Conversation not found")
    except HTTPException:
        raise
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


# ========================================
# FINANCIAL TRACKER ENDPOINTS
# ========================================

# -------- User Profile ---------

@app.get("/financial/profile", response_model=UserProfileResponse)
def get_user_profile(_user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get user's financial profile"""
    try:
        user_id = _user if _user else "anonymous"
        profile = get_or_create_user_profile(db, user_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/profile", response_model=UserProfileResponse)
def update_profile(data: UserProfileUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update user's financial profile"""
    try:
        user_id = _user if _user else "anonymous"
        profile = update_user_profile(db, user_id, data)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Accounts ---------

@app.post("/financial/accounts", response_model=AccountResponse)
def add_account(data: AccountCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create a new account"""
    try:
        user_id = _user if _user else "anonymous"
        account = create_account(db, user_id, data)
        return account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/accounts", response_model=List[AccountResponse])
def list_accounts(active_only: bool = True, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get all accounts"""
    try:
        user_id = _user if _user else "anonymous"
        accounts = get_accounts(db, user_id, active_only=active_only)
        return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/accounts/{account_id}", response_model=AccountResponse)
def get_account_detail(account_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get specific account"""
    try:
        user_id = _user if _user else "anonymous"
        account = get_account(db, user_id, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/accounts/{account_id}", response_model=AccountResponse)
def update_account_endpoint(account_id: int, data: AccountUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update account"""
    try:
        user_id = _user if _user else "anonymous"
        account = update_account(db, user_id, account_id, data)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/financial/accounts/{account_id}")
def delete_account_endpoint(account_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Delete account"""
    try:
        user_id = _user if _user else "anonymous"
        success = delete_account(db, user_id, account_id)
        if success:
            return {"message": "Account deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Account not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Transactions ---------

@app.post("/financial/transactions", response_model=TransactionResponse)
def add_transaction(data: TransactionCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create a new transaction"""
    try:
        user_id = _user if _user else "anonymous"
        transaction = create_transaction(db, user_id, data)
        return transaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/transactions", response_model=List[TransactionResponse])
def list_transactions(
    account_id: int = None,
    transaction_type: str = None,
    limit: int = 100,
    _user=Depends(_require_auth_optional),
    db=Depends(get_financial_db)
):
    """Get transactions with filters"""
    try:
        user_id = _user if _user else "anonymous"
        transactions = get_transactions(db, user_id, account_id=account_id, transaction_type=transaction_type, limit=limit)
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction_endpoint(transaction_id: int, data: TransactionUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update transaction"""
    try:
        user_id = _user if _user else "anonymous"
        transaction = update_transaction(db, user_id, transaction_id, data)
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/financial/transactions/{transaction_id}")
def delete_transaction_endpoint(transaction_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Delete transaction"""
    try:
        user_id = _user if _user else "anonymous"
        success = delete_transaction(db, user_id, transaction_id)
        if success:
            return {"message": "Transaction deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Transaction not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Budgets ---------

@app.post("/financial/budgets", response_model=BudgetResponse)
def add_budget(data: BudgetCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create or update a budget"""
    try:
        user_id = _user if _user else "anonymous"
        budget = create_budget(db, user_id, data)
        return budget
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/budgets", response_model=List[BudgetResponse])
def list_budgets(month: int = None, year: int = None, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get budgets, optionally filtered by month/year"""
    try:
        user_id = _user if _user else "anonymous"
        budgets = get_budgets(db, user_id, month=month, year=year)
        return budgets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/budgets/{budget_id}", response_model=BudgetResponse)
def update_budget_endpoint(budget_id: int, data: BudgetUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update budget"""
    try:
        user_id = _user if _user else "anonymous"
        budget = update_budget(db, user_id, budget_id, data)
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        return budget
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Financial Goals ---------

@app.post("/financial/goals", response_model=FinancialGoalResponse)
def add_goal(data: FinancialGoalCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create a new financial goal"""
    try:
        user_id = _user if _user else "anonymous"
        goal = create_goal(db, user_id, data)
        return goal
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/goals", response_model=List[FinancialGoalResponse])
def list_goals(active_only: bool = False, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get financial goals"""
    try:
        user_id = _user if _user else "anonymous"
        goals = get_goals(db, user_id, active_only=active_only)
        return goals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/goals/{goal_id}", response_model=FinancialGoalResponse)
def update_goal_endpoint(goal_id: int, data: FinancialGoalUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update financial goal"""
    try:
        user_id = _user if _user else "anonymous"
        goal = update_goal(db, user_id, goal_id, data)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/financial/goals/{goal_id}")
def delete_goal_endpoint(goal_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Delete financial goal"""
    try:
        user_id = _user if _user else "anonymous"
        success = delete_goal(db, user_id, goal_id)
        if success:
            return {"message": "Goal deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Goal not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Debts ---------

@app.post("/financial/debts", response_model=DebtResponse)
def add_debt(data: DebtCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create a new debt entry"""
    try:
        user_id = _user if _user else "anonymous"
        debt = create_debt(db, user_id, data)
        return debt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/debts", response_model=List[DebtResponse])
def list_debts(active_only: bool = False, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get debts"""
    try:
        user_id = _user if _user else "anonymous"
        debts = get_debts(db, user_id, active_only=active_only)
        return debts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/debts/{debt_id}", response_model=DebtResponse)
def update_debt_endpoint(debt_id: int, data: DebtUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update debt"""
    try:
        user_id = _user if _user else "anonymous"
        debt = update_debt(db, user_id, debt_id, data)
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        return debt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/financial/debts/{debt_id}")
def delete_debt_endpoint(debt_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Delete debt"""
    try:
        user_id = _user if _user else "anonymous"
        success = delete_debt(db, user_id, debt_id)
        if success:
            return {"message": "Debt deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Debt not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Investments ---------

@app.post("/financial/investments", response_model=InvestmentResponse)
def add_investment(data: InvestmentCreate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Create a new investment entry"""
    try:
        user_id = _user if _user else "anonymous"
        investment = create_investment(db, user_id, data)
        return investment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/investments", response_model=List[InvestmentResponse])
def list_investments(_user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get investments"""
    try:
        user_id = _user if _user else "anonymous"
        investments = get_investments(db, user_id)
        return investments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/financial/investments/{investment_id}", response_model=InvestmentResponse)
def update_investment_endpoint(investment_id: int, data: InvestmentUpdate, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Update investment"""
    try:
        user_id = _user if _user else "anonymous"
        investment = update_investment(db, user_id, investment_id, data)
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
        return investment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/financial/investments/{investment_id}")
def delete_investment_endpoint(investment_id: int, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Delete investment"""
    try:
        user_id = _user if _user else "anonymous"
        success = delete_investment(db, user_id, investment_id)
        if success:
            return {"message": "Investment deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Investment not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------- Financial Summary & Analytics ---------

@app.get("/financial/summary", response_model=FinancialSummary)
def get_summary(_user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get comprehensive financial summary"""
    try:
        user_id = _user if _user else "anonymous"
        summary = get_financial_summary(db, user_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/spending-by-category")
def spending_by_category(
    start_date: str = None,
    end_date: str = None,
    _user=Depends(_require_auth_optional),
    db=Depends(get_financial_db)
):
    """Get spending breakdown by category"""
    try:
        user_id = _user if _user else "anonymous"
        from datetime import datetime
        
        if not start_date or not end_date:
            # Default to current month
            now = datetime.utcnow()
            start = datetime(now.year, now.month, 1)
            end = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
        else:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        
        data = get_spending_by_category(db, user_id, start, end)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/financial/income-vs-expenses")
def income_vs_expenses(months: int = 6, _user=Depends(_require_auth_optional), db=Depends(get_financial_db)):
    """Get monthly income vs expenses trend"""
    try:
        user_id = _user if _user else "anonymous"
        data = get_income_vs_expenses_trend(db, user_id, months=months)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

