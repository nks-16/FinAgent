import os
import datetime as dt
from typing import Generator, Optional
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import Column, Integer, String, create_engine, select
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Load secrets from env
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "60"))

DB_URL = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or "sqlite:///./finagent.db"
if DB_URL.startswith("mysql://"):
    # SQLAlchemy mysql+pymysql URL
    DB_URL = DB_URL.replace("mysql://", "mysql+pymysql://")

engine = create_engine(DB_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

# Use Argon2 - modern, secure, no 72-byte limitation
pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def hash_password(p: str) -> str:
    # Argon2 has no length limitation, can handle any password length
    return pwd_ctx.hash(p)


def verify_password(p: str, h: str) -> bool:
    # Argon2 verification - no truncation needed
    return pwd_ctx.verify(p, h)


def create_token(sub: str) -> str:
    now = dt.datetime.utcnow()
    payload = {"sub": sub, "iat": now, "exp": now + dt.timedelta(minutes=JWT_EXPIRE_MIN)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[str]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return data.get("sub")
    except JWTError:
        return None


def handle_signup(db: Session, data: SignupRequest) -> None:
    # check if exists
    exists = db.scalar(select(User).where(User.email == data.email))
    if exists:
        raise ValueError("Email already registered")
    u = User(email=str(data.email).lower(), password_hash=hash_password(data.password))
    db.add(u)
    db.commit()


def handle_login(db: Session, data: LoginRequest) -> str:
    u: Optional[User] = db.scalar(select(User).where(User.email == data.email))
    if not u or not verify_password(data.password, u.password_hash):
        raise ValueError("Invalid credentials")
    return create_token(u.email)
