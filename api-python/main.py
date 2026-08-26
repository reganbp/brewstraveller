import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Database singleton
from database import get_db, close_db, init_indexes

# Router imports
from routers import health, breweries, checkins, stats, amenities

load_dotenv()

cors_origin = os.getenv("CORS_ORIGIN", "*")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup connection and create indexes on startup
    try:
        get_db()
        await init_indexes()
        print("Connected to MongoDB and initialized indexes successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB/initialize indexes: {e}")
    yield
    # Clean up client on shutdown
    close_db()
    print("Database connections closed.")

app = FastAPI(
    title="BrewsTraveller API",
    version="1.0.0",
    description="Python FastAPI backend implementation for BrewsTraveller tracking portfolio",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(breweries.router, prefix="/breweries", tags=["Breweries"])
app.include_router(checkins.router, prefix="/checkins", tags=["Check-Ins"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])
app.include_router(amenities.router, prefix="/amenities", tags=["Amenities"])

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
