import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from database import get_db
from models import UserRegister, UserLogin, AuthResponse, User
from utils.auth import hash_password, verify_password, create_access_token, verify_access_token

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
        "is_admin": False,
        "created_at": created_at_iso
    }

    await db.users.insert_one(new_user_doc)

    token = create_access_token(user_id=user_id, email=email_lower, role="user", is_admin=False)

    return AuthResponse(
        access_token=token,
        token_type="Bearer",
        user=User(
            id=user_id,
            email=email_lower,
            full_name=payload.full_name,
            role="user",
            is_admin=False,
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

    is_admin_flag = user_doc.get("is_admin", False) or user_doc.get("role") == "admin"
    token = create_access_token(
        user_id=user_doc["id"],
        email=user_doc["email"],
        role=user_doc["role"],
        is_admin=is_admin_flag
    )

    return AuthResponse(
        access_token=token,
        token_type="Bearer",
        user=User(
            id=user_doc["id"],
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"],
            is_admin=is_admin_flag,
            home_city=user_doc.get("home_city"),
            home_coordinates=user_doc.get("home_coordinates"),
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
    return payload  # contains: id, email, role

# PUT /auth/profile - Update user display name or home location (with auto-geocoding)
from models import UserProfileUpdate
import urllib.request
import urllib.parse
import json

@router.put("/profile", response_model=User)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]

    updates = {}
    if payload.username is not None:
        username_clean = payload.username.strip()
        if not username_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="username must be a valid non-empty string."
            )
        updates["full_name"] = username_clean

    if payload.home_city is not None:
        home_city_clean = payload.home_city.strip()
        if not home_city_clean:
            updates["home_city"] = None
            updates["home_coordinates"] = None
        else:
            updates["home_city"] = home_city_clean
            
            # Fetch GPS coordinates from Nominatim
            try:
                query_str = urllib.parse.quote(home_city_clean)
                url = f"https://nominatim.openstreetmap.org/search?q={query_str}&format=json&limit=1"
                req = urllib.request.Request(url, headers={'User-Agent': 'BrewsTraveller-FastAPI'})
                
                # Fetch synchronously since it's an isolated profile set
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_data = json.loads(response.read().decode())
                    if res_data and len(res_data) > 0:
                        lat = float(res_data[0]["lat"])
                        lon = float(res_data[0]["lon"])
                        updates["home_coordinates"] = [lon, lat]
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Could not geocode home location: {home_city_clean}"
                        )
            except HTTPException as http_exc:
                raise http_exc
            except Exception as e:
                print(f"Nominatim geocoding failed: {e}")

    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})

    updated_user = await db.users.find_one({"id": user_id})
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return User(
        id=updated_user["id"],
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        role=updated_user["role"],
        home_city=updated_user.get("home_city"),
        home_coordinates=updated_user.get("home_coordinates"),
        created_at=updated_user["created_at"]
    )

# POST /auth/reset-password - Simplified password reset flow (Test App Mode)
from models import UserPasswordReset

@router.post("/reset-password")
async def reset_password(payload: UserPasswordReset):
    db = get_db()
    query_str = payload.username.strip().lower()
    
    # Find user by email or full_name
    user = await db.users.find_one({
        "$or": [
            { "email": query_str },
            { "full_name": payload.username.strip() }
        ]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    hashed = hash_password(payload.new_password.strip())
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hashed}})
    
    return {"message": "Password updated successfully."}
