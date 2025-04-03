import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { Navbar } from './components/navbar';
import { PromptInput } from './components/prompt-input';
import { Features } from './components/features';
import { Pricing } from './components/pricing';
import { About } from './components/about';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#4F46E5,#7C3AED,#2DD4BF)] opacity-20 animate-gradient-xy blur-[100px]" />
      
      <div className="relative">
        <Navbar />
        
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
            <PromptInput />
          </motion.div>

          <Features />
          <Pricing />
          <About />
        </main>
      </div>
    </div>
  );
}

export default App;