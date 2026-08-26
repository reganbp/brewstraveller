import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from database import get_db
from models import UserRegister, UserLogin, AuthResponse, User
from utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    db = get_db()
    email_lower = payload.email.lower()

    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    hashed = hash_password(payload.password)
    user_id = str(uuid.uuid4())
    created_at_iso = datetime.utcnow().isoformat() + "Z"

    new_user_doc = {
        "id": user_id,
        "email": email_lower,
        "password_hash": hashed,
        "full_name": payload.full_name,
        "role": "user",
        "created_at": created_at_iso
    }

    await db.users.insert_one(new_user_doc)

    token = create_access_token(user_id=user_id, email=email_lower, role="user")

    return AuthResponse(
        access_token=token,
        token_type="Bearer",
        user=User(
            id=user_id,
            email=email_lower,
            full_name=payload.full_name,
            role="user",
            created_at=created_at_iso
        )
    )

@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin):
    db = get_db()
    email_lower = payload.email.lower()

    user_doc = await db.users.find_one({"email": email_lower})
    if not user_doc or not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(
        user_id=user_doc["id"],
        email=user_doc["email"],
        role=user_doc["role"]
    )

    return AuthResponse(
        access_token=token,
        token_type="Bearer",
        user=User(
            id=user_doc["id"],
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"],
            created_at=user_doc["created_at"]
        )
    )

# FastAPI Dependency for JWT verification
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

security_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    token = credentials.credentials
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is expired or invalid."
        )
    return payload  # contains: id, email, role
