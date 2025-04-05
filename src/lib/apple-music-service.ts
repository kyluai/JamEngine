import axios, { AxiosError } from 'axios';
import jwt from 'jsonwebtoken';
import { MusicService, Track, Recommendation, CurrentTrack } from './music-service.interface';

// Add Vite environment variable types
interface ImportMetaEnv {
  VITE_APPLE_MUSIC_DEVELOPER_TOKEN: string;
  VITE_APPLE_MUSIC_TEAM_ID: string;
  VITE_APPLE_MUSIC_KEY_ID: string;
  VITE_APPLE_MUSIC_PRIVATE_KEY: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

interface AppleMusicTrack {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork: {
      url: string;
    };
    previews: Array<{
      url: string;
    }>;
    url: string;
  };
}

interface AppleMusicSearchResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: AppleMusicTrack['attributes'];
  }>;
}

interface AppleMusicRecommendationsResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: AppleMusicTrack['attributes'];
  }>;
}

interface AppleMusicCurrentlyPlayingResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: AppleMusicTrack['attributes'];
  }>;
}

export class AppleMusicService implements MusicService {
  private readonly DEVELOPER_TOKEN: string;
  private readonly TEAM_ID: string;
  private readonly KEY_ID: string;
  private readonly PRIVATE_KEY: string;
  private accessToken: string | null = null;
  private userToken: string | null = null;

  constructor() {
    this.DEVELOPER_TOKEN = import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
    this.TEAM_ID = import.meta.env.VITE_APPLE_MUSIC_TEAM_ID;
    this.KEY_ID = import.meta.env.VITE_APPLE_MUSIC_KEY_ID;
    this.PRIVATE_KEY = import.meta.env.VITE_APPLE_MUSIC_PRIVATE_KEY;

    // Check for existing tokens
    this.accessToken = localStorage.getItem('apple_music_access_token');
    this.userToken = localStorage.getItem('apple_music_user_token');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && !!this.userToken;
  }

