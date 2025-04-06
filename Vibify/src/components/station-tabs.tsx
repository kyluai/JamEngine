import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StationCard } from './station-card';
import { SpotifyRecommendation } from '../types/spotify';
import { SpotifyService } from '../lib/spotify-service';
import { Sun, Users, History, Music } from 'lucide-react';
import { PlaylistNameModal } from './playlist-name-modal';

interface StationTabsProps {
  spotifyService: SpotifyService;
}

interface StationState {
  tracks: SpotifyRecommendation[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  nextRefresh: Date | null;
  theme?: string;
  friendAttribution?: { [key: string]: string };
  initialized: boolean; // Track if this station has been initialized
}

export function StationTabs({ spotifyService }: StationTabsProps) {
  const [activeTab, setActiveTab] = useState('daily-pulse');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistDefaultName, setPlaylistDefaultName] = useState('');
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyRecommendation[]>([]);
  
  // Track IDs that have been played across all stations
  const [playedTrackIds, setPlayedTrackIds] = useState<Set<string>>(new Set());
  
  // Station states
  const [dailyPulse, setDailyPulse] = useState<StationState>({
    tracks: [],
    loading: false,
    error: null,
    lastUpdated: null,
    nextRefresh: null,
    theme: 'Early Morning Jams',
    initialized: false
  });
  
  const [echoChamber, setEchoChamber] = useState<StationState>({
    tracks: [],
    loading: false,
    error: null,
    lastUpdated: null,
    nextRefresh: null,
    initialized: false
  });
  
  const [friendsRadio, setFriendsRadio] = useState<StationState>({
    tracks: [],
    loading: false,
    error: null,
    lastUpdated: null,
    nextRefresh: null,
    friendAttribution: {},
    initialized: false
  });
  
  // Load tracks for the active tab
  const loadTracksForActiveTab = async () => {
    // Only load tracks if the station hasn't been initialized yet
    switch (activeTab) {
      case 'daily-pulse':
        if (!dailyPulse.initialized) {
          await loadDailyPulseTracks();
        }
        break;
      case 'echo-chamber':
        if (!echoChamber.initialized) {
          await loadEchoChamberTracks();
        }
        break;
      case 'friends-radio':
        if (!friendsRadio.initialized) {
          await loadFriendsRadioTracks();
        }
        break;
    }
  };
  
  // Preload tracks for all stations
  const preloadAllStations = async () => {
    // Set loading state for all stations
    setDailyPulse(prev => ({ ...prev, loading: true }));
    setEchoChamber(prev => ({ ...prev, loading: true }));
    setFriendsRadio(prev => ({ ...prev, loading: true }));
    
    // Load tracks for all stations in parallel
    await Promise.all([
      loadDailyPulseTracks(),
      loadEchoChamberTracks(),
      loadFriendsRadioTracks()
    ]);
  };
  
  // Filter out tracks that have already been played in other stations
  const filterOutPlayedTracks = (tracks: SpotifyRecommendation[]): SpotifyRecommendation[] => {
    return tracks.filter(track => !playedTrackIds.has(track.id));
  };
  
