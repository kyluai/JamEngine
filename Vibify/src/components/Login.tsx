import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="login-container"
    >
      <div className="login-content">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="login-icon"
        >
          <Music2 size={64} />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="login-title"
        >
          Welcome to Vibify
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="login-subtitle"
        >
          Connect with Spotify to discover your perfect playlist
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onLogin}
          className="spotify-login-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img 
            src="/spotify-logo.png" 
            alt="Spotify" 
            className="spotify-logo"
          />
          Log in with Spotify
        </motion.button>
      </div>
    </motion.div>
  );
}; 