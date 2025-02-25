import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { getSpotifyApi } from '../../../lib/spotify'
import clientPromise from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const spotify = await getSpotifyApi(session)
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    // Get user's current track
    const playing = await spotify.getMyCurrentPlayingTrack()
    
    if (playing.body && playing.body.item && 'artists' in playing.body.item && 'album' in playing.body.item) {
      const track = playing.body.item
      
      // Update user's current track in DB
      await db.collection('musicMoments').updateOne(
        { userId: session.user.id },
        {
          $set: {
            trackId: track.id,
            trackName: track.name,
            artistName: track.artists[0].name,
            albumArt: track.album.images[0].url,
            timestamp: new Date()
          }
        },
        { upsert: true }
      )
    }

    // Get other users' current tracks (last 15 minutes)
    const recentMoments = await db.collection('musicMoments')
      .aggregate([
        {
          $match: {
            timestamp: {
              $gte: new Date(Date.now() - 15 * 60 * 1000)
            },
            userId: {
              $ne: session.user.id
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $sort: {
            timestamp: -1
          }
        },
        {
          $limit: 20
        }
      ])
      .toArray()

    // Format response
    const moments = recentMoments.map(moment => ({
      id: moment._id.toString(),
      userId: moment.userId,
      userName: moment.userInfo.name,
      userPhoto: moment.userInfo.image,
      track: {
        id: moment.trackId,
        name: moment.trackName,
        artist: moment.artistName,
        albumArt: moment.albumArt
      },
      timestamp: moment.timestamp,
      listeners: 1 // TODO: Count users listening to same track
    }))

    return res.status(200).json(moments)
  } catch (error) {
    console.error('Error fetching music moments:', error)
    return res.status(500).json({ error: 'Failed to fetch music moments' })
  }
}
