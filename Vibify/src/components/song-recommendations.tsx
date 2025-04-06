import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SongRecommendation {
  title: string;
  artist: string;
  mood: string;
  confidence: number;
  tempo: string;
  genre: string;
  description: string;
}

interface SongRecommendationsProps {
  recommendations: SongRecommendation[];
  isLoading: boolean;
}

export function SongRecommendations({ recommendations, isLoading }: SongRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      className="mt-8 space-y-6"
    >
      <h2 className="text-2xl font-semibold">Recommended Songs</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((song, index) => (
          <motion.div
            key={`${song.title}-${song.artist}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold">{song.title}</h3>
            <p className="text-muted-foreground">{song.artist}</p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {song.mood}
              </span>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm text-secondary">
                {song.tempo}
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                {song.genre}
              </span>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{song.description}</p>
            
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-secondary/20">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${song.confidence * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Match confidence: {Math.round(song.confidence * 100)}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 