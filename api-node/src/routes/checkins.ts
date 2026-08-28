import { Router, Response } from "express";
import { getCheckInsCollection, getBreweriesCollection, getUsersCollection } from "../db";
import { randomUUID } from "crypto";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Haversine Distance helper (coords: [longitude, latitude])
function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Sequential distance calculator within a trip (uses home_coordinates for first stop if present)
export async function recalculateTripDistances(userId: string, tripName: string | null): Promise<void> {
  if (!tripName || !tripName.trim()) return;

  const checkinsCol = getCheckInsCollection();
  const breweriesCol = getBreweriesCollection();
  const usersCol = getUsersCollection();

  // Fetch and sort chronologically (visited_at ascending)
  const checkins = await checkinsCol
    .find({ user_id: userId, trip_name: tripName.trim() })
    .sort({ visited_at: 1 })
    .toArray();

  if (checkins.length === 0) return;

  // Resolve coordinate map
  const breweryIds = checkins.map((c) => c.brewery_id);
  const breweries = await breweriesCol.find({ id: { $in: breweryIds } }).toArray();
  const breweriesMap = new Map<string, [number, number]>();
  breweries.forEach((b) => {
    if (b.location && b.location.coordinates) {
      breweriesMap.set(b.id, b.location.coordinates);
    }
  });

  // Resolve user home coordinates for the first stop fallback
  const user = await usersCol.findOne({ id: userId });
  const homeCoords = user?.home_coordinates;

  // Calculate distances
  for (let i = 0; i < checkins.length; i++) {
    const current = checkins[i];
    let distance = 0;

    if (i > 0) {
      const prev = checkins[i - 1];
      const coords1 = breweriesMap.get(prev.brewery_id);
      const coords2 = breweriesMap.get(current.brewery_id);

      if (coords1 && coords2) {
        distance = haversineDistance(coords1, coords2);
      }
    } else if (homeCoords) {
      // First stop: calculate distance from user's home location coordinates!
      const currentCoords = breweriesMap.get(current.brewery_id);
      if (currentCoords) {
        distance = haversineDistance(homeCoords as [number, number], currentCoords);
      }
    }

    const roundedDistance = parseFloat(distance.toFixed(2));
    await checkinsCol.updateOne(
      { id: current.id },
      { $set: { distance_miles: roundedDistance } }
    );
  }
}

