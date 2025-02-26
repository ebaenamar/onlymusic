import * as tf from '@tensorflow/tfjs'
import { Track, Artist, AudioFeatures } from '../types/spotify'

interface AdvancedPlaylistProfile {
  genreSignature: GenreSignature
  temporalPatterns: TemporalPatterns
  musicalComplexity: MusicalComplexity
  emotionalJourney: EmotionalJourney
  artistNetwork: ArtistNetwork
  listenerPersonality: ListenerPersonality
}

interface GenreSignature {
  primary: string[]
  secondary: string[]
  rare: string[]
  genreEvolution: {
    emerging: string[]
    declining: string[]
  }
  crossGenreScore: number
}

interface TemporalPatterns {
  tempoDistribution: number[]
  rhythmicPatterns: string[]
  timeSignatures: {
    [key: string]: number
  }
  temporalDiversity: number
}

interface MusicalComplexity {
  harmonicComplexity: number
  rhythmicComplexity: number
  structuralComplexity: number
  instrumentalLayers: number
  dynamicRange: number
}

interface EmotionalJourney {
  emotionalArc: number[]
  emotionalRange: number
  emotionalTransitions: {
    smooth: number
    sudden: number
  }
  dominantEmotions: string[]
}

interface ArtistNetwork {
  centralArtists: string[]
  collaborations: {
    [key: string]: string[]
  }
  artistDiversity: number
  eraSpread: {
    [key: string]: number
  }
}

interface ListenerPersonality {
  openness: number
  consistency: number
  eclecticism: number
  exploratoryNature: number
  loyaltyToArtists: number
}

export class AdvancedMusicAnalyzer {
  private model: tf.LayersModel | null = null

  async initialize() {
    // Load pre-trained model for music analysis
    this.model = await tf.loadLayersModel('/models/music_analysis_model.json')
  }

  async analyzePlaylist(
    tracks: Track[],
    audioFeatures: AudioFeatures[],
    artists: Artist[]
  ): Promise<AdvancedPlaylistProfile> {
    return {
      genreSignature: await this.analyzeGenreSignature(tracks, artists),
      temporalPatterns: this.analyzeTemporalPatterns(audioFeatures),
      musicalComplexity: await this.analyzeMusicalComplexity(audioFeatures),
      emotionalJourney: this.analyzeEmotionalJourney(audioFeatures),
      artistNetwork: this.analyzeArtistNetwork(tracks, artists),
      listenerPersonality: this.analyzeListenerPersonality(tracks, audioFeatures)
    }
  }

  private async analyzeGenreSignature(tracks: Track[], artists: Artist[]): Promise<GenreSignature> {
    // Filter out undefined genres
    const allGenres = artists.flatMap(artist => artist.genres || []).filter(Boolean)
    const genreCounts = new Map<string, number>()
    
    allGenres.forEach(genre => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    })

    const sortedGenres = Array.from(genreCounts.entries())
      .sort(([, a], [, b]) => b - a)

    // Use TensorFlow.js for genre clustering
    const genreEmbeddings = await this.getGenreEmbeddings(Array.from(genreCounts.keys()))
    const clusters = await this.clusterGenres(genreEmbeddings)

