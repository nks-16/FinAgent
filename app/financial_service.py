"""
Business logic for financial data management
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.financial_models import (
    UserProfile, Account, Transaction, Budget, FinancialGoal, Debt, Investment,
    TransactionType, TransactionCategory
)
from app.financial_schemas import (
    UserProfileCreate, UserProfileUpdate,
    AccountCreate, AccountUpdate,
    TransactionCreate, TransactionUpdate,
    BudgetCreate, BudgetUpdate,
    FinancialGoalCreate, FinancialGoalUpdate,
    DebtCreate, DebtUpdate,
    InvestmentCreate, InvestmentUpdate,
    FinancialSummary
)


# ==================== USER PROFILE ====================

def get_or_create_user_profile(db: Session, username: str) -> UserProfile:
    """Get existing profile or create new one"""
    profile = db.query(UserProfile).filter(UserProfile.username == username).first()
    if not profile:
        profile = UserProfile(username=username)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_user_profile(db: Session, username: str, data: UserProfileUpdate) -> UserProfile:
    """Update user profile"""
    profile = get_or_create_user_profile(db, username)
    for key, value in data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


# ==================== ACCOUNTS ====================

def create_account(db: Session, username: str, data: AccountCreate) -> Account:
    """Create new account"""
    profile = get_or_create_user_profile(db, username)
    account = Account(**data.dict(), user_id=profile.id)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_accounts(db: Session, username: str, active_only: bool = True) -> List[Account]:
    """Get all accounts for user"""
    profile = get_or_create_user_profile(db, username)
    query = db.query(Account).filter(Account.user_id == profile.id)
    if active_only:
        query = query.filter(Account.is_active == True)
    return query.all()


def get_account(db: Session, username: str, account_id: int) -> Optional[Account]:
    """Get specific account"""
    profile = get_or_create_user_profile(db, username)
    return db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == profile.id
    ).first()


def update_account(db: Session, username: str, account_id: int, data: AccountUpdate) -> Optional[Account]:
    """Update account"""
    account = get_account(db, username, account_id)
    if account:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(account, key, value)
        account.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(account)
    return account


def delete_account(db: Session, username: str, account_id: int) -> bool:
    """Delete account"""
    account = get_account(db, username, account_id)
    if account:
        db.delete(account)
        db.commit()
        return True
    return False


# ==================== TRANSACTIONS ====================

def create_transaction(db: Session, username: str, data: TransactionCreate) -> Transaction:
    """Create new transaction"""
    profile = get_or_create_user_profile(db, username)
    transaction = Transaction(**data.dict(), user_id=profile.id)
    db.add(transaction)
    
    # Update account balance if account is specified
    if data.account_id:
        account = get_account(db, username, data.account_id)
        if account:
            if data.transaction_type == TransactionType.INCOME:
                account.balance += data.amount
            elif data.transaction_type == TransactionType.EXPENSE:
                account.balance -= data.amount
            account.updated_at = datetime.utcnow()
    
    # Update budget if expense
    if data.transaction_type == TransactionType.EXPENSE and data.category:
        update_budget_spending(db, username, data.category, data.amount, data.date)
    
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transactions(
    db: Session,
    username: str,
    account_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
) -> List[Transaction]:
    """Get transactions with filters"""
    profile = get_or_create_user_profile(db, username)
    query = db.query(Transaction).filter(Transaction.user_id == profile.id)
    
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    return query.order_by(Transaction.date.desc()).limit(limit).all()


def update_transaction(db: Session, username: str, transaction_id: int, data: TransactionUpdate) -> Optional[Transaction]:
    """Update transaction"""
    profile = get_or_create_user_profile(db, username)
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == profile.id
    ).first()
    
    if transaction:
        # Reverse old balance change
        if transaction.account_id:
            account = get_account(db, username, transaction.account_id)
            if account:
                if transaction.transaction_type == TransactionType.INCOME:
                    account.balance -= transaction.amount
                elif transaction.transaction_type == TransactionType.EXPENSE:
                    account.balance += transaction.amount
        
        # Update transaction
        for key, value in data.dict(exclude_unset=True).items():
            setattr(transaction, key, value)
        
        # Apply new balance change
        if transaction.account_id:
            account = get_account(db, username, transaction.account_id)
            if account:
                if transaction.transaction_type == TransactionType.INCOME:
                    account.balance += transaction.amount
                elif transaction.transaction_type == TransactionType.EXPENSE:
                    account.balance -= transaction.amount
                account.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, username: str, transaction_id: int) -> bool:
    """Delete transaction"""
    profile = get_or_create_user_profile(db, username)
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == profile.id
    ).first()
    
    if transaction:
        # Reverse balance change
        if transaction.account_id:
            account = get_account(db, username, transaction.account_id)
            if account:
                if transaction.transaction_type == TransactionType.INCOME:
                    account.balance -= transaction.amount
                elif transaction.transaction_type == TransactionType.EXPENSE:
                    account.balance += transaction.amount
                account.updated_at = datetime.utcnow()
        
        db.delete(transaction)
        db.commit()
        return True
    return False


# ==================== BUDGETS ====================

def create_budget(db: Session, username: str, data: BudgetCreate) -> Budget:
    """Create new budget"""
    profile = get_or_create_user_profile(db, username)
    
    # Check if budget already exists for this category/month/year
    existing = db.query(Budget).filter(
        Budget.user_id == profile.id,
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()
    
    if existing:
        existing.monthly_limit = data.monthly_limit
        existing.is_active = True
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    budget = Budget(**data.dict(), user_id=profile.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def get_budgets(db: Session, username: str, month: Optional[int] = None, year: Optional[int] = None) -> List[Budget]:
    """Get budgets for user"""
    profile = get_or_create_user_profile(db, username)
    query = db.query(Budget).filter(Budget.user_id == profile.id, Budget.is_active == True)
    
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)
    
    return query.all()


def update_budget_spending(db: Session, username: str, category: str, amount: float, transaction_date: datetime):
    """Update budget current_spent when transaction is added"""
    profile = get_or_create_user_profile(db, username)
    budget = db.query(Budget).filter(
        Budget.user_id == profile.id,
        Budget.category == category,
        Budget.month == transaction_date.month,
        Budget.year == transaction_date.year,
        Budget.is_active == True
    ).first()
    
    if budget:
        budget.current_spent += amount
        budget.updated_at = datetime.utcnow()
        db.commit()


def update_budget(db: Session, username: str, budget_id: int, data: BudgetUpdate) -> Optional[Budget]:
    """Update budget"""
    profile = get_or_create_user_profile(db, username)
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == profile.id
    ).first()
    
    if budget:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(budget, key, value)
        budget.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(budget)
    return budget


# ==================== FINANCIAL GOALS ====================

def create_goal(db: Session, username: str, data: FinancialGoalCreate) -> FinancialGoal:
    """Create new financial goal"""
    profile = get_or_create_user_profile(db, username)
    goal = FinancialGoal(**data.dict(), user_id=profile.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_goals(db: Session, username: str, active_only: bool = False) -> List[FinancialGoal]:
    """Get financial goals"""
    profile = get_or_create_user_profile(db, username)
    query = db.query(FinancialGoal).filter(FinancialGoal.user_id == profile.id)
    if active_only:
        query = query.filter(FinancialGoal.is_completed == False)
    return query.order_by(FinancialGoal.priority).all()


def update_goal(db: Session, username: str, goal_id: int, data: FinancialGoalUpdate) -> Optional[FinancialGoal]:
    """Update financial goal"""
    profile = get_or_create_user_profile(db, username)
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == profile.id
    ).first()
    
    if goal:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(goal, key, value)
        
        # Auto-complete if target reached
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
        
        goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(goal)
    return goal


def delete_goal(db: Session, username: str, goal_id: int) -> bool:
    """Delete financial goal"""
    profile = get_or_create_user_profile(db, username)
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == profile.id
    ).first()
    
    if goal:
        db.delete(goal)
        db.commit()
        return True
    return False


# ==================== DEBTS ====================

def create_debt(db: Session, username: str, data: DebtCreate) -> Debt:
    """Create new debt"""
    profile = get_or_create_user_profile(db, username)
    debt = Debt(**data.dict(), user_id=profile.id)
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


def get_debts(db: Session, username: str, active_only: bool = False) -> List[Debt]:
    """Get debts"""
    profile = get_or_create_user_profile(db, username)
    query = db.query(Debt).filter(Debt.user_id == profile.id)
    if active_only:
        query = query.filter(Debt.is_paid_off == False)
    return query.all()


def update_debt(db: Session, username: str, debt_id: int, data: DebtUpdate) -> Optional[Debt]:
    """Update debt"""
    profile = get_or_create_user_profile(db, username)
    debt = db.query(Debt).filter(
        Debt.id == debt_id,
        Debt.user_id == profile.id
    ).first()
    
    if debt:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(debt, key, value)
        
        # Auto-mark as paid off if balance is zero
        if debt.current_balance <= 0:
            debt.is_paid_off = True
        
        debt.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(debt)
    return debt


def delete_debt(db: Session, username: str, debt_id: int) -> bool:
    """Delete debt"""
    profile = get_or_create_user_profile(db, username)
    debt = db.query(Debt).filter(
        Debt.id == debt_id,
        Debt.user_id == profile.id
    ).first()
    
    if debt:
        db.delete(debt)
        db.commit()
        return True
    return False


# ==================== INVESTMENTS ====================

def create_investment(db: Session, username: str, data: InvestmentCreate) -> Investment:
    """Create new investment"""
    profile = get_or_create_user_profile(db, username)
    investment = Investment(**data.dict(), user_id=profile.id)
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment


def get_investments(db: Session, username: str) -> List[Investment]:
    """Get investments"""
    profile = get_or_create_user_profile(db, username)
    return db.query(Investment).filter(Investment.user_id == profile.id).all()


def update_investment(db: Session, username: str, investment_id: int, data: InvestmentUpdate) -> Optional[Investment]:
    """Update investment"""
    profile = get_or_create_user_profile(db, username)
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == profile.id
    ).first()
    
    if investment:
        for key, value in data.dict(exclude_unset=True).items():
            setattr(investment, key, value)
        investment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(investment)
    return investment


def delete_investment(db: Session, username: str, investment_id: int) -> bool:
    """Delete investment"""
    profile = get_or_create_user_profile(db, username)
    investment = db.query(Investment).filter(
        Investment.id == investment_id,
        Investment.user_id == profile.id
    ).first()
    
    if investment:
        db.delete(investment)
        db.commit()
        return True
    return False


# ==================== FINANCIAL SUMMARY & ANALYTICS ====================

def get_financial_summary(db: Session, username: str) -> FinancialSummary:
    """Get comprehensive financial summary"""
    profile = get_or_create_user_profile(db, username)
    
    # Calculate total assets (accounts + investments)
    accounts = get_accounts(db, username, active_only=True)
    total_account_balance = sum(acc.balance for acc in accounts if acc.balance > 0)
    
    investments = get_investments(db, username)
    total_investments_value = sum(
        (inv.quantity or 0) * (inv.current_price or 0) for inv in investments
    )
    
    total_assets = total_account_balance + total_investments_value
    
    # Calculate total liabilities (debts + negative balances)
    debts = get_debts(db, username, active_only=True)
    total_debt = sum(debt.current_balance for debt in debts)
    negative_balances = sum(abs(acc.balance) for acc in accounts if acc.balance < 0)
    total_liabilities = total_debt + negative_balances
    
    # Net worth
    net_worth = total_assets - total_liabilities
    
    # Monthly income/expenses (current month)
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    end_of_month = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
    
    income_transactions = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == profile.id,
        Transaction.transaction_type == TransactionType.INCOME,
        Transaction.date >= start_of_month,
        Transaction.date < end_of_month
    ).scalar() or 0
    
    expense_transactions = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == profile.id,
        Transaction.transaction_type == TransactionType.EXPENSE,
        Transaction.date >= start_of_month,
        Transaction.date < end_of_month
    ).scalar() or 0
    
    monthly_cash_flow = income_transactions - expense_transactions
    
    # Debt to income ratio
    monthly_income = profile.monthly_income or income_transactions
    debt_to_income_ratio = (total_debt / monthly_income * 100) if monthly_income > 0 else 0
    
    # Goals count
    all_goals = get_goals(db, username)
    active_goals_count = len([g for g in all_goals if not g.is_completed])
    completed_goals_count = len([g for g in all_goals if g.is_completed])
    
    # Budget adherence
    budgets = get_budgets(db, username, month=now.month, year=now.year)
    if budgets:
        total_budget = sum(b.monthly_limit for b in budgets)
        total_spent = sum(b.current_spent for b in budgets)
        budget_adherence_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0
    else:
        budget_adherence_percentage = 0
    
    # Top spending category
    top_category = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == profile.id,
        Transaction.transaction_type == TransactionType.EXPENSE,
        Transaction.date >= start_of_month,
        Transaction.date < end_of_month
    ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()
    
    top_spending_category = top_category[0].value if top_category else None
    top_spending_amount = float(top_category[1]) if top_category else 0
    
    return FinancialSummary(
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        net_worth=net_worth,
        total_income_this_month=income_transactions,
        total_expenses_this_month=expense_transactions,
        monthly_cash_flow=monthly_cash_flow,
        total_investments_value=total_investments_value,
        total_debt=total_debt,
        debt_to_income_ratio=debt_to_income_ratio,
        active_goals_count=active_goals_count,
        completed_goals_count=completed_goals_count,
        budget_adherence_percentage=budget_adherence_percentage,
        top_spending_category=top_spending_category,
        top_spending_amount=top_spending_amount
    )


def get_spending_by_category(db: Session, username: str, start_date: datetime, end_date: datetime) -> Dict[str, float]:
    """Get spending breakdown by category"""
    profile = get_or_create_user_profile(db, username)
    
    results = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == profile.id,
        Transaction.transaction_type == TransactionType.EXPENSE,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by(Transaction.category).all()
    
    return {cat.value: float(total) for cat, total in results if cat}


def get_income_vs_expenses_trend(db: Session, username: str, months: int = 6) -> Dict[str, List[float]]:
    """Get monthly income vs expenses for last N months"""
    profile = get_or_create_user_profile(db, username)
    now = datetime.utcnow()
    
    income_data = []
    expense_data = []
    labels = []
    
    for i in range(months - 1, -1, -1):
        month_date = now - timedelta(days=i * 30)
        start_of_month = datetime(month_date.year, month_date.month, 1)
        end_of_month = datetime(month_date.year, month_date.month + 1, 1) if month_date.month < 12 else datetime(month_date.year + 1, 1, 1)
        
        income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == profile.id,
            Transaction.transaction_type == TransactionType.INCOME,
            Transaction.date >= start_of_month,
            Transaction.date < end_of_month
        ).scalar() or 0
        
        expenses = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == profile.id,
            Transaction.transaction_type == TransactionType.EXPENSE,
            Transaction.date >= start_of_month,
            Transaction.date < end_of_month
        ).scalar() or 0
        
        income_data.append(float(income))
        expense_data.append(float(expenses))
        labels.append(start_of_month.strftime("%b %Y"))
    
    return {
        "labels": labels,
        "income": income_data,
        "expenses": expense_data
    }
