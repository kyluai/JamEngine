import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundCloudService } from '../soundcloud-service';
import axios from 'axios';

vi.mock('axios');

describe('SoundCloudService', () => {
  let service: SoundCloudService;

  beforeEach(() => {
    service = new SoundCloudService();
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
      expect(url).toContain('soundcloud.com');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=non-expiring');
    });

    it('should handle callback successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'test_access_token'
        }
      };
      (axios.post as any).mockResolvedValueOnce(mockResponse);

      await service.handleCallback('test_code');

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.soundcloud.com/oauth2/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'soundcloud_access_token',
        'test_access_token'
      );
    });
  });

  describe('Recommendations', () => {
    it('should get recommendations from text', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            title: 'Test Track',
            user: { username: 'Test Artist' },
            genre: 'Pop',
            description: 'Test description',
            permalink_url: 'https://example.com/track',
            artwork_url: 'https://example.com/artwork',
            stream_url: 'https://example.com/stream'
          }
        ]
      };

      (axios.get as any).mockResolvedValueOnce(mockResponse);

      const recommendations = await service.getRecommendationsFromText('happy pop music');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toEqual({
        title: 'Test Track',
        artist: 'Test Artist',
        mood: 'general',
        confidence: expect.any(Number),
        tempo: expect.any(Number),
        genre: 'Pop',
        description: 'Test description',
        previewUrl: 'https://example.com/stream',
        externalUrl: 'https://example.com/track',
        imageUrl: 'https://example.com/artwork'
      });
    });

    it('should handle errors when getting recommendations', async () => {
      (axios.get as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(service.getRecommendationsFromText('test')).rejects.toThrow('API Error');
    });
  });

  describe('Text Analysis', () => {
    it('should extract keywords from text', () => {
      const keywords = service['extractKeywords']('happy pop music for a party');
      expect(keywords).toEqual(['happy', 'pop', 'music', 'party']);
    });

    it('should determine genre from text', () => {
      const genre = service['determineGenre']('rock guitar solo band');
      expect(genre).toBe('rock');
    });

    it('should extract theme from text', () => {
      const theme = service['extractTheme']('love heart romance relationship');
      expect(theme).toBe('love');
    });
  });
}); 