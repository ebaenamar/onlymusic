import { EmotionalPoint } from '../types/music'

export const generateEmotionalJourney = (tracks: any[]): {
  emotionalArc: EmotionalPoint[]
  peakMoment: EmotionalPoint
  lowestMoment: EmotionalPoint
} => {
  // Generate emotional points based on track features
  const emotionalArc = tracks.map((track, index) => ({
    valence: track.features.valence,
    energy: track.features.energy,
    position: index / (tracks.length - 1)
  }))

  // Find peak and lowest moments
  const peakMoment = emotionalArc.reduce((max, point) => 
    (point.valence + point.energy) / 2 > (max.valence + max.energy) / 2 ? point : max
  , emotionalArc[0])

  const lowestMoment = emotionalArc.reduce((min, point) => 
    (point.valence + point.energy) / 2 < (min.valence + min.energy) / 2 ? point : min
  , emotionalArc[0])

  return {
    emotionalArc,
    peakMoment,
    lowestMoment
  }
}
