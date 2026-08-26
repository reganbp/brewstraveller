import { Router, Request, Response } from "express";
import { getCheckInsCollection } from "../db";
import { CANONICAL_AMENITIES, getLabelForSlug } from "../utils/amenities";

const router = Router();

// GET /amenities/suggest - Autocomplete endpoint
router.get("/suggest", async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "The 'q' query parameter is required for autocomplete search."
      });
    }

    // Run aggregation to fetch usage counts from all user check-ins
    const aggregatedCounts = await getCheckInsCollection()
      .aggregate([
        { $unwind: "$amenities_observed" },
        { $group: { _id: "$amenities_observed", count: { $sum: 1 } } }
      ])
      .toArray();

    // Map: amenity_slug -> count
    const countsMap: Record<string, number> = {};
    aggregatedCounts.forEach((item) => {
      countsMap[item._id] = item.count;
    });

    // Construct full suggestion pool from canonical list
    const allSuggestions = CANONICAL_AMENITIES.map((item) => ({
      slug: item.slug,
      label: item.label,
      usage_count: countsMap[item.slug] || 0
    }));

    // Dynamically include any additional user-defined amenities present in DB
    Object.keys(countsMap).forEach((slug) => {
      if (!allSuggestions.some((s) => s.slug === slug)) {
        allSuggestions.push({
          slug,
          label: getLabelForSlug(slug),
          usage_count: countsMap[slug]
        });
      }
    });

    // Filter by query matching slug or label
    const queryLower = q.toLowerCase();
    const suggestions = allSuggestions.filter(
      (item) =>
        item.slug.toLowerCase().includes(queryLower) ||
        item.label.toLowerCase().includes(queryLower)
    );

    // Sort by usage count descending, then alphabetically
    suggestions.sort((a, b) => b.usage_count - a.usage_count || a.label.localeCompare(b.label));

    return res.json(suggestions);
  } catch (error: any) {
    console.error("Error suggesting amenities:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred."
    });
  }
});

export default router;
