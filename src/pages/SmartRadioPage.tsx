import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService, SpotifyRecommendation, MoodAnalysis } from '../lib/spotify-service';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { About } from '../components/about';

export function SmartRadioPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommendationsReceived = (newRecommendations: SpotifyRecommendation[], analysis: MoodAnalysis | null) => {
    setRecommendations(newRecommendations);
    setError(null);
  };

  const openInSpotify = async () => {
    if (recommendations.length === 0) return;
    
    setIsCreatingPlaylist(true);
    setError(null);
    
    try {
      // Create the playlist and get its ID
      const playlistId = await spotifyService.createPlaylistFromRecommendations(recommendations);
      
      // Open the playlist in Spotify
      window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please make sure you are logged in to Spotify.');
    } finally {
      setIsCreatingPlaylist(false);
    }
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
          <Radio className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Smart Radio / AI DJ</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Let our AI DJ create a personalized radio station based on your mood and preferences.
          Describe what you're in the mood for, and we'll curate a continuous stream of music.
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
          onRecommendationsReceived={handleRecommendationsReceived}
        />
      </motion.div>

      {/* Playlist View */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mt-12 w-full max-w-3xl"
          >
            <div className="rounded-lg bg-background/50 p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Your Personalized Playlist</h2>
                <button
                  onClick={openInSpotify}
                  disabled={isCreatingPlaylist}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPlaylist ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating playlist...</span>
                    </>
                  ) : (
                    <>
                      <span>Open in Spotify</span>
                      <ExternalLink size={16} />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-500/10 text-red-500 rounded-lg">
                  {error}
                </div>
              )}

              {/* Playlist */}
              <div className="mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-muted text-sm text-muted-foreground">
                      <th className="pb-2 text-left font-medium">#</th>
                      <th className="pb-2 text-left font-medium">Title</th>
                      <th className="pb-2 text-left font-medium">Artist</th>
                      <th className="pb-2 text-left font-medium">Album</th>
                      <th className="pb-2 text-right font-medium">
                        <Clock className="h-4 w-4" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((track, index) => (
                      <tr 
                        key={index}
                        className="group border-b border-muted/50 hover:bg-muted/50"
                      >
                        <td className="py-3 text-left">
                          <span>{index + 1}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={track.imageUrl} 
                              alt={`${track.title} album art`} 
                              className="h-10 w-10 rounded"
                            />
                            <span className="font-medium">{track.title}</span>
                          </div>
                        </td>
                        <td className="py-3">{track.artist}</td>
                        <td className="py-3">{track.album}</td>
                        <td className="py-3 text-right">3:30</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-24 w-full">
        <Features />
        <Pricing />
        <About />
      </div>
    </div>
  );
} 