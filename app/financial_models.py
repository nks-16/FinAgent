"""
SQLAlchemy models for personal financial tracking
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class UserProfile(Base):
    """User financial profile"""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(200))
    email = Column(String(200))
    phone = Column(String(20))
    age = Column(Integer)
    occupation = Column(String(200))
    profile_photo_url = Column(String(500))  # Store photo URL or base64
    annual_income = Column(Float, default=0.0)
    monthly_income = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    risk_tolerance = Column(String(20), default="moderate")  # conservative, moderate, aggressive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")


class AccountType(str, enum.Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"
    OTHER = "other"


class Account(Base):
    """Bank accounts, credit cards, investment accounts"""
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g., "Chase Checking"
    account_type = Column(SQLEnum(AccountType), nullable=False)
    institution = Column(String(200))  # Bank name
    account_number_last4 = Column(String(4))  # Last 4 digits for security
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TransactionCategory(str, enum.Enum):
    # Income categories
    SALARY = "salary"
    BONUS = "bonus"
    FREELANCE = "freelance"
    INVESTMENT_INCOME = "investment_income"
    OTHER_INCOME = "other_income"
    
    # Expense categories
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


class Transaction(Base):
    """Income and expense transactions"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    category = Column(SQLEnum(TransactionCategory))
    amount = Column(Float, nullable=False)
    description = Column(String(500))
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    merchant = Column(String(200))
    notes = Column(Text)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")


class Budget(Base):
    """Monthly budgets by category"""
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    category = Column(SQLEnum(TransactionCategory), nullable=False)
    monthly_limit = Column(Float, nullable=False)
    current_spent = Column(Float, default=0.0)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="budgets")


class GoalType(str, enum.Enum):
    EMERGENCY_FUND = "emergency_fund"
    RETIREMENT = "retirement"
    HOME_PURCHASE = "home_purchase"
    EDUCATION = "education"
    VACATION = "vacation"
    DEBT_FREE = "debt_free"
    INVESTMENT = "investment"
    OTHER = "other"


class FinancialGoal(Base):
    """Financial goals and savings targets"""
    __tablename__ = "financial_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(DateTime)
    monthly_contribution = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    priority = Column(Integer, default=1)  # 1=high, 2=medium, 3=low
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="goals")


class Debt(Base):
    """Debts and loans tracking"""
    __tablename__ = "debts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g., "Student Loan", "Credit Card"
    debt_type = Column(String(50))  # mortgage, auto_loan, student_loan, credit_card, personal_loan
    initial_balance = Column(Float, nullable=False)
    current_balance = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # Annual percentage
    minimum_payment = Column(Float)
    payment_date = Column(Integer)  # Day of month (1-31)
    lender = Column(String(200))
    is_paid_off = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="debts")


class Investment(Base):
    """Investment holdings and portfolio"""
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)  # e.g., "Apple Stock", "Index Fund"
    investment_type = Column(String(50))  # stock, bond, mutual_fund, etf, crypto, real_estate
    symbol = Column(String(20))  # Ticker symbol
    quantity = Column(Float)
    purchase_price = Column(Float)
    current_price = Column(Float)
    purchase_date = Column(DateTime)
    account_name = Column(String(200))  # e.g., "401k", "Brokerage"
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserProfile", back_populates="investments")
