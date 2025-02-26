import { ListeningHistory, UserMusicProfile } from './listeningHistoryMatcher'

export class MatchingAlgorithm {
  private static WEIGHTS = {
    recentTracks: 0.6,
    artists: 0.3,
    genres: 0.1
  }

  calculateMatchScore(user1: UserMusicProfile, user2: UserMusicProfile): number {
    const recentTrackScore = this.calculateRecentTrackScore(user1.recentTracks, user2.recentTracks)
    const artistScore = this.calculateArtistScore(user1.topArtists, user2.topArtists)
    const genreScore = this.calculateGenreScore(user1.topGenres, user2.topGenres)

    return (
      recentTrackScore * MatchingAlgorithm.WEIGHTS.recentTracks +
      artistScore * MatchingAlgorithm.WEIGHTS.artists +
      genreScore * MatchingAlgorithm.WEIGHTS.genres
    )
  }

  private calculateRecentTrackScore(tracks1: ListeningHistory[], tracks2: ListeningHistory[]): number {
    const track1Ids = new Set(tracks1.map(t => t.trackId))
    const track2Ids = new Set(tracks2.map(t => t.trackId))
    const commonTracks = new Set([...track1Ids].filter(id => track2Ids.has(id)))
    return commonTracks.size / Math.max(track1Ids.size, track2Ids.size)
  }

  private calculateArtistScore(
    artists1: { id: string; weight: number }[],
    artists2: { id: string; weight: number }[]
  ): number {
    const artist1Ids = new Set(artists1.map(a => a.id))
    const artist2Ids = new Set(artists2.map(a => a.id))
    const commonArtists = new Set([...artist1Ids].filter(id => artist2Ids.has(id)))
    return commonArtists.size / Math.max(artist1Ids.size, artist2Ids.size)
  }

  private calculateGenreScore(
    genres1: { name: string; weight: number }[],
    genres2: { name: string; weight: number }[]
  ): number {
    const genre1Set = new Set(genres1.map(g => g.name))
    const genre2Set = new Set(genres2.map(g => g.name))
    const commonGenres = new Set([...genre1Set].filter(name => genre2Set.has(name)))
    return commonGenres.size / Math.max(genre1Set.size, genre2Set.size)
  }
}
