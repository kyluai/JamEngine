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
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);

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

  useEffect(() => {
    console.log('App render - isAuthenticated:', isAuthenticated, 'currentMood:', currentMood);
  }, [isAuthenticated, currentMood]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <div className="fixed inset-0 bg-[linear-gradient(to_right,#7C3AED,#9F7AEA,#C4B5FD)] opacity-20 animate-gradient-xy blur-[100px]" />
          
          <div className="relative">
            <Navbar isAuthenticated={isAuthenticated} onLogin={handleLogin} />
            
            <main className="container mx-auto flex min-h-screen flex-col items-center px-4">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/smart-radio" element={<SmartRadioPage />} />
                <Route path="/song-generator" element={<SongGeneratorPage />} />
                <Route path="/playlist-generator" element={<PlaylistGeneratorPage />} />
                <Route path="/picture-to-song" element={<PictureToSongPage />} />
                <Route path="/daylist" element={<DaylistPage />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
          </div>

          {isAuthenticated && (
            <NowPlaying 
              spotifyService={spotifyService} 
              promptMood={currentMood}
            />
          )}

          {!isAuthenticated && (
            <LoginModal
              isOpen={true}
              onClose={() => {}} // Prevent closing until authenticated
              onLogin={handleLogin}
            />
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;