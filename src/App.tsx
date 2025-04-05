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
import { AppleMusicService } from './lib/apple-music-service';
import { SoundCloudService } from './lib/soundcloud-service';
import type { Recommendation } from './lib/music-service.interface';
import { MusicSearchDemo } from './components/MusicSearchDemo';
import './App.css';

const appleMusicService = new AppleMusicService();
const soundCloudService = new SoundCloudService();

function App() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);
  const [text, setText] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

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
      // Try Apple Music first
      const appleRecs = await appleMusicService.getRecommendationsFromText(text);
      setRecommendations(appleRecs);
    } catch (appleError) {
      console.error('Apple Music error:', appleError);
      try {
        // Fallback to SoundCloud
        const soundCloudRecs = await soundCloudService.getRecommendationsFromText(text);
        setRecommendations(soundCloudRecs);
      } catch (soundCloudError) {
        console.error('SoundCloud error:', soundCloudError);
        setError('Failed to get recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Vibify</h1>
        </div>
      </header>
      <main>
        <MusicSearchDemo />
      </main>
    </div>
  );
}

export default App;