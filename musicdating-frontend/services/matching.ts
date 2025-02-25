import { getSpotifyApi } from '../lib/spotify'
import { getSession } from 'next-auth/react'

interface Track {
  id: string
  name: string
  albumArt: string
}

interface Match {
  id: string
  name: string
  recentTracks: Track[]
  matchScore: number
}

export class MatchingService {
  async getPotentialMatches(): Promise<Match[]> {
    try {
      // Get the current session
      const session = await getSession()
      
      if (!session) {
        throw new Error('User not authenticated')
      }
      
      // Call the match API endpoint
      const response = await fetch('/api/match')
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      
      const data = await response.json()
      
      // Transform the API response to match our interface
      return data.matches.map((match: any) => ({
        id: match._id,
        name: match.name || 'Music Match',
        matchScore: match.score || 0.75,
        recentTracks: this.transformTracks(match.tracks || [])
      }))
    } catch (error) {
      console.error('Error fetching matches:', error)
      
      // Return mock data as fallback if API fails
      return [
        {
          id: 'match1',
          name: 'Music Lover',
          matchScore: 0.85,
          recentTracks: [
            {
              id: 'track1',
              name: 'Bohemian Rhapsody',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b273365b3fb800c19f7ff72602da'
            },
            {
              id: 'track2',
              name: 'Hotel California',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b2738eadb51b1c90d7d5c5c8d354'
            },
            {
              id: 'track3',
              name: 'Stairway to Heaven',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b273c8a11e48c91a982d086afc69'
            }
          ]
        },
        {
          id: 'match2',
          name: 'Indie Fan',
          matchScore: 0.78,
          recentTracks: [
            {
              id: 'track4',
              name: 'Midnight City',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b273b5bda8dea777b6b6b7e6b7b2'
            },
            {
              id: 'track5',
              name: 'Do I Wanna Know?',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b273f0f7a66904dc6c9573e09f2c'
            },
            {
              id: 'track6',
              name: 'Skinny Love',
              albumArt: 'https://i.scdn.co/image/ab67616d0000b273b5551a14600db9e9dbc88d10'
            }
          ]
        }
      ]
    }
  }
  
  private transformTracks(apiTracks: any[]): Track[] {
    return apiTracks.map(track => ({
      id: track.id || track._id,
      name: track.name || 'Unknown Track',
      albumArt: track.albumArt || track.album?.images?.[0]?.url || 'https://via.placeholder.com/300'
    }))
  }
  
  async getSpotifyRecommendations(trackIds: string[]): Promise<Track[]> {
    try {
      const session = await getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }
      
      const spotifyApi = await getSpotifyApi(session)
      const seedTracks = trackIds.slice(0, 5) // Spotify allows max 5 seed tracks
      
      const recommendations = await spotifyApi.getRecommendations({
        seed_tracks: seedTracks,
        limit: 10
      })
      
      return recommendations.body.tracks.map(track => ({
        id: track.id,
        name: track.name,
        albumArt: track.album.images[0]?.url || 'https://via.placeholder.com/300'
      }))
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error)
      return []
    }
  }
}
