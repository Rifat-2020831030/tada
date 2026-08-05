import React, { createContext, useContext, useState, ReactNode } from 'react';
import { dark, light, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('dark'); // Dark mode default

  const colors = mode === 'dark' ? dark : light;

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        mode,
        colors,
        typography,
        spacing,
        setMode,
        toggleTheme,
      },
    },
    children
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
