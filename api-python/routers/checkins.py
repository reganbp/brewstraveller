import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from database import get_db
from models import CheckIn, CheckInCreate

router = APIRouter()

@router.get("", response_model=List[CheckIn])
async def get_checkins(
    user_id: Optional[str] = None,
    trip_name: Optional[str] = None,
    limit: int = Query(50, ge=1)
):
    db = get_db()
    filter_query = {}

    if user_id:
        filter_query["user_id"] = user_id
    if trip_name:
        filter_query["trip_name"] = {"$regex": trip_name, "$options": "i"}

    cursor = db.checkins.find(filter_query, {"_id": 0}).sort("visited_at", -1).limit(limit)
    checkins = await cursor.to_list(length=limit)
    return checkins

@router.post("", response_model=CheckIn, status_code=status.HTTP_201_CREATED)
async def create_checkin(payload: CheckInCreate):
    db = get_db()

    # Verify the brewery exists
    brewery = await db.breweries.find_one({"id": payload.brewery_id})
    if not brewery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brewery with ID {payload.brewery_id} not found."
        )

    # Format and validate visited_at to ISO string
    try:
        from datetime import datetime
        iso_str = payload.visited_at
        if iso_str.endswith("Z"):
            iso_str = iso_str[:-1] + "+00:00"
        datetime.fromisoformat(iso_str)
        formatted_visited_at = payload.visited_at
        if not formatted_visited_at.endswith("Z") and "+" not in formatted_visited_at:
            formatted_visited_at += "Z"
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="visited_at must be a valid ISO datetime string."
        )

    new_checkin = payload.dict()
    new_checkin["id"] = str(uuid.uuid4())
    new_checkin["visited_at"] = formatted_visited_at

    await db.checkins.insert_one(new_checkin)

    # Remove MongoDB _id before returning
    new_checkin.pop("_id", None)
    return new_checkin
