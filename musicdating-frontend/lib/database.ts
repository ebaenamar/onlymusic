import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB!

if (!MONGODB_URI) {
  throw new Error('Define the MONGODB_URI environmental variable')
}

if (!MONGODB_DB) {
  throw new Error('Define the MONGODB_DB environmental variable')
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  // Create indexes for scalability
  await Promise.all([
    // Users collection indexes
    db.collection('users').createIndex({ "location": "2dsphere" }),
    db.collection('users').createIndex({ "lastActive": 1 }),
    db.collection('users').createIndex({ "spotifyId": 1 }, { unique: true }),
    
    // Matches collection indexes
    db.collection('matches').createIndex({ "users": 1 }),
    db.collection('matches').createIndex({ "createdAt": 1 }),
    db.collection('matches').createIndex({ "status": 1 }),
    
    // Conversations collection indexes
    db.collection('conversations').createIndex({ "matchId": 1 }),
    db.collection('conversations').createIndex({ "lastMessageAt": 1 }),
    db.collection('conversations').createIndex({ 
      "messages.timestamp": 1,
      "messages.senderId": 1 
    }),
    
    // Listening history collection indexes
    db.collection('listeningHistory').createIndex({ 
      "userId": 1,
      "timestamp": -1 
    }),
    db.collection('listeningHistory').createIndex({ 
      "timestamp": 1 
    }, { 
      expireAfterSeconds: 30 * 24 * 60 * 60 // Auto-delete after 30 days
    })
  ])

  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Utility functions for pagination
export function createPaginationQuery(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    limit: limit
  }
}

// Utility function for geospatial queries
export function createLocationQuery(longitude: number, latitude: number, maxDistance: number) {
  return {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  }
}
