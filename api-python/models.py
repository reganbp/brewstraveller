from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Tuple

class GeoJSONPoint(BaseModel):
  type: Literal["Point"] = "Point"
  coordinates: Tuple[float, float]  # [longitude, latitude]

class Brewery(BaseModel):
  id: str
  google_place_id: str
  name: str
  city: str
  state: str
  location: GeoJSONPoint
  website: str
  created_at: str

class BreweryCreate(BaseModel):
  google_place_id: str
  name: str
  city: str
  state: str = Field(..., min_length=2, max_length=2)
  location: GeoJSONPoint
  website: str

class UserReportedAmenity(BaseModel):
  slug: str
  label: str
  count: int

class BreweryDetailResponse(Brewery):
  amenities: List[UserReportedAmenity]

class CheckIn(BaseModel):
  id: str
  user_id: str
  brewery_id: str
  visited_at: str
  rating: float = Field(..., ge=1.0, le=5.0)
  took_tour: bool
  notes: str
  distance_miles: float = Field(..., ge=0.0)
  transportation_mode: Literal["drive", "flight", "walk", "transit"]
  trip_name: Optional[str] = None
  amenities_observed: List[str]

class CheckInCreate(BaseModel):
  user_id: str
  brewery_id: str
  visited_at: str
  rating: float = Field(..., ge=1.0, le=5.0)
  took_tour: bool
  notes: str
  distance_miles: float = Field(..., ge=0.0)
  transportation_mode: Literal["drive", "flight", "walk", "transit"]
  trip_name: Optional[str] = None
  amenities_observed: List[str]

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
  state_list: List[str]

class Error(BaseModel):
  code: str
  message: str
