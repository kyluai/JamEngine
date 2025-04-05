import axios, { AxiosError } from 'axios';
import { MusicService, Track, Recommendation, CurrentTrack } from './music-service.interface';

// Add Vite environment variable types
interface ImportMetaEnv {
  VITE_SOUNDCLOUD_CLIENT_ID: string;
  VITE_SOUNDCLOUD_CLIENT_SECRET: string;
  VITE_SOUNDCLOUD_REDIRECT_URI: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
  };
  genre: string;
  tag_list: string;
  description: string;
  duration: number;
  stream_url: string;
  permalink_url: string;
  artwork_url: string;
  lyrics?: string;
}

export class SoundCloudService implements MusicService {
  private readonly CLIENT_ID = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
  private readonly CLIENT_SECRET = import.meta.env.VITE_SOUNDCLOUD_CLIENT_SECRET;
  private readonly REDIRECT_URI = import.meta.env.VITE_SOUNDCLOUD_REDIRECT_URI || 'http://localhost:3000/callback';
  private accessToken: string | null = null;

  constructor() {
    console.log('SoundCloud Client ID available:', !!this.CLIENT_ID);
    console.log('SoundCloud Client Secret available:', !!this.CLIENT_SECRET);
    
    const savedToken = localStorage.getItem('soundcloud_access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public initiateLogin(): void {
    const authUrl = new URL('https://soundcloud.com/connect');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'non-expiring');
    authUrl.searchParams.append('display', 'popup');

    window.location.href = authUrl.toString();
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const response = await axios.post('https://api.soundcloud.com/oauth2/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          redirect_uri: this.REDIRECT_URI
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      this.accessToken = response.data.access_token;
      localStorage.setItem('soundcloud_access_token', this.accessToken);
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private handleAxiosError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('SoundCloud API error:', {
        status: axiosError.response?.status,
        message: axiosError.response?.data?.error?.message || axiosError.message,
        details: axiosError.response?.data,
        request: {
          url: axiosError.config?.url,
          params: axiosError.config?.params,
          headers: axiosError.config?.headers
        }
      });

      if (axiosError.response?.status === 401) {
        this.initiateLogin();
        throw new Error('Your session has expired. Please log in again.');
      }

      throw new Error(axiosError.response?.data?.error?.message || 'Failed to complete the request. Please try again.');
    }

    throw error;
  }

  public async searchTracks(query: string): Promise<Track[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with SoundCloud');
    }

    try {
      const response = await axios.get('https://api.soundcloud.com/tracks', {
        headers: {
          'Authorization': `OAuth ${this.accessToken}`
        },
        params: {
          q: query,
          limit: 20,
          filter: 'streamable',
          license: 'cc-by-sa'
        }
      });

      return response.data.map((track: SoundCloudTrack) => ({
        id: track.id.toString(),
        name: track.title,
        artist: track.user.username,
        album: '', // SoundCloud doesn't have albums
        previewUrl: track.stream_url,
        externalUrl: track.permalink_url,
        imageUrl: track.artwork_url?.replace('-large', '-t500x500') || ''
      }));
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  public async getRecommendationsFromText(text: string): Promise<Recommendation[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with SoundCloud');
    }

    try {
      // Extract keywords, genre, theme, and lyrics from text
      const { keywords, genre, theme } = this.analyzeText(text);
      
      // Search for tracks with the extracted information
      const response = await axios.get('https://api.soundcloud.com/tracks', {
        headers: {
          'Authorization': `OAuth ${this.accessToken}`
        },
        params: {
          q: keywords.join(' '),
          genres: genre,
          tags: theme,
          limit: 10,
          filter: 'streamable',
          license: 'cc-by-sa'
        }
      });

      return response.data.map((track: SoundCloudTrack) => ({
        title: track.title,
        artist: track.user.username,
        mood: this.determineMood(text),
        confidence: this.calculateConfidence(track, keywords, genre, theme),
        tempo: this.estimateTempo(track),
        genre: track.genre || 'Various',
        description: this.generateDescription(track, theme),
        previewUrl: track.stream_url,
        externalUrl: track.permalink_url,
        imageUrl: track.artwork_url?.replace('-large', '-t500x500') || ''
      }));
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private analyzeText(text: string): { keywords: string[], genre: string, theme: string } {
    // Extract keywords using NLP techniques
    const keywords = this.extractKeywords(text);
    
    // Determine genre based on keywords and text analysis
    const genre = this.determineGenre(text);
    
    // Extract theme from text
    const theme = this.extractTheme(text);
    
    return { keywords, genre, theme };
  }

  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => !commonWords.has(word) && word.length > 2);
  }

  private determineGenre(text: string): string {
    const genreKeywords: { [key: string]: string[] } = {
      'rock': ['rock', 'guitar', 'band', 'drums', 'electric'],
      'pop': ['pop', 'catchy', 'radio', 'hit', 'sing'],
      'hiphop': ['hip', 'hop', 'rap', 'beats', 'rhyme'],
      'electronic': ['electronic', 'dance', 'edm', 'techno', 'house'],
      'jazz': ['jazz', 'saxophone', 'improvisation', 'swing'],
      'classical': ['classical', 'orchestra', 'symphony', 'piano', 'violin'],
      'folk': ['folk', 'acoustic', 'guitar', 'traditional'],
      'r&b': ['r&b', 'soul', 'blues', 'groove']
    };

    const words = text.toLowerCase().split(/\s+/);
    let maxMatches = 0;
    let detectedGenre = 'Various';

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      const matches = words.filter(word => keywords.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedGenre = genre;
      }
    }

