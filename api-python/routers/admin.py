import re
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# Middleware/Dependency: Verify JWT is_admin privileges
async def require_admin(current_user: dict = Depends(get_current_user)):
    # Support role string or explicit is_admin boolean
    role = current_user.get("role")
    is_admin = current_user.get("is_admin", False)
    
    if role != "admin" and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
    return current_user

# Helper to resolve MongoDB collections dynamically
def get_collection_by_name(db, name: str):
    name_clean = name.strip().lower()
    if name_clean == "users":
        return db.users
    elif name_clean == "breweries":
        return db.breweries
    elif name_clean == "checkins":
        return db.checkins
    elif name_clean == "trips":
        return db.trips
    return None

# GET /admin/collections/{collection} - Retrieve, search, and paginate collection documents
@router.get("/collections/{collection}", dependencies=[Depends(require_admin)])
async def get_collection(
    collection: str,
    q: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    db = get_db()
    col = get_collection_by_name(db, collection)
    if col is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid collection name: '{collection}'. Available: users, breweries, checkins, trips."
        )

    query = {}
    search_str = q.strip() if q else ""

    if search_str:
        # Create insensitive regex matcher
        regex = {"$regex": search_str, "$options": "i"}
        col_lower = collection.lower()
        
        if col_lower == "users":
            query["$or"] = [{"email": regex}, {"full_name": regex}, {"id": regex}]
        elif col_lower == "breweries":
            query["$or"] = [{"name": regex}, {"city": regex}, {"state": regex}, {"id": regex}]
        elif col_lower == "checkins":
            query["$or"] = [{"notes": regex}, {"trip_name": regex}, {"id": regex}]
        elif col_lower == "trips":
            query["$or"] = [{"name": regex}, {"description": regex}, {"id": regex}]

    # Always exclude password hashes
    projection = {"_id": 0, "password_hash": 0}
    
    data_cursor = col.find(query, projection).skip(skip).limit(limit)
    data = await data_cursor.to_list(length=limit)
    
    total = await col.count_documents(query)

    return {
        "collection": collection,
        "data": data,
        "total": total,
        "limit": limit,
        "skip": skip
    }

# PUT /admin/collections/{collection}/{id} - Update dynamic document fields
@router.put("/collections/{collection}/{id}")
async def update_document(
    collection: str,
    id: str,
    payload: dict,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    col = get_collection_by_name(db, collection)
    if col is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid collection name: '{collection}'."
        )

    existing = await col.find_one({"id": id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' not found in '{collection}'."
        )

    # Safety checks: strip immutable parameters
    safe_updates = {**payload}
    if "_id" in safe_updates:
        del safe_updates["_id"]
    if "id" in safe_updates:
        del safe_updates["id"]
    if "password_hash" in safe_updates:
        del safe_updates["password_hash"]

    # Normalize role attributes if is_admin is toggled
    if collection.lower() == "users" and "is_admin" in safe_updates:
        safe_updates["role"] = "admin" if safe_updates["is_admin"] else "user"

    if safe_updates:
        await col.update_one({"id": id}, {"$set": safe_updates})

    updated = await col.find_one({"id": id}, {"_id": 0, "password_hash": 0})
    return updated

# DELETE /admin/collections/{collection}/{id} - Purge dynamic document record from MongoDB
@router.delete("/collections/{collection}/{id}")
async def delete_document(
    collection: str,
    id: str,
    current_user: dict = Depends(require_admin)
):
    db = get_db()
    col = get_collection_by_name(db, collection)
    if col is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid collection name: '{collection}'."
        )

    existing = await col.find_one({"id": id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' not found in '{collection}'."
        )

    # Prevent self-deletion
    if collection.lower() == "users" and id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-deletion of administrator credentials is strictly prohibited."
        )

    await col.delete_one({"id": id})

    return {
        "message": f"Document with ID '{id}' successfully purged from collection '{collection}'."
    }
