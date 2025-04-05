import { MusicService } from './music-service.interface';
import { SpotifyService } from './spotify-service';
import { AppleMusicService } from './apple-music-service';
import { SoundCloudService } from './soundcloud-service';

export type ServiceType = 'spotify' | 'apple-music' | 'soundcloud';

export class MusicServiceFactory {
  private static instance: MusicServiceFactory;
  private services: Map<ServiceType, MusicService>;

  private constructor() {
    this.services = new Map();
  }

  public static getInstance(): MusicServiceFactory {
    if (!MusicServiceFactory.instance) {
      MusicServiceFactory.instance = new MusicServiceFactory();
    }
    return MusicServiceFactory.instance;
  }

  public getService(type: ServiceType): MusicService {
    if (!this.services.has(type)) {
      this.services.set(type, this.createService(type));
    }
    return this.services.get(type)!;
  }

  private createService(type: ServiceType): MusicService {
    switch (type) {
      case 'spotify':
        return new SpotifyService();
      case 'apple-music':
        return new AppleMusicService();
      case 'soundcloud':
        return new SoundCloudService();
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  }

  public isServiceEnabled(type: ServiceType): boolean {
    try {
      switch (type) {
        case 'spotify':
          return !!import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        case 'apple-music':
          return !!import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
        case 'soundcloud':
          return !!import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  public getEnabledServices(): ServiceType[] {
    return ['spotify', 'apple-music', 'soundcloud'].filter(
      type => this.isServiceEnabled(type as ServiceType)
    ) as ServiceType[];
  }

  public async searchAllServices(query: string): Promise<Map<ServiceType, any[]>> {
    const results = new Map();
    const enabledServices = this.getEnabledServices();

    await Promise.all(
      enabledServices.map(async (type) => {
        try {
          const service = this.getService(type);
          if (service.isAuthenticated()) {
            const tracks = await service.searchTracks(query);
            results.set(type, tracks);
          }
        } catch (error) {
          console.error(`Error searching ${type}:`, error);
          results.set(type, []);
        }
      })
    );

    return results;
  }

  public async getRecommendationsFromAllServices(text: string): Promise<Map<ServiceType, any[]>> {
    const results = new Map();
    const enabledServices = this.getEnabledServices();

    await Promise.all(
      enabledServices.map(async (type) => {
        try {
          const service = this.getService(type);
          if (service.isAuthenticated()) {
            const recommendations = await service.getRecommendationsFromText(text);
            results.set(type, recommendations);
          }
        } catch (error) {
          console.error(`Error getting recommendations from ${type}:`, error);
          results.set(type, []);
        }
      })
    );

    return results;
  }
} 