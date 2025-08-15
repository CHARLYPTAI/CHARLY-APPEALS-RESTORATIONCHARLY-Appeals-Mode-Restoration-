import React, { createContext, useContext, useEffect, useState } from 'react';
import { type ColorMode, getThemeColors } from './theme';

interface ThemeContextType {
  mode: ColorMode;
  toggleMode: () => void;
  colors: ReturnType<typeof getThemeColors>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ColorMode;
}

export function ThemeProvider({ children, defaultMode = 'light' }: ThemeProviderProps) {
  // Check for saved preference or system preference
  const [mode, setMode] = useState<ColorMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('charly-theme-mode');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return defaultMode;
  });

  // Update CSS custom properties when mode changes
  useEffect(() => {
    const colors = getThemeColors(mode);
    const root = document.documentElement;
    
    // Apply theme colors as CSS custom properties
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-elevated', colors.surfaceElevated);
    
    // Text colors
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-tertiary', colors.text.tertiary);
    root.style.setProperty('--color-text-quaternary', colors.text.quaternary);
    
    // Border colors
    root.style.setProperty('--color-border-primary', colors.border.primary);
    root.style.setProperty('--color-border-secondary', colors.border.secondary);
    root.style.setProperty('--color-border-focus', colors.border.focus);
    
    // Accent colors
    root.style.setProperty('--color-accent-primary', colors.accent.primary);
    root.style.setProperty('--color-accent-primary-hover', colors.accent.primaryHover);
    root.style.setProperty('--color-accent-success', colors.accent.success);
    root.style.setProperty('--color-accent-warning', colors.accent.warning);
    root.style.setProperty('--color-accent-error', colors.accent.error);
    
    // Interactive colors
    root.style.setProperty('--color-interactive-hover', colors.interactive.hover);
    root.style.setProperty('--color-interactive-active', colors.interactive.active);
    root.style.setProperty('--color-interactive-selected', colors.interactive.selected);
    
    // Update data attribute for CSS selectors
    root.setAttribute('data-theme', mode);
    
    // Save preference
    localStorage.setItem('charly-theme-mode', mode);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const saved = localStorage.getItem('charly-theme-mode');
      if (!saved) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    mode,
    toggleMode,
    colors: getThemeColors(mode)
  };

  return (
    <ThemeContext.Provider value={value}>
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

// Custom hook for theme-aware styles
export function useThemeStyles() {
  const { colors, mode } = useTheme();
  
  return {
    colors,
    mode,
    // Helper functions for common patterns
    surfaceStyles: {
      backgroundColor: colors.surface,
      color: colors.text.primary,
      borderColor: colors.border.primary
    },
    cardStyles: {
      backgroundColor: colors.surfaceElevated,
      color: colors.text.primary,
      borderColor: colors.border.secondary,
      boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.3)'
    },
    buttonPrimaryStyles: {
      backgroundColor: colors.accent.primary,
      color: colors.text.primary,
      ':hover': {
        backgroundColor: colors.accent.primaryHover
      }
    }
  };
}