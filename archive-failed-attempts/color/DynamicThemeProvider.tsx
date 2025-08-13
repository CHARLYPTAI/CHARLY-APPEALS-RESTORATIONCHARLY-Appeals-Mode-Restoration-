import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface ThemeTransition {
  duration: number;
  easing: string;
  properties: string[];
}

interface TimeBasedTheme {
  sunrise: string; // 6:00 AM
  morning: string; // 9:00 AM
  midday: string; // 12:00 PM
  afternoon: string; // 3:00 PM
  evening: string; // 6:00 PM
  night: string; // 9:00 PM
  midnight: string; // 12:00 AM
}

interface ContextualTheme {
  location: 'indoor' | 'outdoor' | 'auto';
  weather: 'sunny' | 'cloudy' | 'rainy' | 'auto';
  activity: 'work' | 'leisure' | 'presentation' | 'auto';
}

interface DynamicThemeContextType {
  currentTheme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isTransitioning: boolean;
  transitionProgress: number;
  enableTimeBasedTheme: boolean;
  setEnableTimeBasedTheme: (enabled: boolean) => void;
  enableContextualTheme: boolean;
  setEnableContextualTheme: (enabled: boolean) => void;
  contextualSettings: ContextualTheme;
  setContextualSettings: (settings: Partial<ContextualTheme>) => void;
  customTransition: ThemeTransition;
  setCustomTransition: (transition: Partial<ThemeTransition>) => void;
  scheduleThemeChange: (time: string, theme: 'light' | 'dark') => void;
  clearScheduledThemes: () => void;
  previewTheme: (theme: 'light' | 'dark') => void;
  cancelPreview: () => void;
  getSystemThemePreference: () => 'light' | 'dark';
  getTimeBasedTheme: () => 'light' | 'dark';
  getContextualTheme: () => 'light' | 'dark';
}

const defaultTransition: ThemeTransition = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  properties: ['background-color', 'color', 'border-color', 'box-shadow']
};

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

