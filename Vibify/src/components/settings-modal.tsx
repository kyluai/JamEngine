import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Volume2, Bell, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [volume, setVolume] = useState(50);
  const [notifications, setNotifications] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('volume');
    const savedNotifications = localStorage.getItem('notifications');

    if (savedVolume) setVolume(parseInt(savedVolume));
    if (savedNotifications) setNotifications(savedNotifications === 'true');
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log('Theme change requested:', newTheme);
    setTheme(newTheme);
    showSavedMessage();
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('volume', newVolume.toString());
    showSavedMessage();
  };

  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', newValue.toString());
    
    if (newValue) {
      // Request notification permission if not already granted
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
    
    showSavedMessage();
  };

  const showSavedMessage = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Settings</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Theme</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                      theme === 'light'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Sun size={20} />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Moon size={20} />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                      theme === 'system'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    <Monitor size={20} />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Volume Settings */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Volume</h3>
                <div className="flex items-center gap-4">
                  <Volume2 size={20} className="text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={e => handleVolumeChange(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
                  />
                  <span className="min-w-[3rem] text-sm text-muted-foreground">{volume}%</span>
                </div>
              </div>

              {/* Notifications Settings */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Notifications</h3>
                <button
                  onClick={handleNotificationsToggle}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                    notifications
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={20} />
                    <span>Enable Notifications</span>
                  </div>
                  <div className={`h-6 w-11 rounded-full transition-colors ${
                    notifications ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div className={`h-5 w-5 transform rounded-full bg-background transition-transform ${
                      notifications ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Saved Message */}
            <AnimatePresence>
              {savedMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary"
                >
                  <Check size={16} />
                  <span>Settings saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 