    return {
      primary: sortedGenres.slice(0, 3).map(([genre]) => genre),
      secondary: sortedGenres.slice(3, 8).map(([genre]) => genre),
      rare: sortedGenres.slice(-5).map(([genre]) => genre),
      genreEvolution: this.analyzeGenreEvolution(tracks),
      crossGenreScore: this.calculateCrossGenreScore(genreCounts)
    }
  }

  private analyzeGenreEvolution(tracks: Track[]): { emerging: string[], declining: string[] } {
    // This is a simplified implementation that would normally analyze trends over time
    // For now, we'll return some placeholder data
    return {
      emerging: tracks.slice(0, 3)
        .flatMap(track => track.artists)
        .flatMap(artist => artist.genres || [])
        .filter(Boolean)
        .slice(0, 3),
      declining: tracks.slice(-3)
        .flatMap(track => track.artists)
        .flatMap(artist => artist.genres || [])
        .filter(Boolean)
        .slice(0, 3)
    }
  }

  private calculateCrossGenreScore(genreCounts: Map<string, number>): number {
    // Calculate diversity score based on genre distribution
    // Higher score means more diverse genres
    const totalGenres = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0)
    const uniqueGenres = genreCounts.size
    
    if (totalGenres === 0) return 0
    
    // Normalize to a 0-1 scale where higher means more diverse
    const rawScore = uniqueGenres / totalGenres
    
    // Scale to 0-100 for better readability
    return Math.min(Math.round(rawScore * 100), 100)
  }

  private analyzeTemporalPatterns(audioFeatures: AudioFeatures[]): TemporalPatterns {
    const tempos = audioFeatures.map(af => af.tempo)
    const timeSignatures = audioFeatures.reduce((acc, af) => {
      const ts = af.time_signature.toString()
      acc[ts] = (acc[ts] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    return {
      tempoDistribution: this.calculateTempoDistribution(tempos),
      rhythmicPatterns: this.identifyRhythmicPatterns(audioFeatures),
      timeSignatures,
      temporalDiversity: this.calculateTemporalDiversity(audioFeatures)
    }
  }

  private calculateTemporalDiversity(audioFeatures: AudioFeatures[]): number {
    if (audioFeatures.length === 0) return 0
    
    // Calculate standard deviation of tempos as a measure of diversity
    const tempos = audioFeatures.map(af => af.tempo)
    const mean = tempos.reduce((sum, tempo) => sum + tempo, 0) / tempos.length
    const variance = tempos.reduce((sum, tempo) => sum + Math.pow(tempo - mean, 2), 0) / tempos.length
    const stdDev = Math.sqrt(variance)
    
    // Calculate time signature diversity (number of unique time signatures)
    const uniqueTimeSignatures = new Set(audioFeatures.map(af => af.time_signature)).size
    
    // Calculate diversity in other rhythmic features
    const energyDiversity = this.calculateFeatureDiversity(audioFeatures.map(af => af.energy))
    const danceDiversity = this.calculateFeatureDiversity(audioFeatures.map(af => af.danceability))
    
    // Combine factors into a single diversity score (0-1)
    const tempoFactor = Math.min(stdDev / 50, 1) // Normalize tempo std dev
    const timeSignatureFactor = Math.min((uniqueTimeSignatures - 1) / 3, 1) // Normalize time signatures
    const otherFactor = (energyDiversity + danceDiversity) / 2
    
    // Weighted average of factors
    const diversityScore = (tempoFactor * 0.4) + (timeSignatureFactor * 0.3) + (otherFactor * 0.3)
    
    // Return score on a 0-1 scale
    return diversityScore
  }
  
  private calculateFeatureDiversity(values: number[]): number {
    if (values.length <= 1) return 0
    
    // Calculate standard deviation as a measure of diversity
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    // Normalize to a 0-1 scale
    return Math.min(stdDev * 2, 1)
  }

  private async analyzeMusicalComplexity(audioFeatures: AudioFeatures[]): Promise<MusicalComplexity> {
    const features = tf.tensor2d(audioFeatures.map(af => [
      af.instrumentalness,
      af.acousticness,
      af.speechiness,
      af.loudness,
      af.tempo
    ]))

    const complexityPrediction = this.model!.predict(features) as tf.Tensor
    
    // Fix: Convert tensor to array and properly handle the result
    const predictionArray = await complexityPrediction.array();
    let harmonic = 0.5;
    let rhythmic = 0.5;
    let structural = 0.5;
    
    // Safely extract values from the prediction array
    if (Array.isArray(predictionArray) && predictionArray.length >= 3) {
      // If it's a flat array of values
      harmonic = Number(predictionArray[0]);
      rhythmic = Number(predictionArray[1]);
      structural = Number(predictionArray[2]);
    } else if (Array.isArray(predictionArray) && predictionArray.length > 0) {
      // If it's a nested array (e.g., batch of predictions)
      const firstPrediction = predictionArray[0];
      if (Array.isArray(firstPrediction) && firstPrediction.length >= 3) {
        harmonic = Number(firstPrediction[0]);
        rhythmic = Number(firstPrediction[1]);
        structural = Number(firstPrediction[2]);
      }
    }
    
    // Clean up tensor to prevent memory leaks
    complexityPrediction.dispose();

    return {
      harmonicComplexity: harmonic,
      rhythmicComplexity: rhythmic,
      structuralComplexity: structural,
      instrumentalLayers: this.estimateInstrumentalLayers(audioFeatures),
      dynamicRange: this.calculateDynamicRange(audioFeatures)
    }
  }

  private estimateInstrumentalLayers(audioFeatures: AudioFeatures[]): number {
    // Calculate instrumental layers based on instrumentalness, acousticness, and speechiness
    const avgInstrumentalness = audioFeatures.reduce((sum, af) => sum + af.instrumentalness, 0) / audioFeatures.length;
    const avgAcousticness = audioFeatures.reduce((sum, af) => sum + af.acousticness, 0) / audioFeatures.length;
    const avgSpeechiness = audioFeatures.reduce((sum, af) => sum + af.speechiness, 0) / audioFeatures.length;
    
    // Higher instrumentalness and lower speechiness suggests more instrumental layers
    // Scale to a reasonable range (1-10)
    const baseEstimate = (avgInstrumentalness * 10) * (1 - avgSpeechiness);
    
    // Adjust based on acousticness - acoustic tracks tend to have fewer distinct layers
    const layerEstimate = baseEstimate * (1 + (1 - avgAcousticness) * 0.5);
    
    // Ensure result is between 1 and 10
    return Math.max(1, Math.min(10, Math.round(layerEstimate)));
  }

  private calculateDynamicRange(audioFeatures: AudioFeatures[]): number {
    // Calculate dynamic range based on loudness and energy variations
    const loudnessValues = audioFeatures.map(af => af.loudness);
    const energyValues = audioFeatures.map(af => af.energy);
    
    // Find the range of loudness (typically negative values, with higher/less negative being louder)
    const loudnessMin = Math.min(...loudnessValues);
    const loudnessMax = Math.max(...loudnessValues);
    const loudnessRange = Math.abs(loudnessMax - loudnessMin);
    
    // Find the range of energy (0-1)
    const energyMin = Math.min(...energyValues);
    const energyMax = Math.max(...energyValues);
    const energyRange = energyMax - energyMin;
    
    // Combine both factors, normalize to a 0-1 scale
    // Typical loudness range might be around 20dB, so normalize accordingly
    const normalizedLoudnessRange = Math.min(1, loudnessRange / 20);
    
    // Weighted combination
    return (normalizedLoudnessRange * 0.7) + (energyRange * 0.3);
  }

  private analyzeEmotionalJourney(audioFeatures: AudioFeatures[]): EmotionalJourney {
    const emotionalValues = audioFeatures.map(af => ({
      valence: af.valence,
      energy: af.energy,
      arousal: (af.energy + af.valence) / 2
    }))

    const emotionalArc = this.calculateEmotionalArc(emotionalValues)
    const transitions = this.analyzeEmotionalTransitions(emotionalValues)

    return {
      emotionalArc,
      emotionalRange: this.calculateEmotionalRange(emotionalValues),
      emotionalTransitions: transitions,
      dominantEmotions: this.identifyDominantEmotions(emotionalValues)
    }
  }

  private analyzeArtistNetwork(tracks: Track[], artists: Artist[]): ArtistNetwork {
    const collaborations = this.findArtistCollaborations(tracks)
    const artistFrequency = this.calculateArtistFrequency(tracks)
    const eras = this.categorizeByEra(tracks)

    return {
      centralArtists: this.findCentralArtists(artistFrequency),
      collaborations,
      artistDiversity: this.calculateArtistDiversity(tracks),
      eraSpread: this.calculateEraDistribution(eras)
    }
  }

  private analyzeListenerPersonality(tracks: Track[], audioFeatures: AudioFeatures[]): ListenerPersonality {
    return {
      openness: this.calculateOpenness(tracks, audioFeatures),
      consistency: this.calculateConsistency(audioFeatures),
      eclecticism: this.calculateEclecticism(tracks),
      exploratoryNature: this.calculateExploratoryNature(tracks),
      loyaltyToArtists: this.calculateArtistLoyalty(tracks)
    }
  }

  // Helper methods for advanced calculations...
  private async getGenreEmbeddings(genres: string[]): Promise<tf.Tensor2D> {
    // Implementation using word2vec or similar embedding technique
    return tf.tensor2d([]) // Placeholder
  }

  private async clusterGenres(embeddings: tf.Tensor2D): Promise<number[]> {
    // Implementation using k-means clustering
    return [] // Placeholder
  }

  private calculateTempoDistribution(tempos: number[]): number[] {
    // Implementation for tempo distribution analysis
    return [] // Placeholder
  }

  private identifyRhythmicPatterns(audioFeatures: AudioFeatures[]): string[] {
    // Implementation for rhythmic pattern identification
    return [] // Placeholder
  }

  // ... Additional helper methods for other calculations
}
