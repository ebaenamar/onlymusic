import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'
import { getSession } from 'next-auth/react'

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

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(MONGODB_DB)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const { db } = await connectToDatabase()
    const userId = new ObjectId(req.query.userId as string)
    
    // Get user's profile
    const user = await db.collection('users').findOne({ _id: userId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find potential matches
    const matches = await db.collection('users')
      .find({
        _id: { $ne: userId },
        // Add any additional filtering criteria
      })
      .limit(20)
      .toArray()

    // Calculate match scores
    const scoredMatches = matches.map(match => ({
      ...match,
      score: calculateMatchScore(user, match),
    }))

    // Sort by score and return
    const sortedMatches = scoredMatches
      .sort((a, b) => b.score - a.score)
      .map(match => ({
        id: match._id,
        playlistId: match.playlistId,
        photoUrl: match.photoUrl,
        score: match.score,
      }))

    res.status(200).json(sortedMatches)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

function calculateMatchScore(user1: any, user2: any) {
  // Implement your matching algorithm here
  // This is a simplified version
  const musicScore = calculateMusicCompatibility(user1.musicFeatures, user2.musicFeatures)
  const photoScore = calculatePhotoCompatibility(user1.photoFeatures, user2.photoFeatures)
  
  return 0.6 * photoScore + 0.4 * musicScore
}
