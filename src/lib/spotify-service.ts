import axios, { AxiosError } from 'axios';
import { MusicService, Track, Recommendation, CurrentTrack } from './music-service.interface';

// Add Vite environment variable types
interface ImportMetaEnv {
  VITE_SPOTIFY_CLIENT_ID: string;
  VITE_SPOTIFY_CLIENT_SECRET: string;
  VITE_SPOTIFY_REDIRECT_URI?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

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
  private readonly REDIRECT_URI: string;
  private readonly SCOPES: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    this.REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
    this.SCOPES = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative';
    
    // Log environment variables (without exposing secrets)
    console.log('Spotify Client ID available:', !!this.CLIENT_ID);
    console.log('Spotify Client Secret available:', !!import.meta.env.VITE_SPOTIFY_CLIENT_SECRET);
    
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
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
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
      });

      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
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
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
      });

      const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      localStorage.setItem('spotify_access_token', this.accessToken);
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      throw new Error('Failed to refresh Spotify token');
    }
  }

  private async makeRequest<T>(url: string, method: 'get' | 'post' = 'get', data?: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await axios.request<T>({
        url,
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.makeRequest(url, method, data);
      }
      throw error;
    }
  }

  public async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await this.makeRequest<SpotifySearchResponse>(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`
      );

      return response.tracks.items.map(track => ({
        title: track.name,
        artist: track.artists[0].name,
        mood: 'general',
        confidence: 0.8,
        tempo: 120,
        genre: 'Unknown',
        description: `Track from ${track.album.name}`,
        previewUrl: track.preview_url || '',
        externalUrl: track.external_urls.spotify,
        imageUrl: track.album.images[0]?.url || ''
      }));
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      throw new Error('Failed to search tracks on Spotify');
    }
  }

  private async getRecommendations(seedTracks: string[], mood: string): Promise<Track[]> {
    try {
      // Validate seed tracks
      if (!seedTracks || seedTracks.length === 0) {
        throw new Error('No seed tracks provided');
      }

      // Ensure we have valid track IDs and limit to 5 seeds
      const validTrackIds = seedTracks.filter(id => id && id.length > 0).slice(0, 5);
      if (validTrackIds.length === 0) {
        throw new Error('No valid track IDs found');
      }

      console.log('Getting recommendations with seed tracks:', validTrackIds);
      console.log('Mood:', mood);

      const energy = this.getEnergyFromMood(mood);
      const valence = this.getValenceFromMood(mood);
      const danceability = this.getDanceabilityFromMood(mood);

      // Create a proper query string instead of using URLSearchParams
      const queryParams = {
        seed_tracks: validTrackIds.join(','),
        limit: 10,
        target_energy: energy,
        target_valence: valence,
        target_danceability: danceability,
        min_popularity: 20 // Lowered from 30 to get more tracks
      };

      console.log('Request parameters:', queryParams);

      // Use the correct URL format for the recommendations endpoint
      const response = await this.makeRequest<SpotifyRecommendationsResponse>(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams(queryParams).toString()}`
      );

      console.log('Recommendations response:', {
        status: response.status,
        tracks: response.tracks?.length
      });

      if (!response.tracks) {
        throw new Error('Invalid response from Spotify API');
      }

      return response.data.tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        previewUrl: track.preview_url || null,
        externalUrl: track.external_urls.spotify,
        imageUrl: track.album.images[0]?.url || ''
      }));
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private getEnergyFromMood(mood: string): number {
    const moodEnergyMap: { [key: string]: number } = {
      'happy': 0.8,
      'sad': 0.3,
      'energetic': 0.9,
      'calm': 0.3,
      'angry': 0.9,
      'romantic': 0.5,
      'nostalgic': 0.4,
      'peaceful': 0.2
    };
    return moodEnergyMap[mood.toLowerCase()] || 0.5;
  }

  private getValenceFromMood(mood: string): number {
    const moodValenceMap: { [key: string]: number } = {
      'happy': 0.8,
      'sad': 0.2,
      'energetic': 0.7,
      'calm': 0.6,
      'angry': 0.3,
      'romantic': 0.7,
      'nostalgic': 0.5,
      'peaceful': 0.7
    };
    return moodValenceMap[mood.toLowerCase()] || 0.5;
  }

  private getDanceabilityFromMood(mood: string): number {
    const moodDanceabilityMap: { [key: string]: number } = {
      'happy': 0.7,
      'sad': 0.3,
      'energetic': 0.8,
      'calm': 0.3,
      'angry': 0.6,
      'romantic': 0.4,
      'nostalgic': 0.5,
      'peaceful': 0.2
    };
    return moodDanceabilityMap[mood.toLowerCase()] || 0.5;
  }

  public async getRecommendationsFromText(text: string): Promise<Recommendation[]> {
    try {
      // First, search for tracks based on the text
      console.log('Searching for tracks based on text:', text);
      const searchResults = await this.searchTracks(text);
      console.log('Found tracks from search:', searchResults.length);
      
      if (searchResults.length === 0) {
        throw new Error('No tracks found matching your description');
      }
      
      // Get track IDs for recommendations (limit to 5 as required by Spotify API)
      const seedTrackIds = searchResults.slice(0, 5).map(track => track.id);
      console.log('Using seed track IDs:', seedTrackIds);
      
      // Detect mood from the text
      const detectedMood = this.determineMood(text);
      console.log('Detected mood:', detectedMood);
      
      // Get recommendations based on the seed tracks
      const recommendations = await this.getRecommendations(seedTrackIds, detectedMood);
      console.log('Got recommendations:', recommendations.length);
      
      // Transform the recommendations into the expected format
      return recommendations.map(track => ({
        title: track.name,
        artist: track.artist,
        mood: detectedMood,
        confidence: 0.8,
        tempo: 120, // Default tempo value
        genre: 'Various',
        description: `A ${detectedMood} song that matches your vibe`,
        previewUrl: track.previewUrl,
        externalUrl: track.externalUrl,
        imageUrl: track.imageUrl
      }));
    } catch (error) {
      console.error('Error in getRecommendationsFromText:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Spotify API error:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data
        });
        
        if (error.response?.status === 401) {
          this.initiateLogin();
          throw new Error('Your session has expired. Please log in again.');
        }
      }
      
      if (error instanceof Error) {
        if (error.message.includes('access token')) {
          this.initiateLogin();
        }
        throw error;
      }
      
      throw new Error('Failed to get recommendations. Please try again.');
    }
  }
  
  private async getSimpleRecommendations(text: string, mood: string): Promise<Recommendation[]> {
    try {
      // Try to search with both text and mood
      console.log('Trying to search with text and mood:', text, mood);
      const searchResults = await this.searchTracks(`${text} ${mood}`);
      
      if (searchResults.length === 0) {
        // If no results, try with just the mood
        console.log('No results with text and mood, trying with just mood:', mood);
        const moodSearchResults = await this.searchTracks(mood);
        
        if (moodSearchResults.length === 0) {
          throw new Error('No tracks found matching your description');
        }
        
        return moodSearchResults.map(track => ({
          title: track.name,
          artist: track.artist,
          mood: mood,
          confidence: 0.7,
          tempo: 120, // Default tempo value
          genre: 'Various',
          description: `A ${mood} song that matches your vibe`,
          previewUrl: track.previewUrl,
          externalUrl: track.externalUrl,
          imageUrl: track.imageUrl
        }));
      }
      
      return searchResults.map(track => ({
        title: track.name,
        artist: track.artist,
        mood: mood,
        confidence: 0.8,
        tempo: 120, // Default tempo value
        genre: 'Various',
        description: `A ${mood} song that matches your vibe`,
        previewUrl: track.previewUrl,
        externalUrl: track.externalUrl,
        imageUrl: track.imageUrl
      }));
    } catch (error) {
      console.error('Error in getSimpleRecommendations:', error);
      throw error;
    }
  }

  private getGenresForMood(mood: string, availableGenres: string[]): string[] {
    const moodGenreMap: { [key: string]: string[] } = {
      'happy': ['pop', 'dance', 'disco', 'funk', 'soul', 'r-n-b'],
      'sad': ['acoustic', 'piano', 'folk', 'indie', 'alternative'],
      'energetic': ['rock', 'metal', 'punk', 'electronic', 'dance'],
      'calm': ['ambient', 'classical', 'jazz', 'chill', 'meditation'],
      'angry': ['metal', 'rock', 'punk', 'grunge', 'industrial'],
      'romantic': ['r-n-b', 'soul', 'jazz', 'pop', 'indie'],
      'nostalgic': ['classic', 'rock', 'pop', 'folk', 'jazz'],
      'peaceful': ['ambient', 'classical', 'meditation', 'chill', 'jazz']
    };

    const defaultGenres = ['pop', 'rock', 'hip-hop', 'electronic', 'dance'];
    const moodGenres = moodGenreMap[mood.toLowerCase()] || defaultGenres;
    
    // Filter to only include available genres
    return moodGenres.filter(genre => availableGenres.includes(genre));
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

  public async getCurrentTrack(): Promise<CurrentTrack | null> {
    try {
      console.log('getCurrentTrack called');
      const token = await this.getAccessToken();
      console.log('Access token obtained for getCurrentTrack');
      
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('getCurrentTrack response status:', response.status);
      
      if (response.status === 204) {
        console.log('No track currently playing (204 status)');
        return null;
      }
      
      const track = response.data.item;
      const isPlaying = response.data.is_playing;
      const progress = response.data.progress_ms;
      const duration = track.duration_ms;
      
      console.log('Track data:', { 
        name: track.name, 
        artist: track.artists[0].name,
        isPlaying,
        progress,
        duration
      });
      
      return {
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || '',
        isPlaying,
        progress,
        duration
      };
    } catch (error) {
      console.error('Error getting current track:', error);
      throw error;
    }
  }
  
  public async pausePlayback(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.put('https://api.spotify.com/v1/me/player/pause', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  }
  
  public async resumePlayback(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.put('https://api.spotify.com/v1/me/player/play', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error resuming playback:', error);
      throw error;
    }
  }
  
  public async skipToNextTrack(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.post('https://api.spotify.com/v1/me/player/next', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  }
  
  public async skipToPreviousTrack(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      await axios.post('https://api.spotify.com/v1/me/player/previous', null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  }
} 