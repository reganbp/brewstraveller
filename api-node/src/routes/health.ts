import { Router, Request, Response } from "express";

const router = Router();

// GET /health
router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    runtime: "Node.js (Express/TypeScript)",
    server_time: new Date().toISOString()
  });
});

export default router;
