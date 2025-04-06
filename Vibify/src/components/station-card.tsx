import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { SpotifyRecommendation } from '../types/spotify';
import { SpotifyService } from '../lib/spotify-service';

interface StationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  tracks: SpotifyRecommendation[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  spotifyService: SpotifyService;
  lastUpdated?: string;
  nextRefresh?: string;
  friendAttribution?: { [key: string]: string };
}

export function StationCard({
  title,
  description,
  icon,
  gradient,
  tracks,
  isLoading,
  error,
  onRefresh,
  spotifyService,
  lastUpdated,
  nextRefresh,
  friendAttribution
}: StationCardProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Clean up audio element when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const playPreview = (track: SpotifyRecommendation) => {
    // If the same track is already playing, pause it
    if (playingTrackId === track.id && audioElement) {
      audioElement.pause();
      setPlayingTrackId(null);
      return;
    }

    // If a different track is playing, stop it
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    // If the track has a preview URL, play it
    if (track.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.onended = () => setPlayingTrackId(null);
      audio.play();
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  const openInSpotify = async (track: SpotifyRecommendation) => {
    window.open(track.spotifyUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border bg-card p-6 shadow-md ${gradient}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-background/80 p-2 text-primary">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(lastUpdated || nextRefresh) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {lastUpdated && <span>{lastUpdated}</span>}
              {nextRefresh && <span>• Auto refresh in {nextRefresh}</span>}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No tracks available
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/70"
              >
                <div className="h-12 w-12 overflow-hidden rounded-md">
                  <img
                    src={track.albumArt || track.imageUrl}
                    alt={`${track.title} album art`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-medium">{track.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {track.artist}
                  </p>
                  {friendAttribution && friendAttribution[track.id] && (
                    <p className="truncate text-xs text-primary/80">
                      {friendAttribution[track.id]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openInSpotify(track)}
                    className="rounded-full p-2 text-primary transition-colors hover:bg-primary/10"
                    aria-label="Open in Spotify"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
} 