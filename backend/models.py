"""
SQLAlchemy Database Models for FraudShield.
Code Cortex 3.0 Hackathon - Finance Track
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from backend.database import Base


class User(Base):
    """
    User Account Table for Authentication.
    Passwords are strictly stored as secure cryptographic salted hashes.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
