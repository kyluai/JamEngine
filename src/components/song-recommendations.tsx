import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';

interface SongRecommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
}

interface SongRecommendationsProps {
  recommendations: SongRecommendation[];
  isLoading: boolean;
}

export function SongRecommendations({ recommendations, isLoading }: SongRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="mt-8 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 w-full max-w-3xl"
    >
      <h2 className="mb-4 text-2xl font-semibold">Recommended Songs</h2>
      <div className="grid gap-4">
        {recommendations.map((song, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <Music2 className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h3 className="font-medium">{song.title}</h3>
              <p className="text-sm text-muted-foreground">{song.artist}</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {song.mood}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(song.confidence * 100)}% match
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 