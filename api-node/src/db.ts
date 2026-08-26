import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brewstraveller';
export const client = new MongoClient(MONGO_URI);

let dbInstance: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (!dbInstance) {
    await client.connect();
    dbInstance = client.db();

    // Safe index creation
    await dbInstance.collection('breweries').createIndex({ google_place_id: 1 }, { unique: true });
    await dbInstance.collection('breweries').createIndex({ location: '2dsphere' });
    await dbInstance.collection('checkins').createIndex({ user_id: 1, visited_at: -1 });

    console.log('Connected to MongoDB Atlas');
  }
  return dbInstance;
}

export function getDb(): Db {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDb first.');
  }
  return dbInstance;
}

export function getBreweriesCollection(): Collection {
  return getDb().collection('breweries');
}

export function getCheckinsCollection(): Collection {
  return getDb().collection('checkins');
}

// Aliases for casing compatibility across route handlers
export const getCheckInsCollection = getCheckinsCollection;
export const getBreweryCollection = getBreweriesCollection;
