import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { SpotifyService } from '../lib/spotify-service';
import { StationTabs } from '../components/station-tabs';

export function SmartRadioPage() {
  const [spotifyService] = useState(() => new SpotifyService());

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-16 text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-4">
          <Radio className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Smart Radio</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Discover new music that perfectly matches your current vibe.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-5xl"
      >
        <StationTabs spotifyService={spotifyService} />
      </motion.div>
    </div>
  );
} 