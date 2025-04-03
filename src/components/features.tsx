import { motion } from 'framer-motion';
import { Sparkles, Headphones, Share2, Settings, Music, Radio } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Recommendations',
    description: 'Advanced algorithms analyze your mood and preferences to create the perfect playlist.',
  },
  {
    icon: Headphones,
    title: 'High-Quality Audio',
    description: 'Experience music in crystal clear quality with our premium audio processing.',
  },
  {
    icon: Share2,
    title: 'Share Your Vibes',
    description: 'Share your favorite playlists and moods with friends and the community.',
  },
  {
    icon: Settings,
    title: 'Customizable Experience',
    description: 'Fine-tune your recommendations and personalize your music journey.',
  },
  {
    icon: Music,
    title: 'Vast Music Library',
    description: 'Access millions of songs across all genres and moods.',
  },
  {
    icon: Radio,
    title: 'Smart Radio',
    description: 'Let our AI DJ create endless playlists based on your current vibe.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="container px-4">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold">Powered by AI, Driven by Music</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Discover the perfect soundtrack for every moment with our cutting-edge features
            designed to enhance your music experience.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-muted p-6"
            >
              <feature.icon className="h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}