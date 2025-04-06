import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

export function DaylistPage() {
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
          Coming Soon! We're working on something exciting.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 w-full max-w-3xl text-center"
      >
        <div className="rounded-lg border border-muted bg-card p-8 shadow-sm">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Stay Tuned</h2>
          </div>
          <p className="text-muted-foreground">
            Our Daylist feature will help you create personalized playlists based on your daily routine and activities.
            Select different times of day and get the perfect soundtrack for your day.
          </p>
        </div>
      </motion.div>
    </div>
  );
} 