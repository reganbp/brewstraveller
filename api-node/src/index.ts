import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./db";

// Import Routes
import healthRouter from "./routes/health";
import breweriesRouter from "./routes/breweries";
import checkinsRouter from "./routes/checkins";
import statsRouter from "./routes/stats";
import amenitiesRouter from "./routes/amenities";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "*";

// Middleware
app.use(express.json());
app.use(cors({ origin: corsOrigin }));

// Route Mounts
app.use("/health", healthRouter);
app.use("/breweries", breweriesRouter);
app.use("/checkins", checkinsRouter);
app.use("/stats", statsRouter);
app.use("/amenities", amenitiesRouter);

// 404 Error Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: `Cannot ${req.method} ${req.originalUrl}. Endpoint not found.`
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Application Error:", err);
  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected internal server error occurred."
  });
});

// Initialize database and start listening
async function bootstrap() {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`BrewsTraveller Node.js API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start Node.js API server:", error);
    process.exit(1);
  }
}

bootstrap();
