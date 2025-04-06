import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginModal({ isOpen, onLogin }: LoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to Vibify! 🎵</h2>
          <p className="text-muted-foreground">
            To create personalized playlists based on your mood, you'll need to connect your Spotify account.
          </p>
          
          <div className="pt-4">
            <Button
              onClick={onLogin}
              className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white w-full"
              size="lg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.24-3.021-1.85-6.82-2.27-11.3-1.24-.418.1-.841-.16-.941-.57-.101-.41.16-.84.57-.94 4.91-1.12 9.13-.63 12.53 1.4.369.23.489.721.241 1.11zm1.47-3.27c-.301.459-.921.619-1.381.311-3.461-2.13-8.73-2.75-12.821-1.51-.49.15-1.021-.13-1.161-.62-.15-.49.13-1.021.62-1.161 4.671-1.42 10.471-.721 14.461 1.77.449.28.609.91.281 1.37zm.129-3.401c-4.15-2.461-11.001-2.691-14.971-1.49-.61.18-1.25-.17-1.431-.78-.18-.601.17-1.25.78-1.431 4.561-1.38 12.131-1.11 16.891 1.71.57.34.75 1.08.41 1.649-.341.57-1.081.75-1.65.41z"/>
              </svg>
              Connect with Spotify
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 