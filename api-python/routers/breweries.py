import uuid
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from database import get_db
from models import Brewery, BreweryCreate, BreweryDetailResponse, UserReportedAmenity
from utils.amenities import get_label_for_slug

router = APIRouter(prefix="/breweries", tags=["Breweries"])

@router.get("", response_model=List[Brewery])
async def get_breweries(
    q: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = Query(20, ge=1)
):
    db = get_db()
    filter_query = {}

    if q:
        filter_query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}}
        ]

    if state:
        if len(state) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The 'state' parameter must be a 2-letter code."
            )
        filter_query["state"] = {"$regex": f"^{state}$", "$options": "i"}

    cursor = db.breweries.find(filter_query, {"_id": 0}).limit(limit)
    breweries = await cursor.to_list(length=limit)
    return breweries

@router.get("/{id}", response_model=BreweryDetailResponse)
async def get_brewery(id: str):
    # Validate UUID format
    uuid_regex = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    if not re.match(uuid_regex, id, re.IGNORECASE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid brewery ID format. Must be a valid UUID."
        )

    db = get_db()
    brewery = await db.breweries.find_one({"id": id}, {"_id": 0})
    if not brewery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brewery with ID {id} not found."
        )

    # Run aggregation on checkins collection to group and count amenities
    pipeline = [
        {"$match": {"brewery_id": id}},
        {"$unwind": "$amenities_observed"},
        {"$group": {"_id": "$amenities_observed", "count": {"$sum": 1}}},
        {"$sort": {"count": -1, "_id": 1}}
    ]

    cursor = db.checkins.aggregate(pipeline)
    amenities_count = await cursor.to_list(length=None)

    amenities = [
        UserReportedAmenity(
            slug=item["_id"],
            label=get_label_for_slug(item["_id"]),
            count=item["count"]
        )
        for item in amenities_count
    ]

    return BreweryDetailResponse(**brewery, amenities=amenities)

@router.post("")
async def create_or_update_brewery(payload: BreweryCreate):
    db = get_db()
    
    # Clean state to uppercase
    payload.state = payload.state.upper()

    existing = await db.breweries.find_one({"google_place_id": payload.google_place_id}, {"_id": 0})

    if existing:
        # Update
        updated_fields = payload.dict()
        await db.breweries.update_one(
            {"google_place_id": payload.google_place_id},
            {"$set": updated_fields}
        )
        updated = await db.breweries.find_one({"google_place_id": payload.google_place_id}, {"_id": 0})
        return JSONResponse(status_code=status.HTTP_200_OK, content=updated)
    else:
        # Create
        new_brewery = payload.dict()
        new_brewery["id"] = str(uuid.uuid4())
        new_brewery["created_at"] = datetime.utcnow().isoformat() + "Z"
        
        await db.breweries.insert_one(new_brewery)
        
        # Remove MongoDB _id before returning
        new_brewery.pop("_id", None)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content=new_brewery)
