import { MusicService, Track, CurrentTrack } from './music-service.interface';
import jwt from 'jsonwebtoken';

interface AppleMusicTrack {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork: {
      url: string;
    };
    previews: Array<{ url: string }>;
    url: string;
    durationInMillis: number;
  };
}

interface AppleMusicResponse {
  data: AppleMusicTrack[];
}

export class AppleMusicService implements MusicService {
  private readonly TEAM_ID: string;
  private readonly KEY_ID: string;
  private readonly PRIVATE_KEY: string;
  private readonly DEVELOPER_TOKEN: string;
  private userToken: string | null = null;

  constructor() {
    const teamId = import.meta.env.VITE_APPLE_MUSIC_TEAM_ID;
    const keyId = import.meta.env.VITE_APPLE_MUSIC_KEY_ID;
    const privateKey = import.meta.env.VITE_APPLE_MUSIC_PRIVATE_KEY;
    const developerToken = import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;

    if (!teamId || !keyId || !privateKey || !developerToken) {
      throw new Error('Missing required Apple Music configuration');
    }

    this.TEAM_ID = teamId;
    this.KEY_ID = keyId;
    this.PRIVATE_KEY = privateKey;
    this.DEVELOPER_TOKEN = developerToken;

    // Check for existing user token
    this.userToken = localStorage.getItem('apple_music_user_token');
  }

  private generateClientSecret(): string {
    return jwt.sign({}, this.PRIVATE_KEY, {
      algorithm: 'ES256',
      expiresIn: '1h',
      issuer: this.TEAM_ID,
      header: {
        alg: 'ES256',
        kid: this.KEY_ID
      }
    });
  }

  private async fetchAppleMusic<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    if (!this.userToken) {
      throw new Error('Not authenticated with Apple Music');
    }

    try {
      const response = await fetch(`https://api.music.apple.com/v1/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.DEVELOPER_TOKEN}`,
          'Music-User-Token': this.userToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.userToken = null;
          localStorage.removeItem('apple_music_user_token');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Apple Music API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Apple Music API error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.userToken;
  }

  initiateLogin(): string {
    const clientSecret = this.generateClientSecret();
    const params = new URLSearchParams({
      app_id: this.TEAM_ID,
      client_secret: clientSecret,
      redirect_uri: window.location.origin + '/callback',
      response_type: 'code',
      scope: 'user-library-read user-library-modify'
    });

    return `https://authorize.music.apple.com/auth?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<void> {
    try {
      const clientSecret = this.generateClientSecret();
      const response = await fetch('https://authorize.music.apple.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_secret: clientSecret,
          client_id: this.TEAM_ID,
          redirect_uri: window.location.origin + '/callback'
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.userToken = data.access_token;
        localStorage.setItem('apple_music_user_token', this.userToken);
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Error handling Apple Music callback:', error);
      throw new Error('Failed to authenticate with Apple Music');
    }
  }

  private convertAppleMusicTrack(track: AppleMusicTrack): Track {
    return {
      title: track.attributes.name,
      artist: track.attributes.artistName,
      mood: 'general',
      confidence: 0.8,
      tempo: 120,
      genre: 'Unknown',
      description: `Track from ${track.attributes.albumName}`,
      previewUrl: track.attributes.previews[0]?.url || '',
      externalUrl: track.attributes.url,
      imageUrl: track.attributes.artwork.url.replace('{w}x{h}', '300x300')
    };
  }

  async searchTracks(query: string): Promise<Track[]> {
    const response = await this.fetchAppleMusic<AppleMusicResponse>(
      `catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`
    );

    return response.data.map(this.convertAppleMusicTrack);
  }

  async getTopTracks(timeRange: string = 'medium_term', limit: number = 5): Promise<Track[]> {
    const response = await this.fetchAppleMusic<AppleMusicResponse>(
      `me/recent/played/tracks?limit=${limit}`
    );

    return response.data.map(this.convertAppleMusicTrack);
  }

  async getRecommendationsFromText(text: string): Promise<Track[]> {
    try {
      // First get user's recent tracks for better recommendations
      const recentTracks = await this.getTopTracks('medium_term', 3);
      const seedIds = recentTracks.map(track => track.externalUrl.split('/').pop()).filter(Boolean);

      // Extract mood and genre
      const { mood, energy } = this.extractMoodAndEnergy(text);
      const genre = this.determineGenre(text);

      const params = new URLSearchParams({
        ids: seedIds.join(','),
        limit: '10',
        mood,
        genre
      });

      const response = await this.fetchAppleMusic<AppleMusicResponse>(
        `catalog/us/recommendations?${params.toString()}`
      );

      return response.data.map(track => ({
        ...this.convertAppleMusicTrack(track),
        mood,
        confidence: this.calculateConfidence(text, track),
        genre
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations from Apple Music');
    }
  }

  private extractMoodAndEnergy(text: string): { mood: string; energy: number } {
    const moodMap: Record<string, { mood: string; energy: number }> = {
      'happy': { mood: 'upbeat', energy: 0.8 },
      'sad': { mood: 'melancholic', energy: 0.3 },
      'energetic': { mood: 'energetic', energy: 0.9 },
      'calm': { mood: 'relaxing', energy: 0.3 },
      'angry': { mood: 'intense', energy: 0.8 }
    };

    const text_lower = text.toLowerCase();
    for (const [key, value] of Object.entries(moodMap)) {
      if (text_lower.includes(key)) {
        return value;
      }
    }

    return { mood: 'general', energy: 0.5 };
  }

  private determineGenre(text: string): string {
    const genreMap: Record<string, string[]> = {
      'pop': ['pop', 'popular', 'catchy'],
      'rock': ['rock', 'guitar', 'band'],
      'hip-hop': ['hip hop', 'rap', 'beats'],
      'electronic': ['electronic', 'edm', 'dance'],
      'classical': ['classical', 'orchestra', 'symphony'],
      'jazz': ['jazz', 'blues', 'smooth']
    };

    const text_lower = text.toLowerCase();
    for (const [genre, keywords] of Object.entries(genreMap)) {
      if (keywords.some(keyword => text_lower.includes(keyword))) {
        return genre;
      }
    }

    return 'pop';
  }

  private calculateConfidence(text: string, track: AppleMusicTrack): number {
    const keywords = text.toLowerCase().split(' ');
    const trackWords = `${track.attributes.name} ${track.attributes.artistName}`.toLowerCase();
    
    const matchingWords = keywords.filter(word => trackWords.includes(word)).length;
    return Math.min(0.5 + (matchingWords * 0.1), 1.0);
  }

  async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      const response = await this.fetchAppleMusic<{
        data: [{
          attributes: {
            name: string;
            artistName: string;
            artwork: { url: string };
            playParams: { status: string };
            durationInMillis: number;
            playbackDuration: number;
          }
        }]
      }>('me/player/now-playing');

      if (!response.data?.[0]) {
        return null;
      }

      const track = response.data[0].attributes;
      return {
        title: track.name,
        artist: track.artistName,
        isPlaying: track.playParams.status === 'playing',
        progress: track.playbackDuration,
        duration: track.durationInMillis,
        imageUrl: track.artwork.url.replace('{w}x{h}', '300x300')
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }

  async play(): Promise<void> {
    await this.fetchAppleMusic('me/player/play', 'PUT');
  }

  async pause(): Promise<void> {
    await this.fetchAppleMusic('me/player/pause', 'PUT');
  }

  async skip(): Promise<void> {
    await this.fetchAppleMusic('me/player/next', 'POST');
  }
} 