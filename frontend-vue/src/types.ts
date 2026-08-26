export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserReportedAmenity {
  slug: string;
  label: string;
  count: number;
}

export interface Brewery {
  id: string;
  google_place_id: string;
  name: string;
  city: string;
  state: string;
  location: GeoJSONPoint;
  website: string;
  created_at: string;
  amenities?: UserReportedAmenity[];
}

export interface CheckIn {
  id: string;
  user_id: string;
  brewery_id: string;
  visited_at: string;
  rating: number;
  took_tour: boolean;
  notes: string;
  distance_miles: number;
  transportation_mode: "drive" | "flight" | "walk" | "transit";
  trip_name: string | null;
  amenities_observed: string[];
}

export interface UserStats {
  total_breweries: number;
  total_miles: number;
  total_tours: number;
  states_visited_count: number;
  states_visited: string[];
  state_list: string[];
}

export interface AmenitySuggestion {
  slug: string;
  label: string;
  usage_count: number;
}
