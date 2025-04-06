import { motion } from 'framer-motion';
import { Radio, Music, ListMusic, Image, Calendar, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { SettingsModal } from '../components/settings-modal';
import { JamEngineLogo } from '../components/JamEngineLogo';

export function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const features = [
    {
      title: 'Smart Radio / AI DJ',
      description: 'Let AI create a personalized radio station based on your mood and preferences.',
      icon: <Radio className="h-8 w-8 text-primary" />,
      link: '/smart-radio',
      color: 'bg-blue-500/10 hover:bg-blue-500/20'
    },
    {
      title: 'Song Generator',
      description: 'Generate song recommendations based on your current vibe or mood.',
      icon: <Music className="h-8 w-8 text-primary" />,
      link: '/song-generator',
      color: 'bg-purple-500/10 hover:bg-purple-500/20'
    },
    {
      title: 'Playlist Generator',
      description: 'Create custom playlists for any occasion or activity.',
      icon: <ListMusic className="h-8 w-8 text-primary" />,
      link: '/playlist-generator',
      color: 'bg-green-500/10 hover:bg-green-500/20'
    },
    {
      title: 'Picture-to-Song Generator',
      description: 'Upload an image and get song recommendations that match its mood and aesthetic.',
      icon: <Image className="h-8 w-8 text-primary" />,
      link: '/picture-to-song',
      color: 'bg-amber-500/10 hover:bg-amber-500/20'
    },
    {
      title: 'Daylist Feature',
      description: 'Get personalized song recommendations based on your daily routine and activities.',
      icon: <Calendar className="h-8 w-8 text-primary" />,
      link: '/daylist',
      color: 'bg-rose-500/10 hover:bg-rose-500/20'
    }
  ];

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
          Discover the perfect soundtrack for every moment with AI-powered music recommendations.
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
              className={`group rounded-xl border p-6 transition-all duration-300 ${feature.color}`}
            >
              <div className="mb-4 flex items-center gap-3">
                {feature.icon}
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground">{feature.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary">
                {feature.title === 'Daylist Feature' ? 'Coming soon' : 'Try it now'}
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
    </div>
  );
} 