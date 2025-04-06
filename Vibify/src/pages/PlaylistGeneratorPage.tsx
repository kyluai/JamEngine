import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListMusic } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService } from '../lib/spotify-service';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { About } from '../components/about';

export function PlaylistGeneratorPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);

  const handleMoodDetected = (mood: string) => {
    console.log('Mood detected in PlaylistGeneratorPage:', mood);
    setCurrentMood(mood);
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-32 text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-4">
          <ListMusic className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Playlist Generator</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Create custom playlists for any occasion or activity. Describe the vibe you want,
          and we'll generate a playlist that perfectly matches your needs.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-3xl"
      >
        <PromptInput 
          spotifyService={spotifyService} 
          onMoodDetected={handleMoodDetected}
        />
      </motion.div>

      <div className="mt-24 w-full">
        <Features />
        <Pricing />
        <About />
      </div>
    </div>
  );
} 