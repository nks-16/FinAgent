"""
Database initialization for financial models
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.financial_models import Base
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:rootpass@mysql:3306/finagent_db"
)

# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_financial_db():
    """Initialize financial tables in the database"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Financial database tables created successfully")
        return True
    except Exception as e:
        print(f"✗ Error creating financial tables: {e}")
        return False


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection():
    """Check if database connection is working"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
