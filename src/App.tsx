import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { Navbar } from './components/navbar';
import { PromptInput } from './components/prompt-input';
import { Features } from './components/features';
import { Pricing } from './components/pricing';
import { About } from './components/about';
import { LoginModal } from './components/login-modal';
import { NowPlaying } from './components/now-playing';
import { SpotifyService } from './lib/spotify-service';
import { HomePage } from './pages/HomePage';
import { SmartRadioPage } from './pages/SmartRadioPage';
import { SongGeneratorPage } from './pages/SongGeneratorPage';
import { PlaylistGeneratorPage } from './pages/PlaylistGeneratorPage';
import { PictureToSongPage } from './pages/PictureToSongPage';
import { DaylistPage } from './pages/DaylistPage';
import type { Recommendation } from './lib/music-service.interface';
import { MusicSearchDemo } from './components/MusicSearchDemo';
import './App.css';

function App() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [text, setText] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system theme if no preference is saved
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme('system');
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      if (currentTheme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Listen for theme changes from localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as 'light' | 'dark' | 'system' | null;
        if (newTheme) {
          setTheme(newTheme);
          applyTheme(newTheme);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  useEffect(() => {
    // Check if we're handling a callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    console.log('App useEffect - checking authentication');
    
    if (code) {
      console.log('Auth code found in URL, handling callback');
      handleCallback(code);
    } else {
      // Check for existing token
      const token = localStorage.getItem('spotify_access_token');
      console.log('Token in localStorage:', !!token);
      
      if (token) {
        // Verify the token is valid
        console.log('Verifying token...');
        spotifyService.verifyToken(token)
          .then(isValid => {
            console.log('Token valid:', isValid);
            setIsAuthenticated(isValid);
            if (!isValid) {
              console.log('Token invalid, removing from localStorage');
              localStorage.removeItem('spotify_access_token');
            }
          })
          .catch((err) => {
            console.error('Error verifying token:', err);
            setIsAuthenticated(false);
            localStorage.removeItem('spotify_access_token');
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        console.log('No token found, user not authenticated');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }
  }, []);

  const handleCallback = async (code: string) => {
    try {
      setIsLoading(true);
      await spotifyService.handleCallback(code);
      setIsAuthenticated(true);
      // Remove the code from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error handling callback:', error);
      setError('Failed to authenticate with Spotify. Please try again.');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    spotifyService.initiateLogin();
  };

  const handleMoodDetected = (mood: string) => {
    console.log('Mood detected in App:', mood);
    setCurrentMood(mood);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get recommendations from Spotify
      const spotifyRecs = await spotifyService.getRecommendationsFromText(text);
      setRecommendations(spotifyRecs);
    } catch (spotifyError) {
      console.error('Spotify error:', spotifyError);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('App render - isAuthenticated:', isAuthenticated, 'currentMood:', currentMood);
  }, [isAuthenticated, currentMood]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin">
          <Music2 className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar onLogin={handleLogin} isAuthenticated={isAuthenticated} />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/smart-radio" element={<SmartRadioPage />} />
          <Route path="/song-generator" element={<SongGeneratorPage />} />
          <Route path="/playlist-generator" element={<PlaylistGeneratorPage />} />
          <Route path="/picture-to-song" element={<PictureToSongPage />} />
          <Route path="/daylist" element={<DaylistPage />} />
        </Routes>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {isAuthenticated && <NowPlaying spotifyService={spotifyService} />}
      </div>
    </Router>
  );
}

export default App;