// GET /checkins - Get user check-in history sorted by visited_at descending (Authenticated and scoped to user)
router.get("/", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const trip_name = req.query.trip_name as string | undefined;
    const limitParam = req.query.limit as string | undefined;

    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (isNaN(parsed) || parsed < 1) {
        return res.status(400).json({
          code: "BAD_REQUEST",
          message: "The 'limit' parameter must be a positive integer."
        });
      }
      limit = parsed;
    }

    const filter: any = { user_id };
    if (trip_name) {
      filter.trip_name = { $regex: trip_name, $options: "i" };
    }

    const checkins = await getCheckInsCollection()
      .find(filter, { projection: { _id: 0 } })
      .sort({ visited_at: -1 })
      .limit(limit)
      .toArray();

    return res.json(checkins);
  } catch (error: any) {
    console.error("Error fetching checkins:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

// POST /checkins - Log a new check-in (Authenticated and set to user_id)
router.post("/", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      brewery_id,
      visited_at,
      rating,
      took_tour,
      notes,
      distance_miles,
      transportation_mode,
      trip_name,
      amenities_observed
    } = req.body;

    const user_id = req.user!.id;

    // Body Validation
    if (!brewery_id || typeof brewery_id !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "brewery_id is required." });
    }
    if (!visited_at || isNaN(Date.parse(visited_at))) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "visited_at must be a valid ISO datetime string." });
    }
    if (rating === undefined || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "rating must be a number between 1 and 5." });
    }
    if (took_tour === undefined || typeof took_tour !== "boolean") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "took_tour must be a boolean." });
    }
    if (notes === undefined || typeof notes !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "notes must be a string." });
    }
    if (distance_miles === undefined || typeof distance_miles !== "number" || distance_miles < 0) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "distance_miles must be a positive number." });
    }
    
    const validModes = ["drive", "flight", "walk", "transit"];
    if (!transportation_mode || !validModes.includes(transportation_mode)) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: `transportation_mode must be one of: ${validModes.join(", ")}`
      });
    }

    if (trip_name !== undefined && trip_name !== null && typeof trip_name !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "trip_name must be a string or null." });
    }

    if (!Array.isArray(amenities_observed) || !amenities_observed.every(item => typeof item === "string")) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "amenities_observed must be an array of strings." });
    }

    // Verify the brewery exists
    const brewery = await getBreweriesCollection().findOne({ id: brewery_id });
    if (!brewery) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: `Brewery with ID ${brewery_id} not found.`
      });
    }

    const cleanTripName = trip_name ? trip_name.trim() : null;

    let initialDistance = 0;
    if (!cleanTripName) {
      const user = await getUsersCollection().findOne({ id: user_id });
      if (user && user.home_coordinates && brewery && brewery.location && brewery.location.coordinates) {
        initialDistance = haversineDistance(user.home_coordinates as [number, number], brewery.location.coordinates as [number, number]);
      }
    }

    const newCheckIn = {
      id: randomUUID(),
      user_id,
      brewery_id,
      visited_at: new Date(visited_at).toISOString(),
      rating,
      took_tour,
      notes,
      distance_miles: parseFloat(initialDistance.toFixed(2)),
      transportation_mode,
      trip_name: cleanTripName,
      amenities_observed
    };

    const checkinsCol = getCheckInsCollection();
    await checkinsCol.insertOne(newCheckIn);

    // Recalculate trip distances if part of a trip
    if (cleanTripName) {
      await recalculateTripDistances(user_id, cleanTripName);
    }

    const { _id, ...responseBody } = newCheckIn as any;
    return res.status(201).json(responseBody);
  } catch (error: any) {
    console.error("Error creating checkin:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

// PUT /checkins/:id - Update trip_name or visited_at on an existing check-in (Authenticated & Scoped)
router.put("/:id", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user!.id;
    const { trip_name, visited_at } = req.body;

    const checkinsCol = getCheckInsCollection();
    const existing = await checkinsCol.findOne({ id, user_id });

    if (!existing) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: `Check-in record with ID ${id} not found for this user.`
      });
    }

    const oldTripName = existing.trip_name;
    const newTripName = trip_name !== undefined ? (trip_name ? trip_name.trim() : null) : oldTripName;
    const newVisitedAt = visited_at ? new Date(visited_at).toISOString() : existing.visited_at;

    await checkinsCol.updateOne(
      { id, user_id },
      { $set: { trip_name: newTripName, visited_at: newVisitedAt } }
    );

    // Recalculate routing distance layers
    if (oldTripName) {
      await recalculateTripDistances(user_id, oldTripName);
    }
    if (newTripName && newTripName !== oldTripName) {
      await recalculateTripDistances(user_id, newTripName);
    }

    const updated = await checkinsCol.findOne({ id, user_id }, { projection: { _id: 0 } });
    return res.json(updated);
  } catch (error: any) {
    console.error("Error updating check-in:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

// PATCH /checkins/assign-trip - Batch update to group/ungroup check-ins in a single request (Authenticated)
router.patch("/assign-trip", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { checkin_ids, trip_name } = req.body;

    if (!Array.isArray(checkin_ids) || checkin_ids.some(item => typeof item !== "string")) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "checkin_ids must be an array of string UUIDs."
      });
    }

    const cleanTripName = trip_name ? trip_name.trim() : null;
    const checkinsCol = getCheckInsCollection();

    // Fetch affected check-ins to capture their pre-existing trip names
    const affected = await checkinsCol
      .find({ id: { $in: checkin_ids }, user_id })
      .toArray();

    const oldTrips = Array.from(new Set(affected.map((c) => c.trip_name).filter(Boolean)));

    // Batch update
    await checkinsCol.updateMany(
      { id: { $in: checkin_ids }, user_id },
      { $set: { trip_name: cleanTripName } }
    );

    // Trigger sequential Haversine updates
    if (cleanTripName) {
      await recalculateTripDistances(user_id, cleanTripName);
    }
    for (const oldTrip of oldTrips) {
      if (oldTrip !== cleanTripName) {
        await recalculateTripDistances(user_id, oldTrip);
      }
    }

    return res.json({
      message: "Check-ins retroactively assigned and Haversine distances synchronized successfully."
    });
  } catch (error: any) {
    console.error("Error in batch check-in assignment:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

export default router;
