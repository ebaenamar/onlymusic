export interface AudioFeatures {
  danceability: number
  energy: number
  key: number
  loudness: number
  mode: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
  duration_ms: number
  time_signature: number
}

export interface EmotionalPoint {
  valence: number
  energy: number
  position: number
}

export interface AdvancedPlaylistProfile {
  topGenres: { genre: string; count: number }[]
  averageFeatures: AudioFeatures
  moodProfile: {
    energy: number
    danceability: number
    valence: number
  }
  tempoDistribution: {
    slow: number
    medium: number
    fast: number
  }
  keyDistribution: Record<string, number>
  uniqueArtists: number
  totalTracks: number
  genreSignature: {
    primary: string[]
    secondary: string[]
  }
  emotionalJourney: {
    emotionalArc: EmotionalPoint[]
    peakMoment: EmotionalPoint
    lowestMoment: EmotionalPoint
  }
}
