export interface Track {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
  tempo: number;
  genre: string;
  description: string;
  previewUrl: string;
  externalUrl: string;
  imageUrl: string;
}

export interface Recommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
  tempo: number;
  genre: string;
  description: string;
  previewUrl: string | null;
  externalUrl: string;
  imageUrl: string;
}

export interface CurrentTrack {
  title: string;
  artist: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  imageUrl: string;
}

export interface MusicService {
  isAuthenticated(): boolean;
  initiateLogin(): string;
  handleCallback(code: string): Promise<void>;
  searchTracks(query: string): Promise<Track[]>;
  getRecommendationsFromText(text: string): Promise<Track[]>;
  getCurrentTrack(): Promise<CurrentTrack | null>;
  play(): Promise<void>;
  pause(): Promise<void>;
  skip(): Promise<void>;
  getTopTracks(timeRange?: string, limit?: number): Promise<Track[]>;
} 