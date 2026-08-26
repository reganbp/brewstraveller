from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from database import get_db
from models import AmenitySuggestion
from utils.amenities import CANONICAL_AMENITIES, get_label_for_slug

router = APIRouter(prefix="/amenities", tags=["Amenities"])

@router.get("/suggest", response_model=List[AmenitySuggestion])
async def suggest_amenities(q: Optional[str] = None):
    if not q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'q' query parameter is required for autocomplete search."
        )

    db = get_db()

    # Aggregate occurrence counts of amenities across checkins
    pipeline = [
        {"$unwind": "$amenities_observed"},
        {"$group": {"_id": "$amenities_observed", "count": {"$sum": 1}}}
    ]

    cursor = db.checkins.aggregate(pipeline)
    aggregated_counts = await cursor.to_list(length=None)

    counts_map = {item["_id"]: item["count"] for item in aggregated_counts}

    # Construct complete suggestions list
    suggestions = []
    for item in CANONICAL_AMENITIES:
        slug = item["slug"]
        label = item["label"]
        suggestions.append({
            "slug": slug,
            "label": label,
            "usage_count": counts_map.get(slug, 0)
        })

    # Add dynamically observed user-defined amenities if they aren't in the canonical list
    for slug, count in counts_map.items():
        if not any(s["slug"] == slug for s in suggestions):
            suggestions.append({
                "slug": slug,
                "label": get_label_for_slug(slug),
                "usage_count": count
            })

    # Filter suggestions where query string matches slug or label case-insensitively
    query_lower = q.lower()
    filtered = [
        AmenitySuggestion(**s)
        for s in suggestions
        if query_lower in s["slug"].lower() or query_lower in s["label"].lower()
    ]

    # Sort by usage count descending, then alphabetically by label
    filtered.sort(key=lambda s: (-s.usage_count, s.label))

    return filtered
