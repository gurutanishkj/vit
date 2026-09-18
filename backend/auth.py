"""
Authentication & Authorization Module for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track

Implements:
- PBKDF2-HMAC-SHA256 password hashing with random salt
- JWT (JSON Web Tokens) access token issuance and signature verification
- Endpoints: POST /auth/register, POST /auth/login, GET /auth/me
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db, Base, engine
from backend.models import User

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

# Security Constants
SECRET_KEY = os.getenv("FRAUDSHIELD_SECRET_KEY", "code-cortex-vit-fraudshield-supersecret-jwt-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 48  # Convenient duration for 30h hackathon

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# -------------------------------------------------------------
# Password Hashing Utilities (Zero external C-extension issues)
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    """
    Computes a secure PBKDF2-HMAC-SHA256 hash with a cryptographically secure random 16-byte salt.
    Format: 'salt_hex$hash_hex'
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations=100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a stored 'salt$hash' signature."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 2:
            return False
        salt, expected_hash = parts
        key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations=100000
        )
        return secrets.compare_digest(key.hex(), expected_hash)
    except Exception:
        return False


# -------------------------------------------------------------
# JWT Utilities
# -------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that enforces valid JWT Bearer token on protected endpoints.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired or is invalid",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User account not found")
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency that returns the authenticated User if valid token is provided,
    or None if caller is an unauthenticated guest.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except Exception:
        return None


# -------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Full Name")
    email: str = Field(..., min_length=3, max_length=120, description="Email Address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    confirm_password: str = Field(..., description="Confirm Password")


class LoginRequest(BaseModel):
    email: str = Field(..., description="Email Address")
    password: str = Field(..., description="Password")


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@auth_router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new user account with hashed password and returns an access token.
    """
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check if email is already taken
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed = hash_password(req.password)
    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email, "uid": user.id, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user credentials and issues a JWT token.
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": user.email, "uid": user.id, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.post("/guest", response_model=AuthResponse)
def guest_login(db: Session = Depends(get_db)):
    """
    Issues a Guest Analyst session token for instant control and evaluation without registration.
    """
    guest_email = "guest@fraudshield.local"
    user = db.query(User).filter(User.email == guest_email).first()
    if not user:
        user = User(
            name="Guest Security Analyst",
            email=guest_email,
            hashed_password=hash_password(secrets.token_hex(16))
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.email, "uid": user.id, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's profile info.
    """
    return current_user
