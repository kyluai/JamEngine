import { motion } from 'framer-motion';
import { Menu, X, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Link, useLocation } from 'react-router-dom';
import { SpotifyService } from '../lib/spotify-service';
import { JamEngineLogo } from './JamEngineLogo';

interface NavbarProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

export function Navbar({ isAuthenticated, onLogin }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About' }
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-muted/20 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <JamEngineLogo size={32} className="text-primary" />
          <span className="text-xl font-bold">The Jam Engine</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm transition-colors ${
                isActive(link.path)
                  ? 'text-primary font-medium'
                  : 'hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated ? (
            <Button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
              size="sm"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.24-3.021-1.85-6.82-2.27-11.3-1.24-.418.1-.841-.16-.941-.57-.101-.41.16-.84.57-.94 4.91-1.12 9.13-.63 12.53 1.4.369.23.489.721.241 1.11zm1.47-3.27c-.301.459-.921.619-1.381.311-3.461-2.13-8.73-2.75-12.821-1.51-.49.15-1.021-.13-1.161-.62-.15-.49.13-1.021.62-1.161 4.671-1.42 10.471-.721 14.461 1.77.449.28.609.91.281 1.37zm.129-3.401c-4.15-2.461-11.001-2.691-14.971-1.49-.61.18-1.25-.17-1.431-.78-.18-.601.17-1.25.78-1.431 4.561-1.38 12.131-1.11 16.891 1.71.57.34.75 1.08.41 1.649-.341.57-1.081.75-1.65.41z"/>
              </svg>
              Connect with Spotify
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-[#1DB954]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Spotify Connected</span>
            </div>
          )}
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
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-colors ${
                  isActive(link.path)
                    ? 'text-primary font-medium'
                    : 'hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated ? (
              <Button
                onClick={() => {
                  onLogin();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white w-full"
                size="sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.24-3.021-1.85-6.82-2.27-11.3-1.24-.418.1-.841-.16-.941-.57-.101-.41.16-.84.57-.94 4.91-1.12 9.13-.63 12.53 1.4.369.23.489.721.241 1.11zm1.47-3.27c-.301.459-.921.619-1.381.311-3.461-2.13-8.73-2.75-12.821-1.51-.49.15-1.021-.13-1.161-.62-.15-.49.13-1.021.62-1.161 4.671-1.42 10.471-.721 14.461 1.77.449.28.609.91.281 1.37zm.129-3.401c-4.15-2.461-11.001-2.691-14.971-1.49-.61.18-1.25-.17-1.431-.78-.18-.601.17-1.25.78-1.431 4.561-1.38 12.131-1.11 16.891 1.71.57.34.75 1.08.41 1.649-.341.57-1.081.75-1.65.41z"/>
                </svg>
                Connect with Spotify
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-[#1DB954] py-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Spotify Connected</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}