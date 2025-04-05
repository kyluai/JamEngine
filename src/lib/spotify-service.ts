import axios from 'axios';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  external_url: string;
  images: any[];
}

export interface SpotifyRecommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
  tempo: number;
  genre: string;
  description: string;
  previewUrl: string | null;
  spotifyUrl: string;
  imageUrl: string;
}

export interface CurrentTrack {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export class SpotifyService {
  private readonly CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  private readonly REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
  private accessToken: string | null = null;

  constructor() {
    // Log environment variables (without exposing secrets)
    console.log('Spotify Client ID available:', !!this.CLIENT_ID);
    console.log('Spotify Client Secret available:', !!this.CLIENT_SECRET);
    
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
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

  public initiateLogin() {
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-top-read',
      'user-read-recently-played',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' ');
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.append('show_dialog', 'true');

    window.location.href = authUrl.toString();
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.REDIRECT_URI,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      const token = response.data.access_token;
      if (!token) {
        throw new Error('No access token received from Spotify');
      }

      this.accessToken = token;
      localStorage.setItem('spotify_access_token', token);
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      // Verify the token is still valid
      const isValid = await this.verifyToken(this.accessToken);
      if (isValid) {
        return this.accessToken;
      }
      // If token is invalid, clear it
      this.accessToken = null;
      localStorage.removeItem('spotify_access_token');
    }

    const savedToken = localStorage.getItem('spotify_access_token');
    if (savedToken) {
      const isValid = await this.verifyToken(savedToken);
      if (isValid) {
        this.accessToken = savedToken;
        return savedToken;
      }
      localStorage.removeItem('spotify_access_token');
    }

    throw new Error('No valid access token available. Please log in again.');
  }

  private async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      console.log('Searching tracks with query:', query);
      
      // Use the search endpoint to find tracks
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: query,
          type: 'track',
          limit: 20,
          market: 'US'
        }
      });
      
      console.log('Search response:', {
        total: response.data.tracks.total,
        items: response.data.tracks.items.length
      });
      
      if (!response.data.tracks || response.data.tracks.items.length === 0) {
        throw new Error('No tracks found matching your description');
      }
      
      // Return all tracks without filtering for preview URLs
      return response.data.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        preview_url: track.preview_url || null,
        external_url: track.external_urls.spotify,
        images: track.album.images
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error searching Spotify tracks:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data
        });
        
        if (error.response?.status === 401) {
          this.initiateLogin();
          throw new Error('Your session has expired. Please log in again.');
        }
      }
      throw error;
    }
  }

  private async getRecommendations(seedTracks: string[], mood: string): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      
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
      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: queryParams
      });

      console.log('Recommendations response:', {
        status: response.status,
        tracks: response.data.tracks?.length
      });

      if (!response.data || !response.data.tracks) {
        throw new Error('Invalid response from Spotify API');
      }

      return response.data.tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        preview_url: track.preview_url || null,
        external_url: track.external_urls.spotify,
        images: track.album.images
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error getting Spotify recommendations:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
          request: {
            url: error.config?.url,
            params: error.config?.params,
            headers: error.config?.headers
          }
        });
        
        if (error.response?.status === 404) {
          // Try with a different approach - search for tracks with the mood
          console.log('404 error, trying with search approach');
          const searchResults = await this.searchTracks(mood);
          
          if (searchResults.length > 0) {
            return searchResults;
          }
          
          throw new Error('Unable to get recommendations. Please try again with a different mood or description.');
        } else if (error.response?.status === 401) {
          this.initiateLogin();
          throw new Error('Your session has expired. Please log in again.');
        } else {
          throw new Error(error.response?.data?.error?.message || 'Failed to get recommendations. Please try again.');
        }
      }
      throw error;
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

  async getRecommendationsFromText(text: string): Promise<SpotifyRecommendation[]> {
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
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        imageUrl: track.images[0]?.url || ''
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
  
  private async getSimpleRecommendations(text: string, mood: string): Promise<SpotifyRecommendation[]> {
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
          previewUrl: track.preview_url,
          spotifyUrl: track.external_url,
          imageUrl: track.images[0]?.url || ''
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
        previewUrl: track.preview_url,
        spotifyUrl: track.external_url,
        imageUrl: track.images[0]?.url || ''
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

  public async getCurrentTrack(): Promise<CurrentTrack> {
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
        throw new Error('No track currently playing');
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