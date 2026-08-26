import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/brewstraveller";
const dbName = mongoUri.split("/").pop()?.split("?")[0] || "brewstraveller";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;

  console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^@]+)@/, ":****@")}`);
  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(dbName);
  
  // Create indexes for optimal querying and constraint enforcement
  await db.collection("breweries").createIndex({ id: 1 }, { unique: true });
  await db.collection("breweries").createIndex({ google_place_id: 1 }, { unique: true });
  await db.collection("breweries").createIndex({ name: "text", city: "text" });
  
  await db.collection("checkins").createIndex({ id: 1 }, { unique: true });
  await db.collection("checkins").createIndex({ user_id: 1 });
  await db.collection("checkins").createIndex({ brewery_id: 1 });
  await db.collection("checkins").createIndex({ visited_at: -1 });

  console.log("Connected successfully to MongoDB");
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDb() first.");
  }
  return db;
}

export function getBreweriesCollection() {
  return getDb().collection("breweries");
}

export function getCheckInsCollection() {
  return getDb().collection("checkins");
}
