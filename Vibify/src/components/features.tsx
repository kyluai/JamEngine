import { motion } from 'framer-motion';
import { Music, Radio, ListMusic, Image, Calendar, Sparkles, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SettingsModal } from './settings-modal';

const features = [
  {
    icon: Music,
    title: 'Song Generator',
    description: 'Get personalized song recommendations based on your current vibe or mood.',
    link: '/song-generator',
    status: 'active',
    color: 'hover:bg-purple-500/10 hover:border-purple-500/20'
  },
  {
    icon: ListMusic,
    title: 'Playlist Generator',
    description: 'Create custom playlists for any occasion or activity.',
    link: '/playlist-generator',
    status: 'active',
    color: 'hover:bg-green-500/10 hover:border-green-500/20'
  },
  {
    icon: Radio,
    title: 'Smart Radio',
    description: 'Create a personalized radio station that adapts to your current mood and preferences.',
    link: '/smart-radio',
    status: 'active',
    color: 'hover:bg-blue-500/10 hover:border-blue-500/20'
  },
  {
    icon: Image,
    title: 'Picture-to-Song',
    description: 'Upload an image and get song recommendations that match its mood and aesthetic.',
    link: '/picture-to-song',
    status: 'inDevelopment',
    color: 'hover:bg-pink-500/10 hover:border-pink-500/20'
  },
  {
    icon: Calendar,
    title: 'Daylist Feature',
    description: 'Get personalized song recommendations based on your daily routine and activities.',
    link: '/daylist',
    status: 'comingSoon',
    color: 'hover:bg-orange-500/10 hover:border-orange-500/20'
  },
  {
    icon: Settings,
    title: 'Customizable Experience',
    description: 'Personalize your music journey with customizable preferences and settings.',
    link: '#',
    status: 'active',
    color: 'hover:bg-indigo-500/10 hover:border-indigo-500/20',
    isSettings: true
  }
];

export function Features() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleFeatureClick = (feature: typeof features[0], e: React.MouseEvent) => {
    if (feature.isSettings) {
      e.preventDefault();
      setIsSettingsOpen(true);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Discover the perfect soundtrack for every moment with our AI-powered music features.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative rounded-xl border p-6 transition-all duration-300 ${feature.color}`}
            >
              {feature.status === 'inDevelopment' && (
                <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                  In Development
                </div>
              )}
              {feature.status === 'comingSoon' && (
                <div className="absolute -right-2 -top-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-md">
                  Coming Soon
                </div>
              )}
              
              <div className="mb-4 flex items-center gap-3">
                <feature.icon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              
              <Link 
                to={feature.link}
                onClick={(e) => handleFeatureClick(feature, e)}
                className={`inline-flex items-center text-sm font-medium ${
                  feature.status === 'active' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground'
                }`}
              >
                {feature.status === 'active' ? 'Try it now' : 
                 feature.status === 'inDevelopment' ? 'Preview' : 'Coming soon'}
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
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </section>
  );
}