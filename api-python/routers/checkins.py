import uuid
import math
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, status, Depends
from bson import ObjectId
from database import get_db
from models import CheckIn, CheckInCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/checkins", tags=["Check-Ins"])

class AssignTripPayload(BaseModel):
    checkin_ids: List[str]
    trip_name: Optional[str] = None

class UpdateCheckInPayload(BaseModel):
    trip_name: Optional[str] = None
    visited_at: Optional[str] = None

# Haversine Distance helper (coords: [longitude, latitude])
def haversine_distance(coords1: List[float], coords2: List[float]) -> float:
    lon1, lat1 = coords1
    lon2, lat2 = coords2
    
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 3958.8  # Radius of earth in miles
    return c * r

# Sequential distance calculator within a trip (uses home_coordinates for first stop if present)
async def recalculate_trip_distances(user_id: str, trip_name: Optional[str]):
    if not trip_name or not trip_name.strip():
        return

    db = get_db()
    trip_name_clean = trip_name.strip()

    # Fetch and sort chronologically (visited_at ascending)
    cursor = db.checkins.find({"user_id": user_id, "trip_name": trip_name_clean}).sort("visited_at", 1)
    checkins = await cursor.to_list(length=None)

    if not checkins:
        return

    # Resolve coordinates
    brewery_ids = [c["brewery_id"] for c in checkins]
    brew_cursor = db.breweries.find({"id": {"$in": brewery_ids}})
    breweries = await brew_cursor.to_list(length=None)
    breweries_map = {b["id"]: b["location"]["coordinates"] for b in breweries if b.get("location")}

    # Resolve user home coordinates for the first stop fallback with resilient user lookup
    user_query = {"$or": [{"id": user_id}, {"_id": user_id}]}
    try:
        if ObjectId.is_valid(user_id):
            user_query["$or"].append({"_id": ObjectId(user_id)})
    except Exception:
        pass
    user = await db.users.find_one(user_query)
    if not user:
        print(f"[WARN] Could not find user document in database for user_id: {user_id}")
    home_coords = user.get("home_coordinates") if user else None

    # Calculate and update
    for i, current in enumerate(checkins):
        distance = 0.0
        if i > 0:
            prev = checkins[i - 1]
            coords1 = breweries_map.get(prev["brewery_id"])
            coords2 = breweries_map.get(current["brewery_id"])
            if coords1 and coords2:
                distance = haversine_distance(coords1, coords2)
        elif home_coords:
            # First stop: calculate distance from user's home location coordinates!
            current_coords = breweries_map.get(current["brewery_id"])
            if current_coords:
                distance = haversine_distance(home_coords, current_coords)

        rounded_distance = round(distance, 2)
        await db.checkins.update_one(
            {"id": current["id"]},
            {"$set": {"distance_miles": rounded_distance}}
        )

@router.get("", response_model=List[CheckIn])
async def get_checkins(
    trip_name: Optional[str] = None,
    limit: int = Query(50, ge=1),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]
    filter_query = {"user_id": user_id}

    if trip_name:
        filter_query["trip_name"] = {"$regex": trip_name, "$options": "i"}

    cursor = db.checkins.find(filter_query, {"_id": 0}).sort("visited_at", -1).limit(limit)
    checkins = await cursor.to_list(length=limit)
    return checkins

@router.post("", response_model=CheckIn, status_code=status.HTTP_201_CREATED)
async def create_checkin(
    payload: CheckInCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]

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

    clean_trip_name = payload.trip_name.strip() if payload.trip_name else None

    # Resolve home coordinates and calculate distance for single/standalone stops
    initial_distance = 0.0
    if not clean_trip_name:
        user_query = {"$or": [{"id": user_id}, {"_id": user_id}]}
        try:
            if ObjectId.is_valid(user_id):
                user_query["$or"].append({"_id": ObjectId(user_id)})
        except Exception:
            pass
        user = await db.users.find_one(user_query)
        if user:
            home_coords = user.get("home_coordinates")
            if home_coords and isinstance(home_coords, list) and len(home_coords) == 2 and brewery.get("location") and brewery["location"].get("coordinates"):
                initial_distance = haversine_distance(home_coords, brewery["location"]["coordinates"])
            else:
                print(f"[WARN] User {user.get('email')} missing home_coordinates")
        else:
            print(f"[WARN] Could not find user document in database for user_id: {user_id}")

    new_checkin = payload.dict()
    new_checkin["id"] = str(uuid.uuid4())
    new_checkin["user_id"] = user_id  # set authenticated user
    new_checkin["visited_at"] = formatted_visited_at
    new_checkin["trip_name"] = clean_trip_name
    new_checkin["distance_miles"] = round(initial_distance, 2)

    await db.checkins.insert_one(new_checkin)

    # Recalculate trip distances if part of a trip
    if clean_trip_name:
        await recalculate_trip_distances(user_id, clean_trip_name)

    # Query and return the freshly updated check-in document in the HTTP response
    fresh_checkin = await db.checkins.find_one({"id": new_checkin["id"]}, {"_id": 0})
    if not fresh_checkin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve the newly registered check-in."
        )

    return fresh_checkin

@router.put("/{id}", response_model=CheckIn)
async def update_checkin(
    id: str,
    payload: UpdateCheckInPayload,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]

    existing = await db.checkins.find_one({"id": id, "user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Check-in record with ID {id} not found."
        )

    old_trip_name = existing.get("trip_name")
    
    # Calculate updates
    updates = {}
    if payload.trip_name is not None:
        updates["trip_name"] = payload.trip_name.strip() if payload.trip_name else None
    if payload.visited_at is not None:
        try:
            from datetime import datetime
            iso_str = payload.visited_at
            if iso_str.endswith("Z"):
                iso_str = iso_str[:-1] + "+00:00"
            datetime.fromisoformat(iso_str)
            formatted_visited_at = payload.visited_at
            if not formatted_visited_at.endswith("Z") and "+" not in formatted_visited_at:
                formatted_visited_at += "Z"
            updates["visited_at"] = formatted_visited_at
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="visited_at must be a valid ISO datetime string."
            )

    if updates:
        await db.checkins.update_one({"id": id, "user_id": user_id}, {"$set": updates})

    new_trip_name = updates.get("trip_name", old_trip_name)

    # Recalculate trip distances if trip changed or order shifted
    if old_trip_name:
        await recalculate_trip_distances(user_id, old_trip_name)
    if new_trip_name and new_trip_name != old_trip_name:
        await recalculate_trip_distances(user_id, new_trip_name)

    updated = await db.checkins.find_one({"id": id, "user_id": user_id}, {"_id": 0})
    return updated

@router.patch("/assign-trip")
async def assign_trip(
    payload: AssignTripPayload,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]
    clean_trip_name = payload.trip_name.strip() if payload.trip_name else None

    # Fetch pre-existing trip names to recalculate
    cursor = db.checkins.find({"id": {"$in": payload.checkin_ids}, "user_id": user_id})
    affected = await cursor.to_list(length=None)
    
    old_trips = list(set([c.get("trip_name") for c in affected if c.get("trip_name")]))

    # Batch update
    await db.checkins.update_many(
        {"id": {"$in": payload.checkin_ids}, "user_id": user_id},
        {"$set": {"trip_name": clean_trip_name}}
    )

    # Recalculate distances for newly assigned and all old trips
    if clean_trip_name:
        await recalculate_trip_distances(user_id, clean_trip_name)
    for old_trip in old_trips:
        if old_trip != clean_trip_name:
            await recalculate_trip_distances(user_id, old_trip)

    return {"message": "Stops assigned and distances calculated successfully."}
