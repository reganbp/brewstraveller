from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]

class Brewery(BaseModel):
    id: Optional[str] = None
    google_place_id: str
    name: str
    city: str
    state: str
    location: GeoJSONPoint
    website: Optional[str] = None
    created_at: Optional[Union[datetime, str]] = None

class BreweryCreate(BaseModel):
    google_place_id: str
    name: str
    city: str
    state: str
    location: GeoJSONPoint
    website: Optional[str] = None

class UserReportedAmenity(BaseModel):
    slug: str
    label: str
    count: int

class BreweryDetailResponse(Brewery):
    users_reported_amenities: List[UserReportedAmenity] = []

class CheckIn(BaseModel):
    id: Optional[str] = None
    user_id: str
    brewery_id: str
    visited_at: Union[datetime, str]
    rating: float
    took_tour: bool
    notes: Optional[str] = None
    distance_miles: float
    transportation_mode: str
    trip_name: Optional[str] = None
    amenities_observed: List[str] = []

class CheckInCreate(BaseModel):
    user_id: str
    brewery_id: str
    visited_at: Union[datetime, str]
    rating: float
    took_tour: bool
    notes: Optional[str] = None
    distance_miles: float
    transportation_mode: str
    trip_name: Optional[str] = None
    amenities_observed: List[str] = []

class AmenitySuggestion(BaseModel):
    slug: str
    label: str
    usage_count: int

class UserStats(BaseModel):
    total_breweries: int
    total_miles: float
    total_tours: int
    states_visited_count: int
    states_visited: List[str]
