interface TrackFeatures {
  danceability: number
  energy: number
  valence: number
  tempo: number
  acousticness: number
  instrumentalness: number
  genres: string[]
}

interface PlaylistProfile {
  dominantGenres: string[]
  averageFeatures: TrackFeatures
  moodProfile: {
    happy: number
    energetic: number
    relaxed: number
    melancholic: number
  }
  diversity: number
}

export async function analyzePlaylist(
  spotifyApi: any,
  playlistId: string
): Promise<PlaylistProfile> {
  // Get playlist tracks
  const tracks = await spotifyApi.getPlaylistTracks(playlistId)
  const trackIds = tracks.items.map((item: any) => item.track.id)
  
  // Get audio features for all tracks
  const audioFeatures = await spotifyApi.getAudioFeaturesForTracks(trackIds)
  
  // Get artist genres
  const artistIds = [...new Set(tracks.items.map((item: any) => item.track.artists[0].id))]
  const artists = await spotifyApi.getArtists(artistIds)
  
  // Calculate dominant genres
  const genreCount: { [key: string]: number } = {}
  artists.forEach((artist: any) => {
    artist.genres.forEach((genre: string) => {
      genreCount[genre] = (genreCount[genre] || 0) + 1
    })
  })
  
  const dominantGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)

  // Calculate average features
  const averageFeatures = audioFeatures.reduce(
    (acc: TrackFeatures, features: TrackFeatures) => ({
      danceability: acc.danceability + features.danceability,
      energy: acc.energy + features.energy,
      valence: acc.valence + features.valence,
      tempo: acc.tempo + features.tempo,
      acousticness: acc.acousticness + features.acousticness,
      instrumentalness: acc.instrumentalness + features.instrumentalness,
      genres: [],
    }),
    {
      danceability: 0,
      energy: 0,
      valence: 0,
      tempo: 0,
      acousticness: 0,
      instrumentalness: 0,
      genres: [],
    }
  )

  Object.keys(averageFeatures).forEach((key) => {
    if (key !== 'genres') {
      averageFeatures[key as keyof Omit<TrackFeatures, 'genres'>] /= audioFeatures.length
    }
  })

  // Calculate mood profile
  const moodProfile = {
    happy: (averageFeatures.valence + averageFeatures.energy) / 2,
    energetic: averageFeatures.energy,
    relaxed: (averageFeatures.acousticness + (1 - averageFeatures.energy)) / 2,
    melancholic: (1 - averageFeatures.valence + averageFeatures.acousticness) / 2,
  }

  // Calculate musical diversity (standard deviation of features)
  const diversity = calculateDiversity(audioFeatures)

  return {
    dominantGenres,
    averageFeatures: { ...averageFeatures, genres: dominantGenres },
    moodProfile,
    diversity,
  }
}

function calculateDiversity(audioFeatures: TrackFeatures[]): number {
  const features = ['danceability', 'energy', 'valence', 'acousticness']
  const variances = features.map((feature) => {
    const values = audioFeatures.map((track) => track[feature as keyof TrackFeatures] as number)
    const mean = values.reduce((a, b) => a + b) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  })
  
  return variances.reduce((a, b) => a + b) / variances.length
}

export function calculatePlaylistCompatibility(
  profile1: PlaylistProfile,
  profile2: PlaylistProfile
): number {
  // Genre compatibility (30% weight)
  const commonGenres = profile1.dominantGenres.filter((genre) =>
    profile2.dominantGenres.includes(genre)
  ).length
  const genreScore = (commonGenres / Math.min(profile1.dominantGenres.length, profile2.dominantGenres.length)) * 0.3

  // Mood compatibility (40% weight)
  const moodScore = (1 - calculateMoodDistance(profile1.moodProfile, profile2.moodProfile)) * 0.4

  // Musical feature compatibility (20% weight)
  const featureScore = (1 - calculateFeatureDistance(profile1.averageFeatures, profile2.averageFeatures)) * 0.2

  // Diversity compatibility (10% weight)
  const diversityScore = (1 - Math.abs(profile1.diversity - profile2.diversity)) * 0.1

  return genreScore + moodScore + featureScore + diversityScore
}

function calculateMoodDistance(mood1: PlaylistProfile['moodProfile'], mood2: PlaylistProfile['moodProfile']): number {
  const keys = Object.keys(mood1) as (keyof typeof mood1)[]
  const distances = keys.map((key) => Math.pow(mood1[key] - mood2[key], 2))
  return Math.sqrt(distances.reduce((a, b) => a + b) / keys.length)
}

function calculateFeatureDistance(features1: TrackFeatures, features2: TrackFeatures): number {
  const keys = ['danceability', 'energy', 'valence', 'acousticness'] as const
  const distances = keys.map((key) => Math.pow(features1[key] - features2[key], 2))
  return Math.sqrt(distances.reduce((a, b) => a + b) / keys.length)
}
