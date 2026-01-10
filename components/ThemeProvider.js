'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  colorTheme: 'bw',
  setColorTheme: () => {},
  isLoading: true
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [colorTheme, setColorThemeState] = useState('bw');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from API on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const settings = await response.json();
          setColorThemeState(settings.colorTheme || 'bw');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTheme();
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!isLoading) {
      const root = document.documentElement;
      // Remove all theme classes
      root.classList.remove('lowkey');
      
      // Add the current theme class (bw is default, no class needed)
      if (colorTheme === 'lowkey') {
        root.classList.add('lowkey');
      }
    }
  }, [colorTheme, isLoading]);

  const setColorTheme = async (theme) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colorTheme: theme }),
      });

      if (response.ok) {
        setColorThemeState(theme);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
