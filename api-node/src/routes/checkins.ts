import { Router, Request, Response } from "express";
import { getCheckInsCollection, getBreweriesCollection } from "../db";
import { randomUUID } from "crypto";

const router = Router();

// GET /checkins - Get user check-in history sorted by visited_at descending
router.get("/", async (req: Request, res: Response) => {
  try {
    const user_id = req.query.user_id as string | undefined;
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

    const filter: any = {};
    if (user_id) {
      filter.user_id = user_id;
    }
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

// POST /checkins - Log a new check-in
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      user_id,
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

    // Body Validation
    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "user_id is required." });
    }
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

    const newCheckIn = {
      id: randomUUID(),
      user_id,
      brewery_id,
      visited_at: new Date(visited_at).toISOString(),
      rating,
      took_tour,
      notes,
      distance_miles,
      transportation_mode,
      trip_name: trip_name || null,
      amenities_observed
    };

    await getCheckInsCollection().insertOne(newCheckIn);

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

export default router;
