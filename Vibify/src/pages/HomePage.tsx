import { motion } from 'framer-motion';
import { Radio, Music, ListMusic, Image, Calendar, ArrowRight, Settings, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { SettingsModal } from '../components/settings-modal';
import { JamEngineLogo } from '../components/JamEngineLogo';

export function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningFeature, setWarningFeature] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const features = [
    {
      title: 'Smart Radio',
      description: 'Create a personalized radio station that adapts to your current mood and preferences.',
      icon: <Radio className="h-6 w-6" />,
      link: '/smart-radio',
      color: 'hover:bg-blue-500/10 hover:border-blue-500/20',
      inDevelopment: false,
      comingSoon: false
    },
    {
      title: 'Song Generator',
      description: 'Get personalized song recommendations based on your current vibe or mood.',
      icon: <Music className="h-6 w-6" />,
      link: '/song-generator',
      color: 'hover:bg-purple-500/10 hover:border-purple-500/20',
      inDevelopment: false,
      comingSoon: false
    },
    {
      title: 'Playlist Generator',
      description: 'Create custom playlists for any occasion or activity.',
      icon: <ListMusic className="h-6 w-6" />,
      link: '/playlist-generator',
      color: 'hover:bg-green-500/10 hover:border-green-500/20',
      inDevelopment: false,
      comingSoon: false
    },
    {
      title: 'Picture-to-Song',
      description: 'Upload an image and get song recommendations that match its mood and aesthetic.',
      icon: <Image className="h-6 w-6" />,
      link: '/picture-to-song',
      color: 'hover:bg-pink-500/10 hover:border-pink-500/20',
      inDevelopment: true,
      comingSoon: false
    },
    {
      title: 'Daylist Feature',
      description: 'Get personalized song recommendations based on your daily routine and activities.',
      icon: <Calendar className="h-6 w-6" />,
      link: '/daylist',
      color: 'hover:bg-orange-500/10 hover:border-orange-500/20',
      inDevelopment: false,
      comingSoon: true
    }
  ];

  const handleFeatureClick = (feature: typeof features[0], e: React.MouseEvent) => {
    if (feature.inDevelopment) {
      e.preventDefault();
      setWarningFeature('inDevelopment');
      setShowWarning(true);
    } else if (feature.comingSoon) {
      e.preventDefault();
      setWarningFeature('comingSoon');
      setShowWarning(true);
    }
  };

  const handleContinueToFeature = () => {
    setShowWarning(false);
    if (warningFeature === 'inDevelopment') {
      navigate('/picture-to-song');
    } else if (warningFeature === 'comingSoon') {
      navigate('/daylist');
    }
    setWarningFeature(null);
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4">
      {/* Settings Button - Fixed in top-right corner */}
      <div className="fixed right-6 top-24 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full bg-background/80 p-2 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-background/90 hover:text-primary"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-32 text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-4">
          <JamEngineLogo size={48} className="text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">The Jam Engine</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Powered by AI, Driven by Music
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-3xl rounded-xl border border-muted/20 bg-background/50 p-8 backdrop-blur-sm"
      >
        <h2 className="mb-4 text-2xl font-semibold">What is The Jam Engine?</h2>
        <p className="mb-6 text-muted-foreground">
          The Jam Engine is your AI-powered music companion that understands your mood, activities, and preferences to recommend the perfect songs. Whether you're looking for a specific vibe, creating a playlist for an occasion, or just want to discover new music, The Jam Engine has you covered.
        </p>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-medium">Ready to discover your next favorite song?</h3>
            <p className="text-sm text-muted-foreground">Start with our Song Generator to get personalized recommendations based on your mood.</p>
          </div>
          <Link 
            to="/song-generator" 
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Song Generator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-16 w-full max-w-5xl"
      >
        <h2 className="mb-6 text-center text-2xl font-semibold">Explore All Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Link 
              key={index} 
              to={feature.link}
              onClick={(e) => handleFeatureClick(feature, e)}
              className={`group relative rounded-xl border p-6 transition-all duration-300 ${feature.color}`}
            >
              {feature.inDevelopment && (
                <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                  In Development
                </div>
              )}
              {feature.comingSoon && (
                <div className="absolute -right-2 -top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                  Coming Soon
                </div>
              )}
              <div className="mb-4 flex items-center gap-3">
                {feature.icon}
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground">{feature.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary">
                {feature.comingSoon ? 'Coming soon' : 'Try it now'}
                <svg
                  className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16 w-full max-w-3xl rounded-xl border border-muted/20 bg-background/50 p-8 text-center backdrop-blur-sm"
      >
        <h2 className="mb-4 text-2xl font-semibold">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <span className="text-xl font-bold text-primary">1</span>
            </div>
            <h3 className="mb-2 text-lg font-medium">Connect with Spotify</h3>
            <p className="text-sm text-muted-foreground">Link your Spotify account to get personalized recommendations.</p>
          </div>
          <div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <span className="text-xl font-bold text-primary">2</span>
            </div>
            <h3 className="mb-2 text-lg font-medium">Describe Your Vibe</h3>
            <p className="text-sm text-muted-foreground">Tell us how you're feeling or what you're doing.</p>
          </div>
          <div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <span className="text-xl font-bold text-primary">3</span>
            </div>
            <h3 className="mb-2 text-lg font-medium">Discover New Music</h3>
            <p className="text-sm text-muted-foreground">Get personalized song recommendations that match your vibe.</p>
          </div>
        </div>
      </motion.div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {showWarning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className={`w-full max-w-md rounded-lg border ${warningFeature === 'inDevelopment' ? 'border-yellow-500/20' : 'border-blue-500/20'} bg-background p-6 shadow-lg`}>
            <div className={`mb-4 flex items-center gap-3 ${warningFeature === 'inDevelopment' ? 'text-yellow-500' : 'text-blue-500'}`}>
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-xl font-bold">
                {warningFeature === 'inDevelopment' ? 'Feature in Development' : 'Feature Coming Soon'}
              </h3>
            </div>
            <p className="mb-6 text-muted-foreground">
              {warningFeature === 'inDevelopment' 
                ? 'The Picture-to-Song feature is currently in development and may not work as intended. Would you like to continue anyway?' 
                : 'The Daylist feature is coming soon! Would you like to preview it anyway?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowWarning(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleContinueToFeature}
                className={warningFeature === 'inDevelopment' 
                  ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                  : "bg-blue-500 text-white hover:bg-blue-600"}
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 