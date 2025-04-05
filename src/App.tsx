import { useState, useEffect } from 'react';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4F46E5,#7C3AED,#2DD4BF)] opacity-20 animate-gradient-xy blur-[100px]" />
      
      <div className="relative">
        <Navbar isAuthenticated={isAuthenticated} onLogin={handleLogin} />
        
        <main className="container mx-auto flex min-h-screen flex-col items-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-32 text-center"
          >
            <div className="mb-8 flex items-center justify-center gap-4">
              <Music2 className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold tracking-tight">Vibify</h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Let AI create the perfect playlist based on your vibe. Describe your mood,
              location, or the atmosphere you want to create, and we'll do the rest.
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-message mt-4"
            >
              {error}
            </motion.div>
          )}

          <Features />
          <Pricing />
          <About />
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
  );
}

export default App;