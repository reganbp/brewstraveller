import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/brewstraveller")
db_name = MONGO_URI.split("/")[-1].split("?")[0] or "brewstraveller"

client: AsyncIOMotorClient = None
db = None

def get_db():
    global client, db
    if db is None:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[db_name]
    return db

def close_db():
    global client, db
    if client is not None:
        client.close()
        client = None
        db = None

async def init_indexes():
    database = get_db()
    
    # Create indexes for performance and uniqueness constraints
    await database.breweries.create_index("id", unique=True)
    await database.breweries.create_index("google_place_id", unique=True)
    # Compound text index on name and city
    await database.breweries.create_index([("name", "text"), ("city", "text")])
    
    await database.checkins.create_index("id", unique=True)
    await database.checkins.create_index("user_id")
    await database.checkins.create_index("brewery_id")
    await database.checkins.create_index([("visited_at", -1)])
