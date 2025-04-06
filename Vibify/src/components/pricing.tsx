import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateAndScrollToTop } from '../utils/navigation';

export function Pricing() {
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  const handleCatchVibes = () => {
    setShowMessage(false);
    navigateAndScrollToTop(navigate, '/');
  };

  return (
    <section id="pricing" className="py-24">
      <div className="container px-4">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold">Pricing</h2>
          <p className="mx-auto max-w-2xl text-xl font-medium">
            Free. Always.
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            We don't do tiers. We don't do subscriptions.<br />
            The Jam Engine is completely free.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="mx-auto max-w-2xl text-lg font-medium">
            So... what's the catch?
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
            There isn't one. Music is for everyone—and so is this.
          </p>
        </div>

        <div className="mt-16 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md rounded-xl border border-muted bg-muted/5 p-8"
          >
            <h3 className="text-xl font-bold">Jam Engine Plan</h3>
            <p className="mt-4 text-3xl font-bold">$0/month</p>
            
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Unlimited recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Mood-based playlists</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Zero ads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">No strings attached</span>
              </li>
            </ul>

            <div className="mt-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                [You're already in.]
              </p>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 text-center">
          <Button 
            onClick={() => setShowMessage(true)}
            variant="outline"
            className="text-lg"
          >
            Purchase Now
          </Button>
        </div>

        {showMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center"
          >
            <h3 className="mb-2 text-xl font-bold">Vibes Cannot Be Purchased</h3>
            <p className="mb-4 text-lg font-medium text-muted-foreground">
              "You don't buy vibes. You catch them."
            </p>
            <Button onClick={handleCatchVibes}>
              Got it, I'll catch vibes instead
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}