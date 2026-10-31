"""
SpashtMandate AI - Cryptographically Secure Authentication Service
Uses standard-library PBKDF2-HMAC-SHA256 with 100,000 iterations and random 16-byte salt.
Zero external compiled dependencies, constant-time comparison, session token generation.
"""

import os
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from backend.models import UserModel, UserSessionModel

PBKDF2_ITERATIONS = 100_000
SESSION_DURATION_DAYS = 30

def hash_password(password: str, salt: Optional[bytes] = None) -> Tuple[str, str]:
    """Hashes a plaintext password with a 16-byte salt using PBKDF2-HMAC-SHA256."""
    if salt is None:
        salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        PBKDF2_ITERATIONS
    )
    return hashed.hex(), salt.hex()

def verify_password(plain_password: str, password_hash: str, salt_hex: str) -> bool:
    """Verifies a password against the stored PBKDF2 hash using constant-time comparison."""
    try:
        salt = bytes.fromhex(salt_hex)
        candidate_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt,
            PBKDF2_ITERATIONS
        ).hex()
        return hmac.compare_digest(candidate_hash, password_hash)
    except Exception:
        return False

def generate_session_token() -> str:
    """Generates a secure 32-byte URL-safe authentication token."""
    return secrets.token_urlsafe(32)

def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str = ""
) -> UserModel:
    """Creates a new user record with hashed password."""
    normalized_email = email.strip().lower()
    existing = db.query(UserModel).filter(UserModel.email == normalized_email).first()
    if existing:
        raise ValueError("An account with this email address already exists.")
    
    pwd_hash, salt = hash_password(password)
    user = UserModel(
        id=str(uuid.uuid4()),
        email=normalized_email,
        password_hash=pwd_hash,
        password_salt=salt,
        full_name=full_name.strip(),
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Optional[UserModel]:
    """Authenticates credentials and returns user if valid."""
    normalized_email = email.strip().lower()
    user = db.query(UserModel).filter(UserModel.email == normalized_email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash, user.password_salt):
        return None
    return user

def create_user_session(db: Session, user_id: str) -> UserSessionModel:
    """Generates and persists an active user session token."""
    token = generate_session_token()
    session = UserSessionModel(
        token=token,
        user_id=user_id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=SESSION_DURATION_DAYS)
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_user_from_token(db: Session, token: str) -> Optional[UserModel]:
    """Resolves an active non-expired session token to its UserModel."""
    if not token:
        return None
    session = db.query(UserSessionModel).filter(
        UserSessionModel.token == token,
        UserSessionModel.expires_at > datetime.utcnow()
    ).first()
    if not session:
        return None
    return db.query(UserModel).filter(UserModel.id == session.user_id).first()

def revoke_session(db: Session, token: str) -> bool:
    """Revokes a session token upon logout."""
    if not token:
        return False
    session = db.query(UserSessionModel).filter(UserSessionModel.token == token).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False