  public initiateLogin(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.TEAM_ID,
      scope: 'music',
      redirect_uri: 'http://localhost:3000/callback'
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const clientSecret = this.generateClientSecret();
      
      const response = await axios.post('https://appleid.apple.com/auth/token', {
        grant_type: 'authorization_code',
        code,
        client_id: this.TEAM_ID,
        client_secret: clientSecret,
        redirect_uri: 'http://localhost:3000/callback'
      });

      this.accessToken = response.data.access_token;
      this.userToken = response.data.id_token;

      localStorage.setItem('apple_music_access_token', this.accessToken);
      localStorage.setItem('apple_music_user_token', this.userToken);
    } catch (error) {
      console.error('Error handling Apple Music callback:', error);
      throw new Error('Failed to authenticate with Apple Music');
    }
  }

  private generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.TEAM_ID,
      iat: now,
      exp: now + 15777000, // 6 months
      aud: 'https://appleid.apple.com',
      sub: this.TEAM_ID
    };

    return jwt.sign(payload, this.PRIVATE_KEY, {
      algorithm: 'ES256',
      keyid: this.KEY_ID
    });
  }

  private async makeRequest<T>(url: string, method: 'get' | 'post' = 'get', data?: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Apple Music');
    }

    try {
      const response = await axios.request<T>({
        url,
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Music-User-Token': this.userToken || '',
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, clear it and throw error
        this.accessToken = null;
        this.userToken = null;
        localStorage.removeItem('apple_music_access_token');
        localStorage.removeItem('apple_music_user_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw error;
    }
  }

  public async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await this.makeRequest<AppleMusicSearchResponse>(
        `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`
      );

      return response.data.map(track => ({
        title: track.attributes.name,
        artist: track.attributes.artistName,
        mood: 'general',
        confidence: 0.8,
        tempo: 120,
        genre: 'Unknown',
        description: `Track from ${track.attributes.albumName}`,
        previewUrl: track.attributes.previews[0]?.url || '',
        externalUrl: track.attributes.url,
        imageUrl: track.attributes.artwork.url
      }));
    } catch (error) {
      console.error('Error searching Apple Music tracks:', error);
      throw new Error('Failed to search tracks on Apple Music');
    }
  }

  public async getRecommendationsFromText(text: string): Promise<Recommendation[]> {
    try {
      const keywords = this.extractKeywords(text);
      const genre = this.determineGenre(text);
      const theme = this.extractTheme(text);

      const response = await this.makeRequest<AppleMusicRecommendationsResponse>(
        `https://api.music.apple.com/v1/me/recommendations?seed_genres=${genre}&limit=10`
      );

      return response.data.map(track => ({
        title: track.attributes.name,
        artist: track.attributes.artistName,
        mood: theme,
        confidence: this.calculateConfidence(keywords, genre, theme),
        tempo: 120,
        genre: genre,
        description: this.generateDescription(theme, genre),
        previewUrl: track.attributes.previews[0]?.url || '',
        externalUrl: track.attributes.url,
        imageUrl: track.attributes.artwork.url
      }));
    } catch (error) {
      console.error('Error getting Apple Music recommendations:', error);
      throw new Error('Failed to get recommendations from Apple Music');
    }
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  }

  private determineGenre(text: string): string {
    const genreKeywords: Record<string, string[]> = {
      pop: ['pop', 'popular', 'mainstream'],
      rock: ['rock', 'guitar', 'band'],
      electronic: ['electronic', 'edm', 'dance', 'techno'],
      hiphop: ['hip hop', 'rap', 'urban'],
      classical: ['classical', 'orchestra', 'symphony'],
      jazz: ['jazz', 'blues', 'swing']
    };

    const lowerText = text.toLowerCase();
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return genre;
      }
    }

    return 'pop';
  }

  private extractTheme(text: string): string {
    const themeKeywords: Record<string, string[]> = {
      happy: ['happy', 'joy', 'upbeat', 'cheerful'],
      sad: ['sad', 'melancholy', 'depressed', 'heartbreak'],
      energetic: ['energetic', 'pumped', 'excited', 'upbeat'],
      calm: ['calm', 'peaceful', 'relaxed', 'chill'],
      romantic: ['romantic', 'love', 'heart', 'relationship']
    };

    const lowerText = text.toLowerCase();
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return theme;
      }
    }

    return 'general';
  }

  private calculateConfidence(keywords: string[], genre: string, theme: string): number {
    const keywordMatch = keywords.length > 0 ? 0.4 : 0;
    const genreMatch = genre !== 'Unknown' ? 0.3 : 0;
    const themeMatch = theme !== 'general' ? 0.3 : 0;
    return (keywordMatch + genreMatch + themeMatch) * 100;
  }

  private generateDescription(theme: string, genre: string): string {
    return `A ${theme} ${genre} track that matches your mood and preferences.`;
  }

  public async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      const response = await this.makeRequest<AppleMusicCurrentlyPlayingResponse>(
        'https://api.music.apple.com/v1/me/player/currently-playing'
      );

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const track = response.data[0];
      return {
        title: track.attributes.name,
        artist: track.attributes.artistName,
        isPlaying: true, // Apple Music API doesn't provide this information
        progress: 0, // Apple Music API doesn't provide this information
        duration: 0, // Apple Music API doesn't provide this information
        imageUrl: track.attributes.artwork.url
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }

  public async play(): Promise<void> {
    try {
      await this.makeRequest('https://api.music.apple.com/v1/me/player/play', 'put');
    } catch (error) {
      console.error('Error playing track:', error);
      throw new Error('Failed to play track on Apple Music');
    }
  }

  public async pause(): Promise<void> {
    try {
      await this.makeRequest('https://api.music.apple.com/v1/me/player/pause', 'put');
    } catch (error) {
      console.error('Error pausing track:', error);
      throw new Error('Failed to pause track on Apple Music');
    }
  }

  public async skip(): Promise<void> {
    try {
      await this.makeRequest('https://api.music.apple.com/v1/me/player/next', 'post');
    } catch (error) {
      console.error('Error skipping track:', error);
      throw new Error('Failed to skip track on Apple Music');
    }
  }
} 