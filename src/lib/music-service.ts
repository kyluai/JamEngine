import { SpotifyService } from './spotify-service';

export interface UnifiedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  images: { url: string }[];
  preview_url: string | null;
  external_url: string;
  source: 'spotify';
}

export class MusicService {
  private spotifyService: SpotifyService;

  constructor() {
    this.spotifyService = new SpotifyService();
  }

  public async searchTracks(query: string): Promise<UnifiedTrack[]> {
    try {
      const spotifyTracks = await this.spotifyService.searchTracks(query);

      const unifiedTracks: UnifiedTrack[] = spotifyTracks.map(track => ({ 
        ...track, 
        source: 'spotify' as const 
      }));

      return unifiedTracks;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  public async playTrack(track: UnifiedTrack): Promise<void> {
    if (track.source === 'spotify') {
      // Implement Spotify playback
    }
  }
} 