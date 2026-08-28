import { Router, Request, Response } from "express";
import { getBreweriesCollection, getCheckInsCollection } from "../db";
import { getLabelForSlug } from "../utils/amenities";
import { randomUUID } from "crypto";

const router = Router();

// GET /breweries - List/search cached breweries
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const state = req.query.state as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    
    let limit = 20;
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
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } }
      ];
    }
    
    if (state) {
      if (state.length !== 2) {
        return res.status(400).json({
          code: "BAD_REQUEST",
          message: "The 'state' parameter must be a 2-letter code."
        });
      }
      filter.state = { $regex: `^${state}$`, $options: "i" };
    }

    const breweries = await getBreweriesCollection()
      .find(filter, { projection: { _id: 0 } })
      .limit(limit)
      .toArray();

    return res.json(breweries);
  } catch (error: any) {
    console.error("Error fetching breweries:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

// GET /breweries/{id} - Get detailed brewery info
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: `Brewery with ID ${id} not found.`
      });
    }

    const brewery = await getBreweriesCollection().findOne({ id }, { projection: { _id: 0 } });
    if (!brewery) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: `Brewery with ID ${id} not found.`
      });
    }

    // Run aggregation on checkins collection to group and count user-reported amenities
    const amenitiesCount = await getCheckInsCollection()
      .aggregate([
        { $match: { brewery_id: id } },
        { $unwind: "$amenities_observed" },
        { $group: { _id: "$amenities_observed", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ])
      .toArray();

    const amenities = amenitiesCount.map((item) => ({
      slug: item._id,
      label: getLabelForSlug(item._id),
      count: item.count
    }));

    return res.json({
      ...brewery,
      amenities
    });
  } catch (error: any) {
    console.error("Error fetching brewery detail:", error);
    return res.status(404).json({
      code: "NOT_FOUND",
      message: `Brewery with ID ${req.params.id} not found.`
    });
  }
});

// POST /breweries - Create or update a brewery
router.post("/", async (req: Request, res: Response) => {
  try {
    const { google_place_id, name, city, state, location, website } = req.body;

    // Body Validation
    if (!google_place_id || typeof google_place_id !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "google_place_id is required." });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "name is required." });
    }
    if (!city || typeof city !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "city is required." });
    }
    if (!state || typeof state !== "string" || state.length !== 2) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "state is required and must be a 2-letter abbreviation." });
    }
    if (website !== undefined && website !== null && typeof website !== "string") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "website must be a string." });
    }

    // GeoJSON validation
    if (!location || typeof location !== "object") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "location object is required." });
    }
    if (location.type !== "Point") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "location.type must be 'Point'." });
    }
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== "number" || typeof location.coordinates[1] !== "number") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "location.coordinates must be an array of [longitude, latitude] numbers." });
    }

    const breweriesCol = getBreweriesCollection();

    // Try to find if brewery with this google_place_id already exists
    const existing = await breweriesCol.findOne({ google_place_id });

    const cleanWebsite = website ? website.trim() : "";

    if (existing) {
      // Update
      const updatedFields = {
        name,
        city,
        state: state.toUpperCase(),
        location,
        website: cleanWebsite
      };

      await breweriesCol.updateOne(
        { google_place_id },
        { $set: updatedFields }
      );

      const updated = await breweriesCol.findOne({ google_place_id }, { projection: { _id: 0 } });
      return res.status(200).json(updated);
    } else {
      // Create
      const newBrewery = {
        id: randomUUID(),
        google_place_id,
        name,
        city,
        state: state.toUpperCase(),
        location,
        website: cleanWebsite,
        created_at: new Date().toISOString()
      };

      await breweriesCol.insertOne(newBrewery);

      // Return copy without internal MongoDB _id
      const { _id, ...responseBody } = newBrewery as any;
      return res.status(201).json(responseBody);
    }
  } catch (error: any) {
    console.error("Error creating/updating brewery:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

export default router;
