import * as tf from '@tensorflow/tfjs'
import { Track, AudioFeatures } from '../types/spotify'
import { AdvancedPlaylistProfile } from '../types/music'

interface RecommendationContext {
  likedTracks: Track[]
  userProfile: AdvancedPlaylistProfile
  matchProfile: AdvancedPlaylistProfile
  currentMood: {
    energy: number
    valence: number
    danceability: number
  }
}

export class PlaylistRecommender {
  private model: tf.LayersModel | null = null
  private trackEmbeddings: Map<string, Float32Array> = new Map()

  async initialize() {
    // Load pre-trained recommendation model
    this.model = await tf.loadLayersModel('/models/music_recommendation_model.json')
  }

  async generateRecommendations(
    availableTracks: Track[],
    context: RecommendationContext
  ): Promise<Track[]> {
    const recommendations = await this.rankTracks(availableTracks, context)
    return this.diversifyRecommendations(recommendations, context)
  }

  private async rankTracks(
    tracks: Track[],
    context: RecommendationContext
  ): Promise<Track[]> {
    const scores = await Promise.all(
      tracks.map(track => this.calculateTrackScore(track, context))
    )

    return tracks
      .map((track, i) => ({ track, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .map(({ track }) => track)
  }

  private async calculateTrackScore(
    track: Track,
    context: RecommendationContext
  ): Promise<number> {
    const weights = {
      genreMatch: 0.3,
      moodMatch: 0.25,
      featureMatch: 0.25,
      novelty: 0.2
    }

    const scores = {
      genreMatch: this.calculateGenreMatchScore(track, context),
      moodMatch: this.calculateMoodMatchScore(track, context),
      featureMatch: await this.calculateFeatureMatchScore(track, context),
      novelty: this.calculateNoveltyScore(track, context)
    }

    return Object.entries(weights)
      .reduce((total, [key, weight]) => total + scores[key as keyof typeof scores] * weight, 0)
  }

  private calculateGenreMatchScore(track: Track, context: RecommendationContext): number {
    const trackGenres = new Set(track.artists.flatMap(artist => artist.genres || []))
    const userGenres = new Set(context.userProfile.genreSignature.primary)
    const matchGenres = new Set(context.matchProfile.genreSignature.primary)

    const userIntersection = new Set([...trackGenres].filter(x => userGenres.has(x)))
    const matchIntersection = new Set([...trackGenres].filter(x => matchGenres.has(x)))

    return (
      (userIntersection.size / userGenres.size + matchIntersection.size / matchGenres.size) / 2
    )
  }

  private calculateMoodMatchScore(track: Track, context: RecommendationContext): number {
    const { energy, valence, danceability } = track.audioFeatures
    const { currentMood } = context

    return 1 - (
      Math.abs(energy - currentMood.energy) +
      Math.abs(valence - currentMood.valence) +
      Math.abs(danceability - currentMood.danceability)
    ) / 3
  }

  private async calculateFeatureMatchScore(
    track: Track,
    context: RecommendationContext
  ): Promise<number> {
    const trackEmbedding = await this.getTrackEmbedding(track)
    const contextEmbedding = await this.getContextEmbedding(context)

    return tf.tidy(() => {
      const trackTensor = tf.tensor1d(trackEmbedding)
      const contextTensor = tf.tensor1d(contextEmbedding)
      return trackTensor.dot(contextTensor).dataSync()[0]
    })
  }

  private calculateNoveltyScore(track: Track, context: RecommendationContext): number {
    const likedTrackIds = new Set(context.likedTracks.map(t => t.id))
    if (likedTrackIds.has(track.id)) return 0

    const similarityToLiked = context.likedTracks.map(likedTrack =>
      this.calculateTrackSimilarity(track, likedTrack)
    )

    return 1 - Math.max(...similarityToLiked)
  }

  private calculateTrackSimilarity(track1: Track, track2: Track): number {
    const features = [
      'danceability',
      'energy',
      'valence',
      'tempo',
      'acousticness'
    ] as const

    const differences = features.map(feature => {
      const value1 = track1.audioFeatures[feature]
      const value2 = track2.audioFeatures[feature]
      return Math.pow(value1 - value2, 2)
    })

    return 1 - Math.sqrt(differences.reduce((sum, diff) => sum + diff, 0) / features.length)
  }

  private async getTrackEmbedding(track: Track): Promise<Float32Array> {
    if (this.trackEmbeddings.has(track.id)) {
      return this.trackEmbeddings.get(track.id)!
    }

    const embedding = await this.generateTrackEmbedding(track)
    this.trackEmbeddings.set(track.id, embedding)
    return embedding
  }

  private async generateTrackEmbedding(track: Track): Promise<Float32Array> {
    const features = [
      track.audioFeatures.danceability,
      track.audioFeatures.energy,
      track.audioFeatures.valence,
      track.audioFeatures.tempo / 200, // Normalize tempo
      track.audioFeatures.acousticness,
      track.audioFeatures.instrumentalness,
      track.audioFeatures.speechiness,
      track.audioFeatures.liveness
    ]

    return tf.tidy(() => {
      const input = tf.tensor2d([features])
      const embedding = this.model!.predict(input) as tf.Tensor
      return embedding.dataSync() as Float32Array
    })
  }

  private async getContextEmbedding(context: RecommendationContext): Promise<Float32Array> {
    const likedTrackEmbeddings = await Promise.all(
      context.likedTracks.map(track => this.getTrackEmbedding(track))
    )

    return tf.tidy(() => {
      const embeddings = tf.stack(likedTrackEmbeddings.map(emb => tf.tensor1d(emb)))
      return embeddings.mean(0).dataSync() as Float32Array
    })
  }

  private diversifyRecommendations(
    recommendations: Track[],
    context: RecommendationContext
  ): Track[] {
    const diversified: Track[] = []
    const genreCounts = new Map<string, number>()
    const artistCounts = new Map<string, number>()

    for (const track of recommendations) {
      const genres = track.artists.flatMap(artist => artist.genres || [])
      const artists = track.artists.map(artist => artist.id)

      // Check if we're overrepresenting any genre or artist
      const genreOverrepresented = genres.some(
        genre => (genreCounts.get(genre) || 0) >= 3
      )
      const artistOverrepresented = artists.some(
        artist => (artistCounts.get(artist) || 0) >= 2
      )

      if (!genreOverrepresented && !artistOverrepresented) {
        diversified.push(track)
        
        // Update counts
        genres.forEach(genre => 
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
        )
        artists.forEach(artist => 
          artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1)
        )
      }

      if (diversified.length >= 10) break
    }

    return diversified
  }
}
