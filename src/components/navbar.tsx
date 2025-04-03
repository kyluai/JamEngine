import { motion } from 'framer-motion';
import { Music2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-muted/20 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Music2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Vibify</span>
        </div>

        <div className="hidden md:flex md:items-center md:gap-6">
          <a href="#features" className="text-sm hover:text-primary">Features</a>
          <a href="#pricing" className="text-sm hover:text-primary">Pricing</a>
          <a href="#about" className="text-sm hover:text-primary">About</a>
          <Button variant="outline" size="sm">Sign In</Button>
          <Button size="sm">Get Started</Button>
        </div>

        <button
          className="p-2 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="border-t border-muted/20 bg-background/80 px-4 py-4 backdrop-blur-lg md:hidden"
        >
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm hover:text-primary">Features</a>
            <a href="#pricing" className="text-sm hover:text-primary">Pricing</a>
            <a href="#about" className="text-sm hover:text-primary">About</a>
            <Button variant="outline" size="sm" className="w-full">Sign In</Button>
            <Button size="sm" className="w-full">Get Started</Button>
          </div>
        </motion.div>
      )}
    </nav>
  );
}