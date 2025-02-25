import SpotifyWebApi from 'spotify-web-api-node'
import { Session } from 'next-auth'

const scopes = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'streaming',
  'user-read-private'
]

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

export const LOGIN_URL = spotifyApi.createAuthorizeURL(scopes, '')

export const getSpotifyApi = async (session: Session) => {
  if (session.accessToken) {
    spotifyApi.setAccessToken(session.accessToken)
  }
  
  // Check if token needs refresh
  const now = Date.now()
  if (session.expires && now > session.expires) {
    const data = await spotifyApi.refreshAccessToken()
    spotifyApi.setAccessToken(data.body.access_token)
    
    // Update session token (implement this in your session handling)
    // await updateSession({
    //   accessToken: data.body.access_token,
    //   expires: Date.now() + data.body.expires_in * 1000
    // })
  }
  
  return spotifyApi
}

// Utility functions for track matching
export const getTrackFeatures = async (trackId: string) => {
  const features = await spotifyApi.getAudioFeaturesForTrack(trackId)
  return features.body
}

export const findSimilarTracks = async (trackId: string) => {
  const features = await getTrackFeatures(trackId)
  
  // Get recommendations based on track
  const recommendations = await spotifyApi.getRecommendations({
    seed_tracks: [trackId],
    target_danceability: features.danceability,
    target_energy: features.energy,
    target_valence: features.valence,
    limit: 10
  })
  
  return recommendations.body.tracks
}

// Real-time playback sync
export interface PlaybackState {
  isPlaying: boolean
  track: {
    id: string
    name: string
    artist: string
    albumArt: string
    duration: number
  }
  progress: number
  timestamp: number
}

export const getCurrentPlayback = async (): Promise<PlaybackState | null> => {
  try {
    const state = await spotifyApi.getMyCurrentPlaybackState()
    if (!state.body || !state.body.item) return null
    
    return {
      isPlaying: state.body.is_playing,
      track: {
        id: state.body.item.id,
        name: state.body.item.name,
        artist: state.body.item.artists[0].name,
        albumArt: state.body.item.album.images[0].url,
        duration: state.body.item.duration_ms
      },
      progress: state.body.progress_ms || 0,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Error getting playback state:', error)
    return null
  }
}
