import { MusicService, Track, CurrentTrack } from './music-service.interface';

interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
  };
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
  duration: number;
  genre: string;
  description: string | null;
}

interface SoundCloudResponse {
  collection: SoundCloudTrack[];
}

export class SoundCloudService implements MusicService {
  private readonly CLIENT_ID: string;
  private readonly CLIENT_SECRET: string;
  private readonly REDIRECT_URI: string;
  private accessToken: string | null = null;

  constructor() {
    const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SOUNDCLOUD_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_SOUNDCLOUD_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required SoundCloud configuration');
    }

    this.CLIENT_ID = clientId;
    this.CLIENT_SECRET = clientSecret;
    this.REDIRECT_URI = redirectUri;

    // Check for existing token
    this.accessToken = localStorage.getItem('soundcloud_access_token');
  }

  private async fetchSoundCloud<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with SoundCloud');
    }

    try {
      const response = await fetch(`https://api.soundcloud.com/${endpoint}`, {
        method,
        headers: {
          'Authorization': `OAuth ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.accessToken = null;
          localStorage.removeItem('soundcloud_access_token');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`SoundCloud API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SoundCloud API error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  initiateLogin(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: 'non-expiring'
    });

    return `https://soundcloud.com/connect?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<void> {
    try {
      const response = await fetch('https://api.soundcloud.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          redirect_uri: this.REDIRECT_URI,
          code
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        localStorage.setItem('soundcloud_access_token', this.accessToken);
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Error handling SoundCloud callback:', error);
      throw new Error('Failed to authenticate with SoundCloud');
    }
  }

  private convertSoundCloudTrack(track: SoundCloudTrack): Track {
    return {
      title: track.title,
      artist: track.user.username,
      mood: this.determineMood(track),
      confidence: 0.8,
      tempo: this.estimateTempo(track.duration),
      genre: track.genre || 'Unknown',
      description: track.description || `Track by ${track.user.username}`,
      previewUrl: `${track.stream_url}?client_id=${this.CLIENT_ID}`,
      externalUrl: track.permalink_url,
      imageUrl: track.artwork_url?.replace('-large', '-t500x500') || 'default-artwork.jpg'
    };
  }

  private determineMood(track: SoundCloudTrack): string {
    // Simple mood detection based on genre and description
    const text = `${track.genre} ${track.description || ''}`.toLowerCase();
    
    if (text.includes('happy') || text.includes('upbeat')) return 'happy';
    if (text.includes('sad') || text.includes('melancholy')) return 'sad';
    if (text.includes('energetic') || text.includes('party')) return 'energetic';
    if (text.includes('calm') || text.includes('chill')) return 'calm';
    if (text.includes('angry') || text.includes('intense')) return 'angry';
    
    return 'neutral';
  }

  private estimateTempo(duration: number): number {
    // Simple tempo estimation (this should be replaced with actual BPM detection)
    return Math.floor(Math.random() * (180 - 60) + 60);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const response = await this.fetchSoundCloud<SoundCloudResponse>(
      `tracks?q=${encodeURIComponent(query)}&limit=10`
    );

    return response.collection.map(this.convertSoundCloudTrack.bind(this));
  }

  async getTopTracks(timeRange: string = 'medium_term', limit: number = 5): Promise<Track[]> {
    const response = await this.fetchSoundCloud<SoundCloudResponse>(
      `me/tracks?limit=${limit}`
    );

    return response.collection.map(this.convertSoundCloudTrack.bind(this));
  }

  async getRecommendationsFromText(text: string): Promise<Track[]> {
    try {
      // Extract mood and genre from text
      const { mood, genre } = this.analyzeMoodAndGenre(text);

      // Search for tracks with similar mood and genre
      const params = new URLSearchParams({
        tags: `${mood},${genre}`,
        limit: '10'
      });

      const response = await this.fetchSoundCloud<SoundCloudResponse>(
        `tracks?${params.toString()}`
      );

      return response.collection.map(track => ({
        ...this.convertSoundCloudTrack(track),
        mood,
        confidence: this.calculateConfidence(text, track),
        genre: genre || track.genre || 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations from SoundCloud');
    }
  }

  private analyzeMoodAndGenre(text: string): { mood: string; genre: string } {
    const moodMap: Record<string, string[]> = {
      'happy': ['happy', 'joy', 'upbeat', 'cheerful'],
      'sad': ['sad', 'melancholy', 'depressed', 'heartbreak'],
      'energetic': ['energetic', 'pumped', 'excited', 'party'],
      'calm': ['calm', 'peaceful', 'relaxed', 'chill'],
      'angry': ['angry', 'intense', 'aggressive', 'hard']
    };

    const genreMap: Record<string, string[]> = {
      'pop': ['pop', 'popular', 'catchy'],
      'rock': ['rock', 'guitar', 'band'],
      'hip-hop': ['hip hop', 'rap', 'beats'],
      'electronic': ['electronic', 'edm', 'dance'],
      'classical': ['classical', 'orchestra', 'symphony'],
      'jazz': ['jazz', 'blues', 'smooth']
    };

    const text_lower = text.toLowerCase();
    let detectedMood = 'neutral';
    let detectedGenre = '';

    for (const [mood, keywords] of Object.entries(moodMap)) {
      if (keywords.some(keyword => text_lower.includes(keyword))) {
        detectedMood = mood;
        break;
      }
    }

    for (const [genre, keywords] of Object.entries(genreMap)) {
      if (keywords.some(keyword => text_lower.includes(keyword))) {
        detectedGenre = genre;
        break;
      }
    }

    return { mood: detectedMood, genre: detectedGenre };
  }

  private calculateConfidence(text: string, track: SoundCloudTrack): number {
    const keywords = text.toLowerCase().split(' ');
    const trackWords = `${track.title} ${track.user.username} ${track.genre || ''} ${track.description || ''}`.toLowerCase();
    
    const matchingWords = keywords.filter(word => trackWords.includes(word)).length;
    return Math.min(0.5 + (matchingWords * 0.1), 1.0);
  }

  async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      const response = await this.fetchSoundCloud<{
        title: string;
        user: { username: string };
        artwork_url: string | null;
        duration: number;
        current_position: number;
        is_playing: boolean;
      }>('me/player/current-track');

      if (!response) {
        return null;
      }

      return {
        title: response.title,
        artist: response.user.username,
        isPlaying: response.is_playing,
        progress: response.current_position,
        duration: response.duration,
        imageUrl: response.artwork_url?.replace('-large', '-t500x500') || 'default-artwork.jpg'
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      return null;
    }
  }

  async play(): Promise<void> {
    await this.fetchSoundCloud('me/player/play', 'PUT');
  }

  async pause(): Promise<void> {
    await this.fetchSoundCloud('me/player/pause', 'PUT');
  }

  async skip(): Promise<void> {
    await this.fetchSoundCloud('me/player/next', 'POST');
  }
} 