    return detectedGenre;
  }

  private extractTheme(text: string): string {
    const themeKeywords: { [key: string]: string[] } = {
      'love': ['love', 'heart', 'romance', 'relationship', 'together'],
      'party': ['party', 'dance', 'celebration', 'fun', 'night'],
      'sad': ['sad', 'heartbreak', 'lonely', 'miss', 'cry'],
      'motivational': ['motivation', 'inspire', 'success', 'dream', 'goal'],
      'nature': ['nature', 'peace', 'calm', 'ocean', 'mountain'],
      'adventure': ['adventure', 'travel', 'explore', 'journey', 'discover']
    };

    const words = text.toLowerCase().split(/\s+/);
    let maxMatches = 0;
    let detectedTheme = 'general';

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matches = words.filter(word => keywords.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedTheme = theme;
      }
    }

    return detectedTheme;
  }

  private determineMood(text: string): string {
    const moodKeywords: { [key: string]: string[] } = {
      'happy': ['happy', 'joy', 'excited', 'cheerful', 'upbeat'],
      'sad': ['sad', 'depressed', 'down', 'melancholy', 'blue'],
      'energetic': ['energetic', 'pumped', 'excited', 'energized', 'powerful'],
      'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil'],
      'angry': ['angry', 'frustrated', 'mad', 'upset', 'annoyed'],
      'romantic': ['romantic', 'love', 'passionate', 'intimate', 'romance'],
      'nostalgic': ['nostalgic', 'memories', 'remember', 'past', 'old'],
      'peaceful': ['peaceful', 'quiet', 'serene', 'tranquil', 'calm']
    };

    const words = text.toLowerCase().split(/\s+/);
    let maxMatches = 0;
    let detectedMood = 'neutral';

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      const matches = words.filter(word => keywords.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedMood = mood;
      }
    }

    return detectedMood;
  }

  private calculateConfidence(track: SoundCloudTrack, keywords: string[], genre: string, theme: string): number {
    let confidence = 0.5; // Base confidence

    // Check genre match
    if (track.genre?.toLowerCase() === genre.toLowerCase()) {
      confidence += 0.2;
    }

    // Check tag matches
    const tags = track.tag_list.toLowerCase().split(' ');
    const matchingTags = tags.filter(tag => 
      keywords.some(keyword => tag.includes(keyword)) ||
      tag.includes(theme)
    );
    confidence += (matchingTags.length / tags.length) * 0.3;

    return Math.min(confidence, 1.0);
  }

  private estimateTempo(track: SoundCloudTrack): number {
    // This is a simplified estimation. In a real implementation,
    // you would use audio analysis or metadata
    return 120; // Default tempo
  }

  private generateDescription(track: SoundCloudTrack, theme: string): string {
    const descriptions: { [key: string]: string } = {
      'love': 'A romantic track perfect for those special moments',
      'party': 'An energetic track to get the party started',
      'sad': 'A melancholic track for reflective moments',
      'motivational': 'An inspiring track to boost your motivation',
      'nature': 'A peaceful track that connects with nature',
      'adventure': 'An exciting track for your next adventure'
    };

    return descriptions[theme] || 'A track that matches your vibe';
  }

  public async getCurrentTrack(): Promise<CurrentTrack | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with SoundCloud');
    }

    try {
      const response = await axios.get('https://api.soundcloud.com/me/activities', {
        headers: {
          'Authorization': `OAuth ${this.accessToken}`
        },
        params: {
          limit: 1
        }
      });

      if (!response.data.collection || response.data.collection.length === 0) {
        return null;
      }

      const activity = response.data.collection[0];
      if (activity.type !== 'track') {
        return null;
      }

      const track = activity.origin;
      return {
        name: track.title,
        artist: track.user.username,
        album: '', // SoundCloud doesn't have albums
        imageUrl: track.artwork_url?.replace('-large', '-t500x500') || '',
        isPlaying: false, // SoundCloud doesn't provide this information
        progress: 0,
        duration: track.duration
      };
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  public async pausePlayback(): Promise<void> {
    // SoundCloud doesn't provide direct playback control through their API
    throw new Error('Playback control not supported by SoundCloud API');
  }

  public async resumePlayback(): Promise<void> {
    // SoundCloud doesn't provide direct playback control through their API
    throw new Error('Playback control not supported by SoundCloud API');
  }

  public async skipToNextTrack(): Promise<void> {
    // SoundCloud doesn't provide direct playback control through their API
    throw new Error('Playback control not supported by SoundCloud API');
  }

  public async skipToPreviousTrack(): Promise<void> {
    // SoundCloud doesn't provide direct playback control through their API
    throw new Error('Playback control not supported by SoundCloud API');
  }
} 