import { Track, AudioFeatures } from '../types/spotify'

interface ListeningHistory {
  trackId: string
  timestamp: number
  playCount: number
  duration: number // in seconds
}

interface UserMusicProfile {
  recentTracks: ListeningHistory[]
  topArtists: {
    id: string
    weight: number
  }[]
  topGenres: {
    name: string
    weight: number
  }[]
  listeningPatterns: {
    morningTracks: string[]
    afternoonTracks: string[]
    eveningTracks: string[]
    weekendTracks: string[]
  }
}

export class ListeningHistoryMatcher {
  private static RECENCY_WINDOW = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  private static LISTENING_THRESHOLD = 30 // seconds

  async analyzeListeningHistory(
    spotifyApi: any,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term'
  ): Promise<UserMusicProfile> {
    const [
      recentlyPlayed,
      topTracks,
      topArtists,
    ] = await Promise.all([
      spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 }),
      spotifyApi.getMyTopTracks({ time_range: timeRange, limit: 50 }),
      spotifyApi.getMyTopArtists({ time_range: timeRange, limit: 20 }),
    ])

    const listeningHistory = this.processRecentlyPlayed(recentlyPlayed.items)
    const topArtistWeights = this.calculateArtistWeights(topArtists.items)
    const topGenreWeights = this.calculateGenreWeights(topArtists.items)
    const listeningPatterns = this.analyzeDailyPatterns(recentlyPlayed.items)

    return {
      recentTracks: listeningHistory,
      topArtists: topArtistWeights,
      topGenres: topGenreWeights,
      listeningPatterns,
    }
  }

  calculateMatchScore(
    userProfile: UserMusicProfile,
    potentialMatch: {
      id: string
      playlist: Track[]
      profile: UserMusicProfile
    }
  ): number {
    const weights = {
      recentTrackOverlap: 0.4,
      artistSimilarity: 0.3,
      genreSimilarity: 0.2,
      listeningPatternMatch: 0.1,
    }

    const scores = {
      recentTrackOverlap: this.calculateRecentTrackOverlap(
        userProfile.recentTracks,
        potentialMatch.playlist
      ),
      artistSimilarity: this.calculateArtistSimilarity(
        userProfile.topArtists,
        potentialMatch.profile.topArtists
      ),
      genreSimilarity: this.calculateGenreSimilarity(
        userProfile.topGenres,
        potentialMatch.profile.topGenres
      ),
      listeningPatternMatch: this.calculateListeningPatternMatch(
        userProfile.listeningPatterns,
        potentialMatch.profile.listeningPatterns
      ),
    }

    return Object.entries(weights).reduce(
      (score, [key, weight]) => score + scores[key as keyof typeof scores] * weight,
      0
    )
  }

  private processRecentlyPlayed(tracks: SpotifyApi.PlayHistoryObject[]): ListeningHistory[] {
    const now = Date.now()
    const trackCounts = new Map<string, { count: number; timestamps: number[]; duration: number }>()

    tracks.forEach(track => {
      const trackId = track.track.id
      const timestamp = new Date(track.played_at).getTime()
      const duration = track.track.duration_ms / 1000

      if (!trackCounts.has(trackId)) {
        trackCounts.set(trackId, { count: 0, timestamps: [], duration })
      }

      const trackData = trackCounts.get(trackId)!
      trackData.count++
      trackData.timestamps.push(timestamp)
    })

    return Array.from(trackCounts.entries())
      .map(([trackId, data]) => ({
        trackId,
        timestamp: Math.max(...data.timestamps),
        playCount: data.count,
        duration: data.duration,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  private calculateRecentTrackOverlap(
    userHistory: ListeningHistory[],
    matchPlaylist: Track[]
  ): number {
    const recentTrackIds = new Set(userHistory.map(h => h.trackId))
    const matchTrackIds = new Set(matchPlaylist.map(t => t.id))

    const overlap = new Set([...recentTrackIds].filter(x => matchTrackIds.has(x)))
    
    // Weight recent listens more heavily
    let weightedScore = 0
    overlap.forEach(trackId => {
      const history = userHistory.find(h => h.trackId === trackId)
      if (history) {
        const recency = Math.exp(
          -(Date.now() - history.timestamp) / ListeningHistoryMatcher.RECENCY_WINDOW
        )
        weightedScore += recency * (history.playCount / 10) // Normalize play count
      }
    })

    return Math.min(1, weightedScore / 5) // Cap at 1
  }

  private calculateArtistSimilarity(
    userArtists: { id: string; weight: number }[],
    matchArtists: { id: string; weight: number }[]
  ): number {
    const userArtistMap = new Map(userArtists.map(a => [a.id, a.weight]))
    const matchArtistMap = new Map(matchArtists.map(a => [a.id, a.weight]))

    let similarity = 0
    userArtists.forEach(({ id, weight }) => {
      if (matchArtistMap.has(id)) {
        similarity += weight * matchArtistMap.get(id)!
      }
    })

    return Math.min(1, similarity)
  }

  private calculateGenreSimilarity(
    userGenres: { name: string; weight: number }[],
    matchGenres: { name: string; weight: number }[]
  ): number {
    const userGenreMap = new Map(userGenres.map(g => [g.name, g.weight]))
    const matchGenreMap = new Map(matchGenres.map(g => [g.name, g.weight]))

    let similarity = 0
    userGenres.forEach(({ name, weight }) => {
      if (matchGenreMap.has(name)) {
        similarity += weight * matchGenreMap.get(name)!
      }
    })

    return Math.min(1, similarity)
  }

  private calculateListeningPatternMatch(
    userPatterns: UserMusicProfile['listeningPatterns'],
    matchPatterns: UserMusicProfile['listeningPatterns']
  ): number {
    const patterns = ['morningTracks', 'afternoonTracks', 'eveningTracks', 'weekendTracks'] as const
    
    let totalMatch = 0
    patterns.forEach(pattern => {
      const userTracks = new Set(userPatterns[pattern])
      const matchTracks = new Set(matchPatterns[pattern])
      
      const overlap = new Set([...userTracks].filter(x => matchTracks.has(x)))
      totalMatch += overlap.size / Math.max(userTracks.size, matchTracks.size)
    })

    return totalMatch / patterns.length
  }

  private calculateArtistWeights(artists: SpotifyApi.ArtistObjectFull[]): { id: string; weight: number }[] {
    const totalArtists = artists.length
    return artists.map((artist, index) => ({
      id: artist.id,
      weight: (totalArtists - index) / totalArtists, // Higher weight for top artists
    }))
  }

  private calculateGenreWeights(artists: SpotifyApi.ArtistObjectFull[]): { name: string; weight: number }[] {
    const genreCounts = new Map<string, number>()
    
    artists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
      })
    })

    const maxCount = Math.max(...genreCounts.values())
    return Array.from(genreCounts.entries())
      .map(([name, count]) => ({
        name,
        weight: count / maxCount,
      }))
      .sort((a, b) => b.weight - a.weight)
  }

  private analyzeDailyPatterns(
    tracks: SpotifyApi.PlayHistoryObject[]
  ): UserMusicProfile['listeningPatterns'] {
    const patterns: UserMusicProfile['listeningPatterns'] = {
      morningTracks: [],
      afternoonTracks: [],
      eveningTracks: [],
      weekendTracks: [],
    }

    tracks.forEach(track => {
      const playedAt = new Date(track.played_at)
      const hour = playedAt.getHours()
      const isWeekend = playedAt.getDay() === 0 || playedAt.getDay() === 6

      if (isWeekend) {
        patterns.weekendTracks.push(track.track.id)
      }

      if (hour >= 5 && hour < 12) {
        patterns.morningTracks.push(track.track.id)
      } else if (hour >= 12 && hour < 18) {
        patterns.afternoonTracks.push(track.track.id)
      } else {
        patterns.eveningTracks.push(track.track.id)
      }
    })

    return patterns
  }
}
