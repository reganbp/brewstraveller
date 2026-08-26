import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict

JWT_SECRET = os.getenv("JWT_SECRET", "brewstraveller_super_secret_key_123!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "id": user_id,
        "email": email,
        "role": role,
        "exp": expire
    }
    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
