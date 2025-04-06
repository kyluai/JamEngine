import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { SpotifyService } from '../lib/spotify-service';

interface NowPlayingProps {
  spotifyService: SpotifyService;
  promptMood?: string;
}

interface TrackInfo {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export function NowPlaying({ spotifyService, promptMood }: NowPlayingProps) {
  console.log('NowPlaying component rendered with mood:', promptMood);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    console.log('NowPlaying useEffect triggered');
    const fetchNowPlaying = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching current track...');
        const currentTrack = await spotifyService.getCurrentTrack();
        console.log('Current track fetched:', currentTrack);
        setTrackInfo(currentTrack);
        setError(null);
      } catch (err) {
        console.error('Error fetching now playing:', err);
        setError('Could not fetch current track');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [spotifyService]);

  const getMoodColor = () => {
    if (!promptMood) return 'from-primary/20 to-primary/40';
    
    const moodColors: Record<string, string> = {
      'happy': 'from-yellow-400/20 to-yellow-600/40',
      'sad': 'from-blue-400/20 to-blue-600/40',
      'energetic': 'from-red-400/20 to-red-600/40',
      'calm': 'from-green-400/20 to-green-600/40',
      'angry': 'from-red-500/20 to-red-700/40',
      'romantic': 'from-pink-400/20 to-pink-600/40',
      'nostalgic': 'from-purple-400/20 to-purple-600/40',
      'peaceful': 'from-teal-400/20 to-teal-600/40',
      'neutral': 'from-primary/20 to-primary/40'
    };
    
    return moodColors[promptMood] || 'from-primary/20 to-primary/40';
  };

  const togglePlayback = async () => {
    if (!trackInfo) return;
    
    try {
      if (trackInfo.isPlaying) {
        await spotifyService.pausePlayback();
      } else {
        await spotifyService.resumePlayback();
      }
      
      setTrackInfo(prev => prev ? { ...prev, isPlaying: !prev.isPlaying } : null);
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };

  const skipTrack = async (direction: 'next' | 'previous') => {
    try {
      if (direction === 'next') {
        await spotifyService.skipToNextTrack();
      } else {
        await spotifyService.skipToPreviousTrack();
      }
      
      // Fetch the new track after skipping
      const currentTrack = await spotifyService.getCurrentTrack();
      setTrackInfo(currentTrack);
    } catch (err) {
      console.error(`Error skipping ${direction} track:`, err);
    }
  };

  if (isLoading) {
    console.log('NowPlaying is loading');
    return (
      <div className="fixed bottom-4 right-4 rounded-lg border border-muted bg-background/80 p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trackInfo) {
    console.log('NowPlaying error or no track info:', error);
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-4 right-4 overflow-hidden rounded-lg border border-muted bg-gradient-to-br ${getMoodColor()} backdrop-blur-lg transition-all duration-500 ${isExpanded ? 'w-80' : 'w-64'}`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div 
              className="relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-md"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <img 
                src={trackInfo.imageUrl} 
                alt={`${trackInfo.album} album art`} 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Music2 className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{trackInfo.name}</h3>
              <p className="truncate text-sm text-muted-foreground">{trackInfo.artist}</p>
              {isExpanded && (
                <p className="mt-1 truncate text-xs text-muted-foreground">{trackInfo.album}</p>
              )}
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-2">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full rounded-full bg-primary" 
                  style={{ width: `${(trackInfo.progress / trackInfo.duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(trackInfo.progress)}</span>
                <span>{formatTime(trackInfo.duration)}</span>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <button 
              onClick={() => skipTrack('previous')}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button 
              onClick={togglePlayback}
              className="rounded-full bg-primary p-2 text-primary-foreground transition-transform hover:scale-105"
            >
              {trackInfo.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            
            <button 
              onClick={() => skipTrack('next')}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 