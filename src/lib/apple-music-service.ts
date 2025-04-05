import axios from 'axios';

export interface AppleMusicTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  images: { url: string }[];
  preview_url: string | null;
  external_url: string;
}

export interface AppleMusicRecommendation {
  title: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string | null;
  appleMusicUrl: string;
  mood: string;
  description: string;
  tempo: number;
  genre: string;
}

export class AppleMusicService {
  private readonly DEVELOPER_TOKEN = import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
  private readonly TEAM_ID = import.meta.env.VITE_APPLE_MUSIC_TEAM_ID;
  private readonly KEY_ID = import.meta.env.VITE_APPLE_MUSIC_KEY_ID;
  private accessToken: string | null = null;

  constructor() {
    console.log('Apple Music Service initialized');
  }

  public async searchTracks(query: string): Promise<AppleMusicTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.music.apple.com/v1/catalog/us/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          term: query,
          types: 'songs',
          limit: 20
        }
      });
      
      if (!response.data.results.songs || response.data.results.songs.data.length === 0) {
        return [];
      }
      
      return response.data.results.songs.data.map((track: any) => ({
        id: track.id,
        name: track.attributes.name,
        artist: track.attributes.artistName,
        album: track.attributes.albumName,
        images: track.attributes.artwork ? [{ url: track.attributes.artwork.url }] : [],
        preview_url: track.attributes.previews?.[0]?.url || null,
        external_url: track.attributes.url
      }));
    } catch (error) {
      console.error('Error searching Apple Music tracks:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Generate JWT token for Apple Music API
    const jwt = this.generateJWT();
    this.accessToken = jwt;
    return jwt;
  }

  private generateJWT(): string {
    // Implementation of JWT generation for Apple Music API
    // This is a placeholder - actual implementation would require proper JWT generation
    return 'placeholder_jwt_token';
  }
} 