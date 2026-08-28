import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db
from models import Trip, TripCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("", response_model=List[Trip])
async def get_trips(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    cursor = db.trips.find({"user_id": user_id}, {"_id": 0})
    trips = await cursor.to_list(length=None)
    return trips

@router.post("", response_model=Trip, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    trip_name = payload.name.strip()

    # Check if a trip with this name already exists for the user
    existing = await db.trips.find_one({"user_id": user_id, "name": trip_name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A trip named '{trip_name}' already exists."
        )

    new_trip = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": trip_name,
        "description": payload.description,
        "planned_brewery_ids": payload.planned_brewery_ids,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    await db.trips.insert_one(new_trip)
    new_trip.pop("_id", None)
    return new_trip

@router.put("/{id}", response_model=Trip)
async def update_trip(id: str, payload: TripCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]

    existing = await db.trips.find_one({"id": id, "user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {id} not found."
        )

    old_name = existing["name"]
    new_name = payload.name.strip()

    # If renamed, prevent duplicate names
    if new_name != old_name:
        dup = await db.trips.find_one({"user_id": user_id, "name": new_name})
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A trip named '{new_name}' already exists."
            )

    updates = {
        "name": new_name,
        "description": payload.description,
        "planned_brewery_ids": payload.planned_brewery_ids
    }

    await db.trips.update_one({"id": id, "user_id": user_id}, {"$set": updates})

    # Cascade rename trip_name in associated check-ins
    if new_name != old_name:
        await db.checkins.update_many(
            {"user_id": user_id, "trip_name": old_name},
            {"$set": {"trip_name": new_name}}
        )

    updated = await db.trips.find_one({"id": id, "user_id": user_id}, {"_id": 0})
    return updated

@router.delete("/{id}")
async def delete_trip(id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]

    existing = await db.trips.find_one({"id": id, "user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {id} not found."
        )

    # Disassociate check-ins
    await db.checkins.update_many(
        {"user_id": user_id, "trip_name": existing["name"]},
        {"$set": {"trip_name": None}}
    )

    # Delete trip
    await db.trips.delete_one({"id": id, "user_id": user_id})

    return {"message": f"Trip '{existing['name']}' successfully deleted."}
