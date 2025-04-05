import { SpotifyService } from './spotify-service';
import { AppleMusicService } from './apple-music-service';
import { SoundCloudService } from './soundcloud-service';

export interface UnifiedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  images: { url: string }[];
  preview_url: string | null;
  external_url: string;
  source: 'spotify' | 'apple' | 'soundcloud';
}

export class MusicService {
  private spotifyService: SpotifyService;
  private appleMusicService: AppleMusicService;
  private soundcloudService: SoundCloudService;

  constructor() {
    this.spotifyService = new SpotifyService();
    this.appleMusicService = new AppleMusicService();
    this.soundcloudService = new SoundCloudService();
  }

  public async searchTracks(query: string): Promise<UnifiedTrack[]> {
    try {
      const [spotifyTracks, appleTracks, soundcloudTracks] = await Promise.all([
        this.spotifyService.searchTracks(query),
        this.appleMusicService.searchTracks(query),
        this.soundcloudService.searchTracks(query)
      ]);

      const unifiedTracks: UnifiedTrack[] = [
        ...spotifyTracks.map(track => ({ ...track, source: 'spotify' as const })),
        ...appleTracks.map(track => ({ ...track, source: 'apple' as const })),
        ...soundcloudTracks.map(track => ({ ...track, source: 'soundcloud' as const }))
      ];

      // Shuffle the tracks to mix results from different services
      return this.shuffleArray(unifiedTracks);
    } catch (error) {
      console.error('Error searching tracks across services:', error);
      throw error;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  public async playTrack(track: UnifiedTrack): Promise<void> {
    switch (track.source) {
      case 'spotify':
        // Implement Spotify playback
        break;
      case 'apple':
        // Implement Apple Music playback
        break;
      case 'soundcloud':
        // Implement SoundCloud playback
        break;
    }
  }
} 