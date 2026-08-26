import { Router, Request, Response } from "express";
import { getCheckInsCollection } from "../db";

const router = Router();

// GET /stats - Get user check-in statistics
router.get("/", async (req: Request, res: Response) => {
  try {
    const user_id = req.query.user_id as string | undefined;

    if (!user_id || typeof user_id !== "string") {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "The 'user_id' query parameter is required."
      });
    }

    const pipeline = [
      { $match: { user_id } },
      {
        $lookup: {
          from: "breweries",
          localField: "brewery_id",
          foreignField: "id",
          as: "brewery"
        }
      },
      {
        $unwind: {
          path: "$brewery",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: null,
          uniqueBreweries: { $addToSet: "$brewery_id" },
          totalMiles: { $sum: "$distance_miles" },
          totalTours: { $sum: { $cond: [{ $eq: ["$took_tour", true] }, 1, 0] } },
          uniqueStates: { $addToSet: "$brewery.state" }
        }
      }
    ];

    const result = await getCheckInsCollection().aggregate(pipeline).toArray();

    if (result.length === 0) {
      return res.json({
        total_breweries: 0,
        total_miles: 0,
        total_tours: 0,
        states_visited_count: 0,
        states_visited: [],
        state_list: []
      });
    }

    const { uniqueBreweries, totalMiles, totalTours, uniqueStates } = result[0];

    // Sort states alphabetically for consistent clean response
    const sortedStates = (uniqueStates || []).map((s: string) => s.toUpperCase()).sort();

    return res.json({
      total_breweries: uniqueBreweries ? uniqueBreweries.length : 0,
      total_miles: totalMiles ? parseFloat(totalMiles.toFixed(2)) : 0,
      total_tours: totalTours || 0,
      states_visited_count: sortedStates.length,
      states_visited: sortedStates,
      state_list: sortedStates
    });
  } catch (error: any) {
    console.error("Error calculating user statistics:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

export default router;
