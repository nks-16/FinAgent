"""
Pydantic schemas for financial API requests and responses
"""
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


# Enums
class AccountTypeEnum(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"
    OTHER = "other"


class TransactionTypeEnum(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TransactionCategoryEnum(str, Enum):
    SALARY = "salary"
    BONUS = "bonus"
    FREELANCE = "freelance"
    INVESTMENT_INCOME = "investment_income"
    OTHER_INCOME = "other_income"
    HOUSING = "housing"
    UTILITIES = "utilities"
    GROCERIES = "groceries"
    DINING = "dining"
    TRANSPORTATION = "transportation"
    HEALTHCARE = "healthcare"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    EDUCATION = "education"
    INSURANCE = "insurance"
    DEBT_PAYMENT = "debt_payment"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    PERSONAL = "personal"
    OTHER_EXPENSE = "other_expense"


class GoalTypeEnum(str, Enum):
    EMERGENCY_FUND = "emergency_fund"
    RETIREMENT = "retirement"
    HOME_PURCHASE = "home_purchase"
    EDUCATION = "education"
    VACATION = "vacation"
    DEBT_FREE = "debt_free"
    INVESTMENT = "investment"
    OTHER = "other"


# User Profile Schemas
class UserProfileCreate(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    annual_income: float = 0.0
    monthly_income: float = 0.0
    currency: str = "USD"
    risk_tolerance: str = "moderate"


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    monthly_income: Optional[float] = None
    currency: Optional[str] = None
    risk_tolerance: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    age: Optional[int]
    occupation: Optional[str]
    profile_photo_url: Optional[str]
    annual_income: float
    monthly_income: float
    currency: str
    risk_tolerance: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# Account Schemas
class AccountCreate(BaseModel):
    name: str
    account_type: AccountTypeEnum
    institution: Optional[str] = None
    account_number_last4: Optional[str] = None
    balance: float = 0.0
    currency: str = "USD"


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None
    balance: Optional[float] = None
    is_active: Optional[bool] = None


class AccountResponse(BaseModel):
    id: int
    user_id: int
    name: str
    account_type: str
    institution: Optional[str]
    account_number_last4: Optional[str]
    balance: float
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# Transaction Schemas
class TransactionCreate(BaseModel):
    account_id: Optional[int] = None
    transaction_type: TransactionTypeEnum
    category: Optional[TransactionCategoryEnum] = None
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    merchant: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: bool = False


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category: Optional[TransactionCategoryEnum] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    account_id: Optional[int]
    transaction_type: str
    category: Optional[str]
    amount: float
    description: Optional[str]
    date: datetime
    merchant: Optional[str]
    notes: Optional[str]
    is_recurring: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


# Budget Schemas
class BudgetCreate(BaseModel):
    category: TransactionCategoryEnum
    monthly_limit: float
    month: int = Field(ge=1, le=12)
    year: int


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    current_spent: Optional[float] = None
    is_active: Optional[bool] = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    current_spent: float
    month: int
    year: int
    is_active: bool
    percentage_used: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
    
    @validator('percentage_used', always=True)
    def calculate_percentage(cls, v, values):
        if 'monthly_limit' in values and values['monthly_limit'] > 0:
            return (values.get('current_spent', 0) / values['monthly_limit']) * 100
        return 0.0


# Financial Goal Schemas
class FinancialGoalCreate(BaseModel):
    name: str
    goal_type: GoalTypeEnum
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[datetime] = None
    monthly_contribution: float = 0.0
    priority: int = Field(default=1, ge=1, le=3)
    notes: Optional[str] = None


class FinancialGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    monthly_contribution: Optional[float] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    notes: Optional[str] = None
    is_completed: Optional[bool] = None


class FinancialGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    goal_type: str
    target_amount: float
    current_amount: float
    target_date: Optional[datetime]
    monthly_contribution: float
    is_completed: bool
    priority: int
    progress_percentage: float = 0.0
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
    
    @validator('progress_percentage', always=True)
    def calculate_progress(cls, v, values):
        if 'target_amount' in values and values['target_amount'] > 0:
            return min((values.get('current_amount', 0) / values['target_amount']) * 100, 100.0)
        return 0.0


# Debt Schemas
class DebtCreate(BaseModel):
    name: str
    debt_type: str
    initial_balance: float
    current_balance: float
    interest_rate: float
    minimum_payment: Optional[float] = None
    payment_date: Optional[int] = Field(None, ge=1, le=31)
    lender: Optional[str] = None


class DebtUpdate(BaseModel):
    current_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None
    payment_date: Optional[int] = Field(None, ge=1, le=31)
    is_paid_off: Optional[bool] = None


class DebtResponse(BaseModel):
    id: int
    user_id: int
    name: str
    debt_type: str
    initial_balance: float
    current_balance: float
    interest_rate: float
    minimum_payment: Optional[float]
    payment_date: Optional[int]
    lender: Optional[str]
    is_paid_off: bool
    progress_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
    
    @validator('progress_percentage', always=True)
    def calculate_payoff_progress(cls, v, values):
        if 'initial_balance' in values and values['initial_balance'] > 0:
            paid_amount = values['initial_balance'] - values.get('current_balance', 0)
            return (paid_amount / values['initial_balance']) * 100
        return 0.0


# Investment Schemas
class InvestmentCreate(BaseModel):
    name: str
    investment_type: str
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    current_price: Optional[float] = None
    purchase_date: Optional[datetime] = None
    account_name: Optional[str] = None
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    current_price: Optional[float] = None
    notes: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    investment_type: str
    symbol: Optional[str]
    quantity: Optional[float]
    purchase_price: Optional[float]
    current_price: Optional[float]
    purchase_date: Optional[datetime]
    account_name: Optional[str]
    total_value: float = 0.0
    gain_loss: float = 0.0
    gain_loss_percentage: float = 0.0
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
    
    @validator('total_value', always=True)
    def calculate_total_value(cls, v, values):
        quantity = values.get('quantity', 0) or 0
        current_price = values.get('current_price', 0) or 0
        return quantity * current_price
    
    @validator('gain_loss', always=True)
    def calculate_gain_loss(cls, v, values):
        quantity = values.get('quantity', 0) or 0
        purchase_price = values.get('purchase_price', 0) or 0
        current_price = values.get('current_price', 0) or 0
        return quantity * (current_price - purchase_price)
    
    @validator('gain_loss_percentage', always=True)
    def calculate_gain_loss_percentage(cls, v, values):
        purchase_price = values.get('purchase_price', 0)
        current_price = values.get('current_price', 0)
        if purchase_price and purchase_price > 0:
            return ((current_price - purchase_price) / purchase_price) * 100
        return 0.0


# Financial Summary Schema
class FinancialSummary(BaseModel):
    total_assets: float
    total_liabilities: float
    net_worth: float
    total_income_this_month: float
    total_expenses_this_month: float
    monthly_cash_flow: float
    total_investments_value: float
    total_debt: float
    debt_to_income_ratio: float
    active_goals_count: int
    completed_goals_count: int
    budget_adherence_percentage: float
    top_spending_category: Optional[str]
    top_spending_amount: float
