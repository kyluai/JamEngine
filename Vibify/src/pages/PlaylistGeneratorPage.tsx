import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListMusic, ExternalLink, Loader2, Clock, Edit2, Check, X } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService } from '../lib/spotify-service';
import { SpotifyRecommendation } from '../types/spotify';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { About } from '../components/about';

export function PlaylistGeneratorPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [recommendations, setRecommendations] = useState<SpotifyRecommendation[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);
  const [playlistName, setPlaylistName] = useState<string>('My Vibify Playlist');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempPlaylistName, setTempPlaylistName] = useState<string>('');

  const handleMoodDetected = (mood: string) => {
    console.log('Mood detected in PlaylistGeneratorPage:', mood);
    setCurrentMood(mood);
    // Update playlist name based on mood
    if (mood) {
      setPlaylistName(`${mood} Vibes - ${new Date().toLocaleDateString()}`);
    }
  };

  const handleRecommendationsReceived = (newRecommendations: SpotifyRecommendation[]) => {
    setRecommendations(newRecommendations);
    setError(null);
  };

  const startEditingName = () => {
    setTempPlaylistName(playlistName);
    setIsEditingName(true);
  };

  const savePlaylistName = () => {
    if (tempPlaylistName.trim()) {
      setPlaylistName(tempPlaylistName);
    }
    setIsEditingName(false);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
  };

  const openInSpotify = async () => {
    if (recommendations.length === 0) return;
    
    setIsCreatingPlaylist(true);
    setError(null);
    
    try {
      const playlistId = await spotifyService.createPlaylistFromRecommendations(recommendations, playlistName);
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
        className="mt-16 text-center"
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
        className="mt-8 w-full max-w-3xl"
      >
        <PromptInput 
          spotifyService={spotifyService} 
          onMoodDetected={handleMoodDetected}
          onRecommendationsReceived={handleRecommendationsReceived}
        />
      </motion.div>

      {/* Playlist View */}
      <AnimatePresence mode="wait">
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mt-8 w-full max-w-4xl rounded-lg bg-background/50 p-4 md:p-6 shadow-lg backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Your Personalized Playlist</h2>
                {!isEditingName ? (
                  <button 
                    onClick={startEditingName}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Edit playlist name"
                  >
                    <Edit2 size={16} className="text-muted-foreground" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempPlaylistName}
                      onChange={(e) => setTempPlaylistName(e.target.value)}
                      className="px-2 py-1 rounded border border-muted bg-background text-foreground"
                      autoFocus
                    />
                    <button 
                      onClick={savePlaylistName}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      title="Save playlist name"
                    >
                      <Check size={16} className="text-green-500" />
                    </button>
                    <button 
                      onClick={cancelEditingName}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      title="Cancel editing"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  Playlist name: <span className="font-medium text-foreground">{playlistName}</span>
                </div>
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

      <div className="mt-24 w-full">
        <Features />
        <Pricing />
        <About />
      </div>
    </div>
  );
} 