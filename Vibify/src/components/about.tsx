import { motion } from 'framer-motion';
import { Headphones, Heart, Coffee } from 'lucide-react';
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
                <Coffee className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Just a College Student with a Dream</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                Hey! I'm just a regular college student who loves music and tech. Between late-night study sessions
                and coffee runs, I realized how music has this amazing power to transform any moment into something
                special. That's when The Jam Engine was born.
              </p>
            </div>

            <div className="rounded-2xl border border-muted bg-muted/5 p-8">
              <div className="flex items-center gap-4">
                <Headphones className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Sharing Vibes, One Playlist at a Time</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you're grinding through finals week, chilling at a rooftop party, or just need that perfect
                background music for your coding session – I get it. The Jam Engine is all about capturing those specific
                moments and turning them into the perfect soundtrack.
              </p>
            </div>

            <div className="rounded-2xl border border-muted bg-muted/5 p-8">
              <div className="flex items-center gap-4">
                <Heart className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-semibold">Built with Love (and lots of energy drinks)</h3>
              </div>
              <p className="mt-4 text-lg text-muted-foreground">
                This project started in my dorm room, fueled by passion, curiosity, and maybe a few too many energy
                drinks. It's not just about algorithms and AI – it's about creating a community where we can all
                share our vibes and discover new music together.
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
              Thanks for being part of this journey. Let's make some awesome playlists together! 🎵✨
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}