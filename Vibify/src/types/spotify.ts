/**
 * Represents a song recommendation from Spotify
 */
export interface SpotifyRecommendation {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  imageUrl: string;
  previewUrl: string;
  spotifyUrl: string;
  description?: string;
  mood?: string;
  genres: string[];
  tempo: number;
  colors?: string[];
  aesthetic?: string;
  attribution?: string;
}

/**
 * Represents the response from the Spotify API
 */
export interface SpotifyApiResponse {
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{
        name: string;
      }>;
      album: {
        images: Array<{
          url: string;
        }>;
      };
      preview_url: string;
      external_urls: {
        spotify: string;
      };
    }>;
  };
}

/**
 * Represents the parameters for getting recommendations
 */
export interface RecommendationParams {
  limit?: number;
  seed_genres?: string[];
  seed_tracks?: string[];
  seed_artists?: string[];
  target_popularity?: number;
  min_popularity?: number;
  max_popularity?: number;
  target_valence?: number;
  min_valence?: number;
  max_valence?: number;
  target_energy?: number;
  min_energy?: number;
  max_energy?: number;
  target_danceability?: number;
  min_danceability?: number;
  max_danceability?: number;
  target_tempo?: number;
  min_tempo?: number;
  max_tempo?: number;
}

export interface VisualFeatures {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpness: number;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  imageUrl: string;
  previewUrl: string;
  spotifyUrl: string;
  description: string;
  mood: string;
  genres: string[];
  tempo: number;
} 