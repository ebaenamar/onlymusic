// Spotify API Types
export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  uri: string;
  href: string;
  preview_url: string | null;
}

export interface TrackObjectFull extends Track {
  available_markets: string[];
  disc_number: number;
  track_number: number;
  is_playable: boolean;
  linked_from?: {
    id: string;
    uri: string;
  };
}

export interface EpisodeObject {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  uri: string;
  href: string;
  show: {
    id: string;
    name: string;
    publisher: string;
  };
  images: Image[];
  release_date: string;
}

export interface Artist {
  id: string;
  name: string;
  uri: string;
  href: string;
  genres?: string[];
  popularity?: number;
  images?: Image[];
  followers?: {
    total: number;
  };
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  release_date: string;
  total_tracks: number;
  images: Image[];
  uri: string;
  href: string;
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface AudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export interface PlaylistObjectFull {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
    items: {
      track: Track;
      added_at: string;
    }[];
  };
  images: Image[];
  public: boolean;
  collaborative: boolean;
  followers: {
    total: number;
  };
  uri: string;
  href: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Image[];
  followers: {
    total: number;
  };
  country: string;
  product: string;
  uri: string;
  href: string;
}

export interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  timestamp: number;
  item: TrackObjectFull | EpisodeObject;
  context: {
    uri: string;
    type: string;
  } | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
  repeat_state: string;
  shuffle_state: boolean;
}
