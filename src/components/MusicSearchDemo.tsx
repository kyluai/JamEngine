import { useState } from 'react';
import { AppleMusicService } from '../lib/apple-music-service';
import { SoundCloudService } from '../lib/soundcloud-service';
import { Track } from '../lib/music-service.interface';

const appleMusicService = new AppleMusicService();
const soundCloudService = new SoundCloudService();

export function MusicSearchDemo() {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appleMusicResults, setAppleMusicResults] = useState<Track[]>([]);
  const [soundCloudResults, setSoundCloudResults] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Search both services in parallel
      const [appleMusicTracks, soundCloudTracks] = await Promise.all([
        appleMusicService.getRecommendationsFromText(searchText),
        soundCloudService.getRecommendationsFromText(searchText)
      ]);

      setAppleMusicResults(appleMusicTracks);
      setSoundCloudResults(soundCloudTracks);
    } catch (err) {
      setError('Failed to fetch recommendations. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrackList = (tracks: Track[], serviceName: string) => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">{serviceName} Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <div key={track.externalUrl} className="border rounded-lg p-4">
            <img 
              src={track.imageUrl} 
              alt={track.title}
              className="w-full h-48 object-cover rounded-md mb-2"
            />
            <h4 className="font-medium">{track.title}</h4>
            <p className="text-sm text-gray-600">{track.artist}</p>
            <p className="text-sm text-gray-500">Genre: {track.genre}</p>
            <p className="text-sm text-gray-500">Mood: {track.mood}</p>
            <p className="text-sm text-gray-500">Confidence: {track.confidence}%</p>
            <a 
              href={track.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Listen on {serviceName}
            </a>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Enhanced Music Search Demo</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Try searching with natural language to find music that matches your mood, theme, or activity.
          The search analyzes keywords, genre, theme, and lyrics to provide relevant recommendations.
        </p>
        
        <div className="flex gap-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="e.g., 'happy pop music for a party' or 'sad rock songs about heartbreak'"
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {!isLoading && appleMusicResults.length > 0 && renderTrackList(appleMusicResults, 'Apple Music')}
      {!isLoading && soundCloudResults.length > 0 && renderTrackList(soundCloudResults, 'SoundCloud')}

      {!isLoading && appleMusicResults.length === 0 && soundCloudResults.length === 0 && searchText && (
        <p className="text-gray-500">No results found. Try a different search term.</p>
      )}
    </div>
  );
} 