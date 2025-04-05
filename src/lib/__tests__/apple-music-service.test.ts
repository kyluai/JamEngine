import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppleMusicService } from '../apple-music-service';
import axios from 'axios';

vi.mock('axios');

describe('AppleMusicService', () => {
  let service: AppleMusicService;

  beforeEach(() => {
    service = new AppleMusicService();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should check if authenticated', () => {
      localStorage.getItem.mockReturnValueOnce('test_token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      localStorage.getItem.mockReturnValueOnce(null);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should initiate login', () => {
      const url = service.initiateLogin();
      expect(url).toContain('appleid.apple.com');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=music');
    });

    it('should handle callback successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_access_token',
          id_token: 'test_id_token'
        }
      };
      (axios.post as any).mockResolvedValueOnce(mockResponse);

      await service.handleCallback('test_code');

      expect(axios.post).toHaveBeenCalledWith(
        'https://appleid.apple.com/auth/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'apple_music_access_token',
        'test_access_token'
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'apple_music_user_token',
        'test_id_token'
      );
    });
  });

  describe('Recommendations', () => {
    it('should get recommendations from text', async () => {
      const mockSearchResponse = {
        data: {
          data: [
            {
              id: '1',
              attributes: {
                name: 'Test Track',
                artistName: 'Test Artist',
                genreNames: ['Pop'],
                tempo: 120,
                url: 'https://example.com/track',
                artwork: { url: 'https://example.com/artwork' },
                previews: [{ url: 'https://example.com/preview' }]
              }
            }
          ]
        }
      };

      const mockRecommendationResponse = {
        data: {
          data: [
            {
              attributes: {
                name: 'Recommended Track',
                artistName: 'Recommended Artist',
                genreNames: ['Pop'],
                tempo: 120,
                url: 'https://example.com/recommended',
                artwork: { url: 'https://example.com/artwork' },
                previews: [{ url: 'https://example.com/preview' }]
              }
            }
          ]
        }
      };

      (axios.get as any)
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockRecommendationResponse);

      const recommendations = await service.getRecommendationsFromText('happy pop music');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toEqual({
        title: 'Recommended Track',
        artist: 'Recommended Artist',
        mood: 'general',
        confidence: expect.any(Number),
        tempo: 120,
        genre: 'Pop',
        description: expect.any(String),
        previewUrl: 'https://example.com/preview',
        externalUrl: 'https://example.com/recommended',
        imageUrl: expect.any(String)
      });
    });

    it('should handle errors when getting recommendations', async () => {
      (axios.get as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(service.getRecommendationsFromText('test')).rejects.toThrow('API Error');
    });
  });

  describe('Playback Control', () => {
    it('should play track', async () => {
      (axios.put as any).mockResolvedValueOnce({ data: {} });
      await service.play();
      expect(axios.put).toHaveBeenCalledWith(
        'https://api.music.apple.com/v1/me/player/play',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should pause track', async () => {
      (axios.put as any).mockResolvedValueOnce({ data: {} });
      await service.pause();
      expect(axios.put).toHaveBeenCalledWith(
        'https://api.music.apple.com/v1/me/player/pause',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should skip to next track', async () => {
      (axios.post as any).mockResolvedValueOnce({ data: {} });
      await service.skipNext();
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.music.apple.com/v1/me/player/next',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
}); 