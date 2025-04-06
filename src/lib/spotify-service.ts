import axios, { AxiosError } from 'axios';
import { MusicService, Track, Recommendation, CurrentTrack } from './music-service.interface';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  duration_ms: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
}

interface SpotifyCurrentlyPlayingResponse {
  item: SpotifyTrack | null;
  is_playing: boolean;
  progress_ms: number;
}

export class SpotifyService implements MusicService {
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required Spotify configuration');
    }

    this.CLIENT_ID = clientId;
    this.CLIENT_SECRET = clientSecret;
    this.REDIRECT_URI = redirectUri;
    
    // Log environment variables (without exposing secrets)
    console.log('Spotify Client ID available:', !!this.CLIENT_ID);
    console.log('Spotify Client Secret available:', !!this.CLIENT_SECRET);
    
    // Check for existing token in localStorage
    this.accessToken = localStorage.getItem('spotify_access_token');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }

  public initiateLogin(): string {
    const scope = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: scope,
      redirect_uri: this.REDIRECT_URI,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.REDIRECT_URI,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      localStorage.setItem('spotify_access_token', this.accessToken);
      localStorage.setItem('spotify_refresh_token', this.refreshToken);
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      this.accessToken = response.data.access_token;
      localStorage.setItem('spotify_access_token', this.accessToken);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private async makeRequest<T>(url: string, method: 'get' | 'post' = 'get', data?: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        await this.refreshAccessToken();
        // Retry the request with new token
        const response = await axios({
          method,
          url,
          data,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        return response.data;
      }
      throw error;
    }
  }

  public async searchTracks(query: string): Promise<Track[]> {
    const response = await this.makeRequest<SpotifySearchResponse>(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`
    );
    return response.tracks.items.map(this.convertSpotifyTrack);
  }

  private convertSpotifyTrack(track: SpotifyTrack): Track {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      imageUrl: track.album.images[0]?.url || '',
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify,
      duration: track.duration_ms
    };
  }

  public async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      const response = await this.makeRequest<SpotifyCurrentlyPlayingResponse>(
        'https://api.spotify.com/v1/me/player/currently-playing'
      );
      
      if (!response.item) {
        return null;
      }

      return {
        ...this.convertSpotifyTrack(response.item),
        isPlaying: response.is_playing,
        progress: response.progress_ms
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }

  public async pausePlayback(): Promise<void> {
    await this.makeRequest('https://api.spotify.com/v1/me/player/pause', 'post');
  }

  public async resumePlayback(): Promise<void> {
    await this.makeRequest('https://api.spotify.com/v1/me/player/play', 'post');
  }

  public async skipToNextTrack(): Promise<void> {
    await this.makeRequest('https://api.spotify.com/v1/me/player/next', 'post');
  }

  public async skipToPreviousTrack(): Promise<void> {
    await this.makeRequest('https://api.spotify.com/v1/me/player/previous', 'post');
  }

  public async getRecommendationsFromText(text: string): Promise<Recommendation[]> {
    try {
      // Get seed tracks based on text analysis
      const searchResults = await this.searchTracks(text);
      if (searchResults.length === 0) {
        throw new Error('No tracks found matching the input text');
      }

      // Use the first track as a seed
      const seedTrack = searchResults[0];
      
      // Get recommendations based on the seed track
      const recommendations = await this.makeRequest<SpotifyRecommendationsResponse>(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack.id}&limit=10`
      );

      return recommendations.tracks.map(track => ({
        ...this.convertSpotifyTrack(track),
        confidence: 0.8,
        mood: 'neutral',
        description: `Based on your input: "${text}"`
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }
} 