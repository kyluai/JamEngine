import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SpotifyService, SpotifyRecommendation } from '../lib/spotify-service';

interface PromptInputProps {
  spotifyService: SpotifyService;
  onMoodDetected?: (mood: string) => void;
}

export function PromptInput({ spotifyService, onMoodDetected }: PromptInputProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      // Get recommendations which will also detect the mood internally
      const results = await spotifyService.getRecommendationsFromText(inputText);
      
      // Extract the mood from the first recommendation if available
      if (results.length > 0 && onMoodDetected) {
        onMoodDetected(results[0].mood);
      }
      
      setRecommendations(results);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your mood or situation..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={4}
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">Recommended Songs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((song, index) => (
              <div
                key={index}
                className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
              >
                <img
                  src={song.imageUrl}
                  alt={`${song.title} by ${song.artist}`}
                  className="mb-4 aspect-square w-full rounded-md object-cover"
                />
                <h3 className="font-semibold">{song.title}</h3>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Mood:</span> {song.mood}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {song.description}
                </p>
                <div className="mt-4 space-y-2">
                  {song.previewUrl && (
                    <audio controls className="w-full">
                      <source src={song.previewUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  <a
                    href={song.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Open in Spotify
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}