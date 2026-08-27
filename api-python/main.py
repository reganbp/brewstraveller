from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from routers import health, breweries, checkins, stats, amenities, auth, trips

load_dotenv()

app = FastAPI(
    title="BrewsTraveller API (Python)",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/docs/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(breweries.router)
app.include_router(checkins.router)
app.include_router(trips.router)
app.include_router(stats.router)
app.include_router(amenities.router)
