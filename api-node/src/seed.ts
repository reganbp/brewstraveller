import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brewstraveller';

const brewId1 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7f1');
const brewId2 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7f2');
const brewId3 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7f3');
const brewId4 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7f4');

const checkId1 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7a1');
const checkId2 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7a2');
const checkId3 = new ObjectId('65d0a1b2e1f2a3b4c5d6e7a3');

const sampleBreweries = [
  {
    _id: brewId1,
    id: brewId1.toString(),
    google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    name: 'Tree House Brewing Company',
    city: 'Charlton',
    state: 'MA',
    location: { type: 'Point', coordinates: [-72.033, 42.137] },
    website: 'https://treehousebrew.com',
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    _id: brewId2,
    id: brewId2.toString(),
    google_place_id: 'ChIJ123_abcEmsRUsoyG83frY5',
    name: 'Trillium Brewing Company',
    city: 'Canton',
    state: 'MA',
    location: { type: 'Point', coordinates: [-71.144, 42.193] },
    website: 'https://trilliumbrewing.com',
    created_at: '2026-02-01T00:00:00Z'
  },
  {
    _id: brewId3,
    id: brewId3.toString(),
    google_place_id: 'ChIJ456_defEmsRUsoyG83frY6',
    name: 'Bissell Brothers Brewing',
    city: 'Portland',
    state: 'ME',
    location: { type: 'Point', coordinates: [-70.288, 43.651] },
    website: 'https://bissellbrothers.com',
    created_at: '2026-02-10T00:00:00Z'
  },
  {
    _id: brewId4,
    id: brewId4.toString(),
    google_place_id: 'ChIJs7XpY3Z644kRPlB03fS-I1Y',
    name: 'Samuel Adams Boston Brewery',
    city: 'Boston',
    state: 'MA',
    location: { type: 'Point', coordinates: [-71.1015, 42.3144] },
    website: 'https://samadamsbostonbrewery.com',
    created_at: '2026-02-15T00:00:00Z'
  }
];

const sampleCheckIns = [
  {
    _id: checkId1,
    id: checkId1.toString(),
    user_id: 'dev_user_1',
    brewery_id: brewId1.toString(),
    visited_at: '2026-06-12T15:00:00Z',
    rating: 5.0,
    took_tour: true,
    notes: 'Took the facility tour! Massively impressive operation and beautiful pavilion.',
    distance_miles: 54.2,
    transportation_mode: 'drive',
    trip_name: 'Summer Central MA Tour',
    amenities_observed: ['dog_friendly', 'outdoor_patio', 'food_truck', 'scenic_views']
  },
  {
    _id: checkId2,
    id: checkId2.toString(),
    user_id: 'dev_user_1',
    brewery_id: brewId2.toString(),
    visited_at: '2026-07-04T13:30:00Z',
    rating: 4.5,
    took_tour: false,
    notes: 'Great outdoor seating area and solid IPAs.',
    distance_miles: 18.5,
    transportation_mode: 'drive',
    trip_name: 'Holiday Hop',
    amenities_observed: ['outdoor_patio', 'food_truck', 'kid_friendly']
  },
  {
    _id: checkId3,
    id: checkId3.toString(),
    user_id: 'dev_user_1',
    brewery_id: brewId3.toString(),
    visited_at: '2026-08-01T16:20:00Z',
    rating: 4.8,
    took_tour: true,
    notes: 'Portland trip highlight. Excellent food menu as well.',
    distance_miles: 112.0,
    transportation_mode: 'drive',
    trip_name: 'Maine Weekend Getaway',
    amenities_observed: ['live_music', 'outdoor_patio', 'food_truck']
  }
];

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    try { await db.collection('breweries').drop(); } catch (e) {}
    try { await db.collection('checkins').drop(); } catch (e) {}

    await db.collection('breweries').insertMany(sampleBreweries);
    await db.collection('checkins').insertMany(sampleCheckIns);

    console.log('✅ Database successfully re-seeded!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.close();
  }
}

seed();
