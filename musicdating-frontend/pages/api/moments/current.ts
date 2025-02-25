import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { getSpotifyApi } from '../../../lib/spotify'
import { prisma } from '../../../lib/prisma'

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
    
    // Get user's current track
    const playing = await spotify.getMyCurrentPlayingTrack()
    
    if (playing.body && playing.body.item) {
      // Update user's current track in DB
      await prisma.musicMoment.upsert({
        where: {
          userId: session.user.id
        },
        update: {
          trackId: playing.body.item.id,
          trackName: playing.body.item.name,
          artistName: playing.body.item.artists[0].name,
          albumArt: playing.body.item.album.images[0].url,
          timestamp: new Date()
        },
        create: {
          userId: session.user.id,
          trackId: playing.body.item.id,
          trackName: playing.body.item.name,
          artistName: playing.body.item.artists[0].name,
          albumArt: playing.body.item.album.images[0].url,
          timestamp: new Date()
        }
      })
    }

    // Get other users' current tracks (last 15 minutes)
    const recentMoments = await prisma.musicMoment.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000)
        },
        userId: {
          not: session.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    })

    // Format response
    const moments = recentMoments.map(moment => ({
      id: moment.id,
      userId: moment.userId,
      userName: moment.user.name,
      userPhoto: moment.user.image,
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
