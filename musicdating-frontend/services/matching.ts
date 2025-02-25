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
    // In a real app, this would call an API endpoint
    // For now, we'll return mock data
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
