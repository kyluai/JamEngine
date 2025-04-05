import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Sun, Moon, Coffee, Utensils, Bed } from 'lucide-react';
import { PromptInput } from '../components/prompt-input';
import { SpotifyService } from '../lib/spotify-service';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { About } from '../components/about';

export function DaylistPage() {
  const [spotifyService] = useState(() => new SpotifyService());
  const [currentMood, setCurrentMood] = useState<string | undefined>(undefined);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string | null>(null);

  const handleMoodDetected = (mood: string) => {
    console.log('Mood detected in DaylistPage:', mood);
    setCurrentMood(mood);
  };

  const timeOfDayOptions = [
    { id: 'morning', label: 'Morning', icon: <Sun className="h-5 w-5" /> },
    { id: 'afternoon', label: 'Afternoon', icon: <Coffee className="h-5 w-5" /> },
    { id: 'evening', label: 'Evening', icon: <Utensils className="h-5 w-5" /> },
    { id: 'night', label: 'Night', icon: <Moon className="h-5 w-5" /> },
    { id: 'late-night', label: 'Late Night', icon: <Bed className="h-5 w-5" /> }
  ];

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-32 text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-4">
          <Calendar className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">Daylist Feature</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Get personalized song recommendations based on your daily routine and activities.
          Select a time of day and describe what you're doing, and we'll find the perfect soundtrack.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-3xl"
      >
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Select Time of Day</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {timeOfDayOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedTimeOfDay(option.id)}
                className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${
                  selectedTimeOfDay === option.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className="mb-2">{option.icon}</div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <PromptInput 
          spotifyService={spotifyService} 
          onMoodDetected={handleMoodDetected}
        />
      </motion.div>

      <div className="mt-24 w-full">
        <Features />
        <Pricing />
        <About />
      </div>
    </div>
  );
} 