export const DynamicThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, toggleDarkMode, currentPalette } = useAdaptiveColor();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [enableTimeBasedTheme, setEnableTimeBasedTheme] = useState(false);
  const [enableContextualTheme, setEnableContextualTheme] = useState(false);
  const [contextualSettings, setContextualSettings] = useState<ContextualTheme>({
    location: 'auto',
    weather: 'auto',
    activity: 'auto'
  });
  const [customTransition, setCustomTransition] = useState<ThemeTransition>(defaultTransition);
  const [scheduledThemes, setScheduledThemes] = useState<Map<string, 'light' | 'dark'>>(new Map());
  const [previewMode, setPreviewMode] = useState<'light' | 'dark' | null>(null);

  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const timeCheckIntervalRef = useRef<NodeJS.Timeout>();

  // Time-based theme mapping
  const timeBasedThemes: TimeBasedTheme = {
    sunrise: 'light',
    morning: 'light',
    midday: 'light',
    afternoon: 'light',
    evening: 'dark',
    night: 'dark',
    midnight: 'dark'
  };

  // System theme detection
  const getSystemThemePreference = useCallback((): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Time-based theme calculation
  const getTimeBasedTheme = useCallback((): 'light' | 'dark' => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 9) return timeBasedThemes.sunrise as 'light' | 'dark';
    if (hour >= 9 && hour < 12) return timeBasedThemes.morning as 'light' | 'dark';
    if (hour >= 12 && hour < 15) return timeBasedThemes.midday as 'light' | 'dark';
    if (hour >= 15 && hour < 18) return timeBasedThemes.afternoon as 'light' | 'dark';
    if (hour >= 18 && hour < 21) return timeBasedThemes.evening as 'light' | 'dark';
    if (hour >= 21 || hour < 3) return timeBasedThemes.night as 'light' | 'dark';
    return timeBasedThemes.midnight as 'light' | 'dark';
  }, []);

  // Contextual theme calculation
  const getContextualTheme = useCallback((): 'light' | 'dark' => {
    // This would integrate with device sensors/location services in a real app
    // For now, we'll use heuristics based on settings
    
    if (contextualSettings.location === 'outdoor') {
      // Outdoor environments typically benefit from darker themes to reduce glare
      return 'dark';
    }
    
    if (contextualSettings.weather === 'sunny') {
      // Sunny conditions might benefit from higher contrast
      return 'light';
    }
    
    if (contextualSettings.activity === 'presentation') {
      // Presentation mode typically uses dark themes
      return 'dark';
    }
    
    // Default to time-based or system preference
    return enableTimeBasedTheme ? getTimeBasedTheme() : getSystemThemePreference();
  }, [contextualSettings, enableTimeBasedTheme, getTimeBasedTheme, getSystemThemePreference]);

  // Smooth transition animation
  const animateTransition = useCallback((targetTheme: 'light' | 'dark') => {
    setIsTransitioning(true);
    setTransitionProgress(0);

    const startTime = performance.now();
    const duration = customTransition.duration;

    // Apply CSS transition
    document.documentElement.style.setProperty('--theme-transition-duration', `${duration}ms`);
    document.documentElement.style.setProperty('--theme-transition-easing', customTransition.easing);

    // Animate progress
    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setTransitionProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsTransitioning(false);
        setTransitionProgress(1);
        
        // Clean up CSS properties
        setTimeout(() => {
          document.documentElement.style.removeProperty('--theme-transition-duration');
          document.documentElement.style.removeProperty('--theme-transition-easing');
        }, 100);
      }
    };

    requestAnimationFrame(updateProgress);

    // Actually change the theme
    if ((targetTheme === 'dark' && !isDarkMode) || (targetTheme === 'light' && isDarkMode)) {
      setTimeout(() => {
        toggleDarkMode();
      }, duration / 3); // Start the actual theme change 1/3 through the animation
    }
  }, [customTransition, isDarkMode, toggleDarkMode]);

  // Theme change handler
  const setTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    setCurrentTheme(theme);
    
    let targetTheme: 'light' | 'dark';
    
    if (theme === 'auto') {
      if (enableContextualTheme) {
        targetTheme = getContextualTheme();
      } else if (enableTimeBasedTheme) {
        targetTheme = getTimeBasedTheme();
      } else {
        targetTheme = getSystemThemePreference();
      }
    } else {
      targetTheme = theme;
    }
    
    if (previewMode) {
      setPreviewMode(null);
    }
    
    animateTransition(targetTheme);
  }, [enableContextualTheme, enableTimeBasedTheme, getContextualTheme, getTimeBasedTheme, getSystemThemePreference, previewMode, animateTransition]);

  // Schedule theme changes
  const scheduleThemeChange = useCallback((time: string, theme: 'light' | 'dark') => {
    setScheduledThemes(prev => {
      const newSchedule = new Map(prev);
      newSchedule.set(time, theme);
      return newSchedule;
    });
  }, []);

  // Clear scheduled themes
  const clearScheduledThemes = useCallback(() => {
    setScheduledThemes(new Map());
  }, []);

  // Preview theme
  const previewTheme = useCallback((theme: 'light' | 'dark') => {
    setPreviewMode(theme);
    animateTransition(theme);
  }, [animateTransition]);

  // Cancel preview
  const cancelPreview = useCallback(() => {
    if (previewMode) {
      setPreviewMode(null);
      // Revert to current theme
      setTheme(currentTheme);
    }
  }, [previewMode, currentTheme, setTheme]);

  // Update contextual settings
  const updateContextualSettings = useCallback((settings: Partial<ContextualTheme>) => {
    setContextualSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Update custom transition
  const updateCustomTransition = useCallback((transition: Partial<ThemeTransition>) => {
    setCustomTransition(prev => ({ ...prev, ...transition }));
  }, []);

  // System theme change listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'auto' && !enableTimeBasedTheme && !enableContextualTheme) {
        animateTransition(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [currentTheme, enableTimeBasedTheme, enableContextualTheme, animateTransition]);

  // Time-based theme checking
  useEffect(() => {
    if (enableTimeBasedTheme && currentTheme === 'auto') {
      const checkTimeBasedTheme = () => {
        const targetTheme = getTimeBasedTheme();
        const currentActualTheme = isDarkMode ? 'dark' : 'light';
        
        if (targetTheme !== currentActualTheme) {
          animateTransition(targetTheme);
        }
      };
      
      // Check every minute
      timeCheckIntervalRef.current = setInterval(checkTimeBasedTheme, 60000);
      
      // Initial check
      checkTimeBasedTheme();
      
      return () => {
        if (timeCheckIntervalRef.current) {
          clearInterval(timeCheckIntervalRef.current);
        }
      };
    }
  }, [enableTimeBasedTheme, currentTheme, getTimeBasedTheme, isDarkMode, animateTransition]);

  // Scheduled theme checking
  useEffect(() => {
    if (scheduledThemes.size > 0) {
      const checkScheduledThemes = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const scheduledTheme = scheduledThemes.get(currentTime);
        if (scheduledTheme) {
          animateTransition(scheduledTheme);
          
          // Remove the scheduled theme after execution
          setScheduledThemes(prev => {
            const newSchedule = new Map(prev);
            newSchedule.delete(currentTime);
            return newSchedule;
          });
        }
      };
      
      // Check every minute
      const interval = setInterval(checkScheduledThemes, 60000);
      
      return () => clearInterval(interval);
    }
  }, [scheduledThemes, animateTransition]);

  // Apply theme CSS variables
  useEffect(() => {
    const applyThemeVariables = () => {
      const root = document.documentElement;
      
      // Apply color palette as CSS variables
      root.style.setProperty('--color-primary', currentPalette.primary);
      root.style.setProperty('--color-secondary', currentPalette.secondary);
      root.style.setProperty('--color-accent', currentPalette.accent);
      root.style.setProperty('--color-background', currentPalette.background);
      root.style.setProperty('--color-surface', currentPalette.surface);
      root.style.setProperty('--color-text-primary', currentPalette.text.primary);
      root.style.setProperty('--color-text-secondary', currentPalette.text.secondary);
      root.style.setProperty('--color-text-disabled', currentPalette.text.disabled);
      root.style.setProperty('--color-success', currentPalette.semantic.success);
      root.style.setProperty('--color-warning', currentPalette.semantic.warning);
      root.style.setProperty('--color-error', currentPalette.semantic.error);
      root.style.setProperty('--color-info', currentPalette.semantic.info);
      
      // Apply transition properties
      const properties = customTransition.properties.join(', ');
      root.style.setProperty('--theme-transition-properties', properties);
      
      // Apply theme-specific styles
      if (isDarkMode) {
        root.setAttribute('data-theme', 'dark');
        root.style.setProperty('--shadow-color', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.2)');
      } else {
        root.setAttribute('data-theme', 'light');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.2)');
      }
    };
    
    applyThemeVariables();
  }, [currentPalette, customTransition, isDarkMode]);

  // Contextual theme updates
  useEffect(() => {
    if (enableContextualTheme && currentTheme === 'auto') {
      const targetTheme = getContextualTheme();
      const currentActualTheme = isDarkMode ? 'dark' : 'light';
      
      if (targetTheme !== currentActualTheme) {
        animateTransition(targetTheme);
      }
    }
  }, [enableContextualTheme, currentTheme, contextualSettings, getContextualTheme, isDarkMode, animateTransition]);

  // Initialize theme
  useEffect(() => {
    if (currentTheme === 'auto') {
      const initialTheme = enableContextualTheme 
        ? getContextualTheme() 
        : enableTimeBasedTheme 
          ? getTimeBasedTheme() 
          : getSystemThemePreference();
      
      if ((initialTheme === 'dark' && !isDarkMode) || (initialTheme === 'light' && isDarkMode)) {
        toggleDarkMode();
      }
    }
  }, []); // Only run on mount

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearTimeout(progressIntervalRef.current);
      }
      if (timeCheckIntervalRef.current) {
        clearInterval(timeCheckIntervalRef.current);
      }
    };
  }, []);

  const value: DynamicThemeContextType = {
    currentTheme,
    setTheme,
    isTransitioning,
    transitionProgress,
    enableTimeBasedTheme,
    setEnableTimeBasedTheme,
    enableContextualTheme,
    setEnableContextualTheme,
    contextualSettings,
    setContextualSettings: updateContextualSettings,
    customTransition,
    setCustomTransition: updateCustomTransition,
    scheduleThemeChange,
    clearScheduledThemes,
    previewTheme,
    cancelPreview,
    getSystemThemePreference,
    getTimeBasedTheme,
    getContextualTheme
  };

  return (
    <DynamicThemeContext.Provider value={value}>
      {children}
    </DynamicThemeContext.Provider>
  );
};

export const useDynamicTheme = () => {
  const context = useContext(DynamicThemeContext);
  if (!context) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
};

export default DynamicThemeProvider;