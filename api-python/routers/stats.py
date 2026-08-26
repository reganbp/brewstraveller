from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db
from models import UserStats
from routers.auth import get_current_user

router = APIRouter()

@router.get("", response_model=UserStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    db = get_db()

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$lookup": {
                "from": "breweries",
                "localField": "brewery_id",
                "foreignField": "id",
                "as": "brewery"
            }
        },
        {
            "$unwind": {
                "path": "$brewery",
                "preserveNullAndEmptyArrays": False
            }
        },
        {
            "$group": {
                "_id": None,
                "uniqueBreweries": {"$addToSet": "$brewery_id"},
                "totalMiles": {"$sum": "$distance_miles"},
                "totalTours": {"$sum": {"$cond": [{"$eq": ["$took_tour", True]}, 1, 0]}},
                "uniqueStates": {"$addToSet": "$brewery.state"}
            }
        }
    ]

    cursor = db.checkins.aggregate(pipeline)
    result = await cursor.to_list(length=1)

    if not result:
        return UserStats(
            total_breweries=0,
            total_miles=0.0,
            total_tours=0,
            states_visited_count=0,
            states_visited=[],
            state_list=[]
        )

    data = result[0]
    unique_breweries = data.get("uniqueBreweries") or []
    total_miles = data.get("totalMiles") or 0.0
    total_tours = data.get("totalTours") or 0
    unique_states = data.get("uniqueStates") or []

    # Sort state lists alphabetically
    sorted_states = sorted([str(s).upper() for s in unique_states])

    return UserStats(
        total_breweries=len(unique_breweries),
        total_miles=round(total_miles, 2),
        total_tours=total_tours,
        states_visited_count=len(sorted_states),
        states_visited=sorted_states,
        state_list=sorted_states
    )
