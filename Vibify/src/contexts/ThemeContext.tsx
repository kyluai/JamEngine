import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system theme if no preference is saved
      applyTheme('system');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Apply theme function
  const applyTheme = (themeToApply: Theme) => {
    console.log('Applying theme:', themeToApply);
    
    // First, remove the dark class to ensure a clean state
    document.documentElement.classList.remove('dark');
    
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Dark theme applied');
    } else if (themeToApply === 'light') {
      // Already removed dark class above
      console.log('Light theme applied');
    } else {
      // System theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      console.log('System theme detected:', systemTheme);
      
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('System dark theme applied');
      } else {
        // Already removed dark class above
        console.log('System light theme applied');
      }
    }
    
    // Force a repaint to ensure the theme is applied
    document.body.style.display = 'none';
    document.body.offsetHeight; // Force a reflow
    document.body.style.display = '';
  };

  // Set theme function that also saves to localStorage
  const setTheme = (newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 