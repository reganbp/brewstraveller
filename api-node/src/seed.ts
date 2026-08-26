import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brewstraveller';

const sampleBreweries = [
  {
    _id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f1'),
    google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    name: 'Tree House Brewing Company',
    city: 'Charlton',
    state: 'MA',
    location: { type: 'Point', coordinates: [-72.033, 42.137] },
    website: 'https://treehousebrew.com',
    created_at: new Date('2026-01-15T00:00:00Z')
  },
  {
    _id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f2'),
    google_place_id: 'ChIJ123_abcEmsRUsoyG83frY5',
    name: 'Trillium Brewing Company',
    city: 'Canton',
    state: 'MA',
    location: { type: 'Point', coordinates: [-71.144, 42.193] },
    website: 'https://trilliumbrewing.com',
    created_at: new Date('2026-02-01T00:00:00Z')
  },
  {
    _id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f3'),
    google_place_id: 'ChIJ456_defEmsRUsoyG83frY6',
    name: 'Bissell Brothers Brewing',
    city: 'Portland',
    state: 'ME',
    location: { type: 'Point', coordinates: [-70.288, 43.651] },
    website: 'https://bissellbrothers.com',
    created_at: new Date('2026-02-10T00:00:00Z')
  }
];

const sampleCheckIns = [
  {
    user_id: 'dev_user_1',
    brewery_id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f1'),
    visited_at: new Date('2026-06-12T15:00:00Z'),
    rating: 5.0,
    took_tour: true,
    notes: 'Took the facility tour! Massively impressive operation and beautiful pavilion.',
    distance_miles: 54.2,
    transportation_mode: 'drive',
    trip_name: 'Summer Central MA Tour',
    amenities_observed: ['dog_friendly', 'outdoor_patio', 'food_truck', 'scenic_views']
  },
  {
    user_id: 'dev_user_1',
    brewery_id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f2'),
    visited_at: new Date('2026-07-04T13:30:00Z'),
    rating: 4.5,
    took_tour: false,
    notes: 'Great outdoor seating area and solid IPAs.',
    distance_miles: 18.5,
    transportation_mode: 'drive',
    trip_name: 'Holiday Hop',
    amenities_observed: ['outdoor_patio', 'food_truck', 'kid_friendly']
  },
  {
    user_id: 'dev_user_1',
    brewery_id: new ObjectId('65d0a1b2e1f2a3b4c5d6e7f3'),
    visited_at: new Date('2026-08-01T16:20:00Z'),
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

    await db.collection('breweries').deleteMany({});
    await db.collection('checkins').deleteMany({});

    await db.collection('breweries').insertMany(sampleBreweries);
    await db.collection('checkins').insertMany(sampleCheckIns);

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.close();
  }
}

seed();
