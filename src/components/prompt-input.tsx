import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Input } from './ui/input';
import { AIService } from '../lib/ai-service';
import { SongRecommendations } from './song-recommendations';

interface SongRecommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
}

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState<SongRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const aiService = new AIService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const songs = await aiService.getSongRecommendations(prompt);
      setRecommendations(songs);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your vibe... (e.g., 'Chilling in a dark library with a candle lit')"
            className="pr-12"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-primary hover:bg-primary/10"
            type="submit"
            disabled={isLoading}
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        </div>
      </form>
      <SongRecommendations recommendations={recommendations} isLoading={isLoading} />
    </div>
  );
}