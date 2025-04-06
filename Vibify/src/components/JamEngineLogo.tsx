import { Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface JamEngineLogoProps {
  size?: number;
  className?: string;
}

export function JamEngineLogo({ size = 24, className = '' }: JamEngineLogoProps) {
  return (
    <motion.div 
      className={`${className}`} 
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Headphones 
        size={size} 
        className="text-primary" 
      />
    </motion.div>
  );
} 