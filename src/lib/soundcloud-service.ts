import axios from 'axios';

export interface SoundCloudTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  images: { url: string }[];
  preview_url: string | null;
  external_url: string;
}

export interface SoundCloudRecommendation {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string | null;
  soundcloudUrl: string;
  mood: string;
  description: string;
  tempo: number;
  genre: string;
}

export class SoundCloudService {
  private readonly CLIENT_ID = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
  private readonly CLIENT_SECRET = import.meta.env.VITE_SOUNDCLOUD_CLIENT_SECRET;
  private accessToken: string | null = null;

  constructor() {
    console.log('SoundCloud Service initialized');
  }

  public async searchTracks(query: string): Promise<SoundCloudTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.soundcloud.com/tracks', {
        headers: {
          'Authorization': `OAuth ${token}`
        },
        params: {
          q: query,
          limit: 20,
          client_id: this.CLIENT_ID
        }
      });
      
      if (!response.data || response.data.length === 0) {
        return [];
      }
      
      return response.data.map((track: any) => ({
        id: track.id.toString(),
        name: track.title,
        artist: track.user.username,
        album: track.title, // SoundCloud doesn't have albums
        images: track.artwork_url ? [{ url: track.artwork_url }] : [],
        preview_url: track.stream_url || null,
        external_url: track.permalink_url
      }));
    } catch (error) {
      console.error('Error searching SoundCloud tracks:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.soundcloud.com/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting SoundCloud access token:', error);
      throw error;
    }
  }
} 