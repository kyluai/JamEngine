import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService, SpotifyRecommendation } from '../lib/spotify-service';

export function SmartRadioPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommendationsReceived = (newRecommendations: SpotifyRecommendation[]) => {
    setRecommendations(newRecommendations);
    setError(null);
  };

  const openInSpotify = async () => {
    if (recommendations.length === 0) return;
    
    setIsCreatingPlaylist(true);
    setError(null);
    
    try {
      const playlistId = await spotifyService.createPlaylistFromRecommendations(recommendations);
      window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please make sure you are logged in to Spotify.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <div className="container mx-auto min-h-screen px-4 py-8 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-8 flex flex-col items-center justify-center gap-4 text-center">
          <Radio className="h-12 w-12 text-primary" />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Smart Radio</h1>
          <p className="max-w-2xl text-base md:text-lg text-muted-foreground">
            Tell us your vibe, and we'll create the perfect playlist for you.
          </p>
        </div>

        <div className="mb-8">
          <PromptInput 
            spotifyService={spotifyService} 
            onRecommendationsReceived={handleRecommendationsReceived}
          />
        </div>

        {/* Playlist View */}
        <AnimatePresence mode="wait">
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg bg-background/50 p-4 md:p-6 shadow-lg backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Your Personalized Playlist</h2>
                <button
                  onClick={openInSpotify}
                  disabled={isCreatingPlaylist}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Playlist Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-muted text-sm text-muted-foreground">
                      <th className="pb-2 text-left font-medium">#</th>
                      <th className="pb-2 text-left font-medium">Title</th>
                      <th className="pb-2 text-left font-medium hidden md:table-cell">Artist</th>
                      <th className="pb-2 text-left font-medium hidden lg:table-cell">Album</th>
                      <th className="pb-2 text-right font-medium">
                        <Clock className="h-4 w-4 inline-block" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((track, index) => (
                      <motion.tr 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group border-b border-muted/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 text-left">
                          <span className="text-muted-foreground">{index + 1}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={track.imageUrl} 
                              alt={`${track.title} album art`} 
                              className="h-10 w-10 rounded shadow-sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium line-clamp-1">{track.title}</span>
                              <span className="text-sm text-muted-foreground md:hidden">{track.artist}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 hidden md:table-cell">{track.artist}</td>
                        <td className="py-3 hidden lg:table-cell">{track.album}</td>
                        <td className="py-3 text-right text-muted-foreground">3:30</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 