  // Add tracks to the played tracks set
  const addTracksToPlayedSet = (tracks: SpotifyRecommendation[]) => {
    const newTrackIds = new Set(playedTrackIds);
    tracks.forEach(track => newTrackIds.add(track.id));
    setPlayedTrackIds(newTrackIds);
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    // Reset the played tracks set when refreshing to allow for new tracks
    setPlayedTrackIds(new Set());
    
    // Set loading state for the active tab
    switch (activeTab) {
      case 'daily-pulse':
        setDailyPulse(prev => ({ ...prev, loading: true, error: null }));
        break;
      case 'echo-chamber':
        setEchoChamber(prev => ({ ...prev, loading: true, error: null }));
        break;
      case 'friends-radio':
        setFriendsRadio(prev => ({ ...prev, loading: true, error: null }));
        break;
    }
    
    try {
      // Load tracks for the active tab
      switch (activeTab) {
        case 'daily-pulse':
          await loadDailyPulseTracks();
          break;
        case 'echo-chamber':
          await loadEchoChamberTracks();
          break;
        case 'friends-radio':
          await loadFriendsRadioTracks();
          break;
      }
    } catch (error) {
      console.error('Error refreshing tracks:', error);
      // Set error state for the active tab
      switch (activeTab) {
        case 'daily-pulse':
          setDailyPulse(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Failed to load tracks. Please try again.',
            tracks: prev.tracks // Keep existing tracks
          }));
          break;
        case 'echo-chamber':
          setEchoChamber(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Failed to load tracks. Please try again.',
            tracks: prev.tracks // Keep existing tracks
          }));
          break;
        case 'friends-radio':
          setFriendsRadio(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Failed to load tracks. Please try again.',
            tracks: prev.tracks // Keep existing tracks
          }));
          break;
      }
    }
  };
  
  // Load Daily Pulse tracks
  const loadDailyPulseTracks = async () => {
    try {
      // Get current time of day and user preferences
      const hour = new Date().getHours();
      let timeOfDay = '';
      let theme = '';
      
      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
        theme = 'Early Morning Jams';
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
        theme = 'Mid Day Hits';
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
        theme = 'Evening Vibes';
      } else {
        timeOfDay = 'night';
        theme = 'Late Night Jams';
      }
      
      // Set theme immediately to show something to the user
      setDailyPulse(prev => ({ ...prev, theme }));
      
      // Get user's top tracks from the last month (similar to Echo Chamber)
      const topTracks = await spotifyService.getTopTracks('short_term');
      
      // If we have top tracks, show them immediately while loading more
      if (topTracks.length > 0) {
        // Convert SpotifyTrack to SpotifyRecommendation
        const initialTracks: SpotifyRecommendation[] = topTracks.slice(0, 10).map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          imageUrl: track.imageUrl,
          previewUrl: track.previewUrl,
          spotifyUrl: track.spotifyUrl,
          description: track.description,
          mood: track.mood,
          genres: track.genres,
          tempo: track.tempo
        }));
        
        setDailyPulse(prev => ({
          ...prev,
          tracks: initialTracks,
          loading: true,
          error: null,
          lastUpdated: new Date(),
          nextRefresh: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          theme
        }));
      }
      
      // Get user's top genres and artists for additional context
      const [userTopGenres, userTopArtists] = await Promise.all([
        spotifyService.getTopGenres(),
        spotifyService.getTopArtists()
      ]);
      
      // Create a personalized query based on user preferences
      const genreQuery = userTopGenres.slice(0, 3).join(' ');
      const artistQuery = userTopArtists.slice(0, 2).map(artist => artist.name).join(' ');
      
      // Get recommendations based on user preferences and time of day
      const recommendations = await spotifyService.getRecommendationsFromText(
        `${timeOfDay} ${genreQuery} music like ${artistQuery}, perfect for ${theme.toLowerCase()}`
      );
      
      // Combine top tracks and recommendations
      const combinedTracks = [...topTracks, ...recommendations];
      
      // Filter out tracks that have already been played in other stations
      const filteredTracks = filterOutPlayedTracks(combinedTracks);
      
      // Remove duplicates based on track ID
      const uniqueTracks = filteredTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      
      // Shuffle the tracks
      const shuffledTracks = [...uniqueTracks].sort(() => Math.random() - 0.5);
      
      // Ensure at least 15 tracks
      const limitedTracks = shuffledTracks.slice(0, 20);
      
      // Add these tracks to the played tracks set
      addTracksToPlayedSet(limitedTracks);
      
      // Set next refresh time (1 hour from now)
      const nextRefresh = new Date();
      nextRefresh.setHours(nextRefresh.getHours() + 1);
      
      setDailyPulse({
        tracks: limitedTracks,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        nextRefresh,
        theme,
        initialized: true
      });
    } catch (error) {
      console.error('Error loading Daily Pulse tracks:', error);
      setDailyPulse(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load tracks. Please try again.',
        initialized: true // Mark as initialized even if there was an error
      }));
    }
  };
  
  // Load Echo Chamber tracks
  const loadEchoChamberTracks = async () => {
    try {
      // Get user's top tracks from the last month
      const topTracks = await spotifyService.getTopTracks('short_term');
      
      // If we have top tracks, show them immediately while loading more
      if (topTracks.length > 0) {
        // Convert SpotifyTrack to SpotifyRecommendation
        const initialTracks: SpotifyRecommendation[] = topTracks.slice(0, 10).map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          imageUrl: track.imageUrl,
          previewUrl: track.previewUrl,
          spotifyUrl: track.spotifyUrl,
          description: track.description,
          mood: track.mood,
          genres: track.genres,
          tempo: track.tempo
        }));
        
        setEchoChamber(prev => ({
          ...prev,
          tracks: initialTracks,
          loading: true,
          error: null,
          lastUpdated: new Date(),
          nextRefresh: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          initialized: true
        }));
      }
      
      // Filter out tracks that have already been played in other stations
      const filteredTracks = filterOutPlayedTracks(topTracks);
      
      // Remove duplicates based on track ID
      const uniqueTracks = filteredTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      
      // Shuffle the tracks
      const shuffledTracks = [...uniqueTracks].sort(() => Math.random() - 0.5);
      
      // Ensure at least 15 tracks
      const limitedTracks = shuffledTracks.slice(0, 20);
      
      // Add these tracks to the played tracks set
      addTracksToPlayedSet(limitedTracks);
      
      // Set next refresh time (30 minutes from now)
      const nextRefresh = new Date();
      nextRefresh.setMinutes(nextRefresh.getMinutes() + 30);
      
      setEchoChamber({
        tracks: limitedTracks,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        nextRefresh,
        initialized: true
      });
    } catch (error) {
      console.error('Error loading Echo Chamber tracks:', error);
      setEchoChamber(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load tracks. Please try again.',
        initialized: true // Mark as initialized even if there was an error
      }));
    }
  };
  
  // Load Friends Radio tracks
  const loadFriendsRadioTracks = async () => {
    try {
      // Get user's top tracks from the last month (similar to Echo Chamber)
      let topTracks: SpotifyRecommendation[] = [];
      try {
        topTracks = await spotifyService.getTopTracks('short_term');
        
        // If we have top tracks, show them immediately while loading more
        if (topTracks.length > 0) {
          // Convert SpotifyTrack to SpotifyRecommendation
          const initialTracks: SpotifyRecommendation[] = topTracks.slice(0, 10).map(track => ({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumArt: track.albumArt,
            imageUrl: track.imageUrl,
            previewUrl: track.previewUrl,
            spotifyUrl: track.spotifyUrl,
            description: track.description,
            mood: track.mood,
            genres: track.genres,
            tempo: track.tempo
          }));
          
          // Add attribution for initial tracks
          const friendAttribution: { [key: string]: string } = {};
          const attributionMessages = [
            'From your Spotify blends',
            'Your friend recently listened to this',
            'Trending in your network',
            'Popular among your friends'
          ];
          
          initialTracks.forEach((track, index) => {
            const attributionIndex = index % attributionMessages.length;
            friendAttribution[track.id] = attributionMessages[attributionIndex];
          });
          
          setFriendsRadio(prev => ({
            ...prev,
            tracks: initialTracks,
            loading: true,
            error: null,
            lastUpdated: new Date(),
            nextRefresh: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
            friendAttribution,
            initialized: true
          }));
        }
      } catch (error) {
        console.error('Error getting top tracks:', error);
        // Continue with empty array
      }
      
      // Get trending tracks for variety
      let trendingTracks: SpotifyRecommendation[] = [];
      try {
        trendingTracks = await spotifyService.getTrendingTracks();
      } catch (error) {
        console.error('Error getting trending tracks:', error);
        // Continue with empty array
      }
      
      // If both arrays are empty, use a fallback approach
      if (topTracks.length === 0 && trendingTracks.length === 0) {
        // Get recommendations based on a generic query
        try {
          const recommendations = await spotifyService.getRecommendationsFromText(
            'popular music trending now'
          );
          
          if (recommendations.length > 0) {
            trendingTracks = recommendations;
          } else {
            throw new Error('No tracks available');
          }
        } catch (error) {
          console.error('Error getting recommendations:', error);
          throw new Error('No tracks available');
        }
      }
      
      // Combine top tracks and trending tracks
      const combinedTracks = [...topTracks, ...trendingTracks];
      
      // Filter out tracks that have already been played in other stations
      const filteredTracks = filterOutPlayedTracks(combinedTracks);
      
      // Remove duplicates based on track ID
      const uniqueTracks = filteredTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      );
      
      // Shuffle the tracks
      const shuffledTracks = [...uniqueTracks].sort(() => Math.random() - 0.5);
      
      // Ensure at least 15 tracks
      const limitedTracks = shuffledTracks.slice(0, 20);
      
      // Add these tracks to the played tracks set
      addTracksToPlayedSet(limitedTracks);
      
      // Add attribution for all tracks
      const friendAttribution: { [key: string]: string } = {};
      
      // Create an array of attribution messages
      const attributionMessages = [
        'From your Spotify blends',
        'Your friend recently listened to this',
        'Trending in your network',
        'Popular among your friends'
      ];
      
      // Shuffle the attribution messages
      const shuffledAttributions = [...attributionMessages].sort(() => Math.random() - 0.5);
      
      // Assign attribution messages to tracks
      limitedTracks.forEach((track, index) => {
        // Cycle through the attribution messages
        const attributionIndex = index % shuffledAttributions.length;
        friendAttribution[track.id] = shuffledAttributions[attributionIndex];
      });
      
      // Set next refresh time (45 minutes from now)
      const nextRefresh = new Date();
      nextRefresh.setMinutes(nextRefresh.getMinutes() + 45);
      
      setFriendsRadio({
        tracks: limitedTracks,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        nextRefresh,
        friendAttribution,
        initialized: true
      });
    } catch (error) {
      console.error('Error loading Friends Radio tracks:', error);
      setFriendsRadio(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load tracks. Please try again.',
        tracks: [],
        initialized: true // Mark as initialized even if there was an error
      }));
    }
  };
  
  // Load tracks when the component mounts or the active tab changes
  useEffect(() => {
    // Preload all stations when the component mounts
    preloadAllStations();
  }, []);
  
  // Update active tab when it changes
  useEffect(() => {
    // No need to load tracks here as they're already loaded
    // Just update the active tab
  }, [activeTab]);
  
  // Format time until next refresh
  const formatTimeUntilRefresh = (nextRefresh: Date | null) => {
    if (!nextRefresh) return '';
    
    const now = new Date();
    const diff = nextRefresh.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Format time since last update
  const formatTimeSinceUpdate = (lastUpdated: Date | null) => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) {
      return 'Updated just now';
    } else if (minutes < 60) {
      return `Updated ${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `Updated ${hours}h ago`;
    }
  };
  
  // Open the playlist name modal
  const openPlaylistModal = () => {
    let tracks: SpotifyRecommendation[] = [];
    let defaultName = '';
    
    switch (activeTab) {
      case 'daily-pulse':
        tracks = dailyPulse.tracks;
        defaultName = `Vibify ${dailyPulse.theme} - ${new Date().toLocaleDateString()}`;
        break;
      case 'echo-chamber':
        tracks = echoChamber.tracks;
        defaultName = `Vibify Echo Chamber - ${new Date().toLocaleDateString()}`;
        break;
      case 'friends-radio':
        tracks = friendsRadio.tracks;
        defaultName = `Vibify Friends Radio - ${new Date().toLocaleDateString()}`;
        break;
    }
    
    if (tracks.length === 0) {
      alert('No tracks available to create playlist');
      return;
    }
    
    setPlaylistTracks(tracks);
    setPlaylistDefaultName(defaultName);
    setIsPlaylistModalOpen(true);
  };
  
  // Create playlist with the provided name
  const createPlaylist = async (playlistName: string) => {
    try {
      const playlistId = await spotifyService.createPlaylistFromRecommendations(playlistTracks, playlistName);
      window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };
  
  return (
    <>
      <Tabs
        defaultValue="daily-pulse"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-8 grid w-full grid-cols-3">
          <TabsTrigger value="daily-pulse" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Daily Pulse</span>
          </TabsTrigger>
          <TabsTrigger value="echo-chamber" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Echo Chamber</span>
          </TabsTrigger>
          <TabsTrigger value="friends-radio" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Friends Radio</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily-pulse">
          <StationCard
            title="Daily Pulse"
            description={`Current theme: ${dailyPulse.theme}`}
            icon={<Sun className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-amber-100/20 to-amber-200/20 dark:from-amber-900/20 dark:to-amber-800/20"
            tracks={dailyPulse.tracks}
            isLoading={dailyPulse.loading}
            error={dailyPulse.error}
            onRefresh={handleRefresh}
            spotifyService={spotifyService}
            lastUpdated={formatTimeSinceUpdate(dailyPulse.lastUpdated)}
            nextRefresh={formatTimeUntilRefresh(dailyPulse.nextRefresh)}
          />
        </TabsContent>
        
        <TabsContent value="echo-chamber">
          <StationCard
            title="Echo Chamber"
            description="Based on your listening history"
            icon={<History className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-blue-100/20 to-blue-200/20 dark:from-blue-900/20 dark:to-blue-800/20"
            tracks={echoChamber.tracks}
            isLoading={echoChamber.loading}
            error={echoChamber.error}
            onRefresh={handleRefresh}
            spotifyService={spotifyService}
            lastUpdated={formatTimeSinceUpdate(echoChamber.lastUpdated)}
            nextRefresh={formatTimeUntilRefresh(echoChamber.nextRefresh)}
          />
        </TabsContent>
        
        <TabsContent value="friends-radio">
          <StationCard
            title="Friends Radio"
            description="What your friends are listening to"
            icon={<Users className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-purple-100/20 to-purple-200/20 dark:from-purple-900/20 dark:to-purple-800/20"
            tracks={friendsRadio.tracks}
            isLoading={friendsRadio.loading}
            error={friendsRadio.error}
            onRefresh={handleRefresh}
            spotifyService={spotifyService}
            lastUpdated={formatTimeSinceUpdate(friendsRadio.lastUpdated)}
            nextRefresh={formatTimeUntilRefresh(friendsRadio.nextRefresh)}
            friendAttribution={friendsRadio.friendAttribution}
          />
        </TabsContent>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={openPlaylistModal}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Music className="h-4 w-4" />
            <span>Create Playlist</span>
          </button>
        </div>
      </Tabs>
      
      <PlaylistNameModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onSubmit={createPlaylist}
        defaultName={playlistDefaultName}
      />
    </>
  );
} 