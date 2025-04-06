import { motion } from 'framer-motion';
import { Headphones, Heart, Coffee, Code, Music } from 'lucide-react';
import { JamEngineLogo } from './JamEngineLogo';

export function About() {
  return (
    <section id="about" className="py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-8 flex items-center justify-center gap-4">
              <JamEngineLogo size={48} className="text-primary" />
              <h2 className="text-3xl font-bold">The Story Behind The Jam Engine</h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 space-y-8"
          >
            <div className="rounded-2xl border border-muted bg-muted/5 p-8">
              <div className="flex items-center gap-4">
                <Code className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Two Friends, One Passion</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                We're two friends who started coding together in high school, bonding over our shared love for technology and music. 
                What began as simple coding projects evolved into a deep passion for creating tools that bring people together through music.
              </p>
            </div>

            <div className="rounded-2xl border border-muted bg-muted/5 p-8">
              <div className="flex items-center gap-4">
                <Music className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Born at a Hackathon</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                The Jam Engine was born during this hackathon when we were struggling to find the perfect song to play while brainstorming ideas. 
                We realized there had to be a better way to discover music that matches your current vibe or activity. 
                That's when we decided to build something that would help people find the perfect soundtrack for any moment.
              </p>
            </div>

            <div className="rounded-2xl border border-muted bg-muted/5 p-8">
              <div className="flex items-center gap-4">
                <Heart className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Built with Passion</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                This project combines our love for coding and music into something we hope will make a difference in how people discover and enjoy music. 
                We've poured our hearts into creating an experience that's both fun and useful, leveraging Spotify's amazing API to bring you personalized recommendations 
                that truly match your current vibe.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-lg text-muted-foreground">
              Thanks for checking out our passion project! We hope The Jam Engine helps you discover your next favorite song. 🎵✨
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}