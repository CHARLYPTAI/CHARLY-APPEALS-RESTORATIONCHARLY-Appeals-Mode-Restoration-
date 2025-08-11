import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface UserPreference {
  colorCategory: string;
  preferredColor: string;
  frequency: number;
  lastUsed: number;
  context: string;
}

interface ColorLearningData {
  timeOfDay: { [hour: string]: string };
  interactions: { [color: string]: number };
  contextualPreferences: { [context: string]: string };
  accessibility: {
    preferredContrast: number;
    colorBlindMode: string | null;
    fontSize: number;
  };
}

interface AdaptationRules {
  learningRate: number;
  adaptationThreshold: number;
  contextWeight: number;
  timeWeight: number;
  frequencyWeight: number;
}

interface RealTimeColorAdapterContextType {
  userPreferences: UserPreference[];
  learningData: ColorLearningData;
  adaptationRules: AdaptationRules;
  isLearningEnabled: boolean;
  setLearningEnabled: (enabled: boolean) => void;
  recordInteraction: (color: string, context: string) => void;
  predictPreferredColor: (context: string) => string;
  adaptToUserBehavior: () => void;
  resetLearning: () => void;
  exportLearningData: () => string;
  importLearningData: (data: string) => void;
  setAdaptationRules: (rules: Partial<AdaptationRules>) => void;
  getPersonalizationScore: () => number;
  getCurrentContext: () => string;
}

const defaultLearningData: ColorLearningData = {
  timeOfDay: {},
  interactions: {},
  contextualPreferences: {},
  accessibility: {
    preferredContrast: 4.5,
    colorBlindMode: null,
    fontSize: 16
  }
};

const defaultAdaptationRules: AdaptationRules = {
  learningRate: 0.1,
  adaptationThreshold: 5,
  contextWeight: 0.4,
  timeWeight: 0.3,
  frequencyWeight: 0.3
};

const RealTimeColorAdapterContext = createContext<RealTimeColorAdapterContextType | undefined>(undefined);

export const RealTimeColorAdapterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateColor, currentPalette, performanceMetrics } = useAdaptiveColor();
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([]);
  const [learningData, setLearningData] = useState<ColorLearningData>(defaultLearningData);
  const [adaptationRules, setAdaptationRules] = useState<AdaptationRules>(defaultAdaptationRules);
  const [isLearningEnabled, setIsLearningEnabled] = useState(true);
  const [currentContext, setCurrentContext] = useState<string>('general');

  const interactionBufferRef = useRef<{ color: string; context: string; timestamp: number }[]>([]);
  const adaptationTimeoutRef = useRef<NodeJS.Timeout>();

  // Context detection
  const getCurrentContext = useCallback((): string => {
    const hour = new Date().getHours();
    const url = window.location.pathname;
    
    // Time-based context
    if (hour >= 9 && hour <= 17) {
      return 'work';
    } else if (hour >= 18 && hour <= 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }, []);

  // Record user interaction with colors
  const recordInteraction = useCallback((color: string, context: string) => {
    if (!isLearningEnabled) return;

    const timestamp = Date.now();
    const hour = new Date().getHours().toString();

    // Add to interaction buffer
    interactionBufferRef.current.push({ color, context, timestamp });

    // Keep buffer size manageable
    if (interactionBufferRef.current.length > 100) {
      interactionBufferRef.current = interactionBufferRef.current.slice(-50);
    }

    // Update learning data
    setLearningData(prev => ({
      ...prev,
      timeOfDay: {
        ...prev.timeOfDay,
        [hour]: color
      },
      interactions: {
        ...prev.interactions,
        [color]: (prev.interactions[color] || 0) + 1
      },
      contextualPreferences: {
        ...prev.contextualPreferences,
        [context]: color
      }
    }));

    // Update user preferences
    setUserPreferences(prev => {
      const existingIndex = prev.findIndex(p => 
        p.colorCategory === context && p.preferredColor === color
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          frequency: updated[existingIndex].frequency + 1,
          lastUsed: timestamp
        };
        return updated;
      } else {
        return [...prev, {
          colorCategory: context,
          preferredColor: color,
          frequency: 1,
          lastUsed: timestamp,
          context
        }];
      }
    });
  }, [isLearningEnabled]);

  // Predict preferred color based on context
  const predictPreferredColor = useCallback((context: string): string => {
    if (!isLearningEnabled || userPreferences.length === 0) {
      return currentPalette.primary;
    }

    const currentTime = new Date().getHours();
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Calculate scores for each color
    const colorScores: { [color: string]: number } = {};

    userPreferences.forEach(pref => {
      if (!colorScores[pref.preferredColor]) {
        colorScores[pref.preferredColor] = 0;
      }

      // Context match weight
      const contextScore = pref.context === context ? adaptationRules.contextWeight : 0;

      // Time-based weight
      const timeScore = learningData.timeOfDay[currentTime.toString()] === pref.preferredColor ? 
        adaptationRules.timeWeight : 0;

      // Frequency weight (normalized)
      const maxFreq = Math.max(...userPreferences.map(p => p.frequency));
      const frequencyScore = (pref.frequency / maxFreq) * adaptationRules.frequencyWeight;

      // Recency weight (less weight for older preferences)
      const recencyScore = Math.max(0, 1 - (now - pref.lastUsed) / dayInMs) * 0.1;

      colorScores[pref.preferredColor] += contextScore + timeScore + frequencyScore + recencyScore;
    });

    // Find the highest scoring color
    const bestColor = Object.entries(colorScores).reduce((best, [color, score]) => 
      score > best.score ? { color, score } : best, 
      { color: currentPalette.primary, score: 0 }
    );

    return bestColor.color;
  }, [isLearningEnabled, userPreferences, currentPalette.primary, learningData, adaptationRules]);

  // Adapt colors to user behavior
  const adaptToUserBehavior = useCallback(() => {
    if (!isLearningEnabled || userPreferences.length < adaptationRules.adaptationThreshold) {
      return;
    }

    const context = getCurrentContext();
    const predictedColor = predictPreferredColor(context);
    
    // Only adapt if the predicted color is different from current
    if (predictedColor !== currentPalette.primary) {
      updateColor('primary', predictedColor);
    }

    // Adapt accessibility preferences
    const accessibilityPrefs = userPreferences.filter(p => p.colorCategory === 'accessibility');
    if (accessibilityPrefs.length > 0) {
      const avgContrast = accessibilityPrefs.reduce((sum, p) => {
        const contrast = parseFloat(p.preferredColor) || 4.5;
        return sum + contrast;
      }, 0) / accessibilityPrefs.length;

      setLearningData(prev => ({
        ...prev,
        accessibility: {
          ...prev.accessibility,
          preferredContrast: avgContrast
        }
      }));
    }
  }, [isLearningEnabled, userPreferences, adaptationRules, getCurrentContext, predictPreferredColor, currentPalette.primary, updateColor]);

  // Reset all learning data
  const resetLearning = useCallback(() => {
    setUserPreferences([]);
    setLearningData(defaultLearningData);
    interactionBufferRef.current = [];
    localStorage.removeItem('colorLearningData');
    localStorage.removeItem('userColorPreferences');
  }, []);

  // Export learning data
  const exportLearningData = useCallback((): string => {
    const exportData = {
      userPreferences,
      learningData,
      adaptationRules,
      exportTimestamp: Date.now()
    };
    return JSON.stringify(exportData, null, 2);
  }, [userPreferences, learningData, adaptationRules]);

  // Import learning data
  const importLearningData = useCallback((data: string) => {
    try {
      const importedData = JSON.parse(data);
      if (importedData.userPreferences) {
        setUserPreferences(importedData.userPreferences);
      }
      if (importedData.learningData) {
        setLearningData(importedData.learningData);
      }
      if (importedData.adaptationRules) {
        setAdaptationRules(importedData.adaptationRules);
      }
    } catch (error) {
      console.error('Failed to import learning data:', error);
    }
  }, []);

  // Get personalization score (0-100)
  const getPersonalizationScore = useCallback((): number => {
    if (!isLearningEnabled || userPreferences.length === 0) {
      return 0;
    }

    const totalInteractions = Object.values(learningData.interactions).reduce((sum, count) => sum + count, 0);
    const uniqueContexts = new Set(userPreferences.map(p => p.context)).size;
    const timeSlots = Object.keys(learningData.timeOfDay).length;

    // Calculate score based on data richness
    const interactionScore = Math.min(30, totalInteractions / 2); // Max 30 points
    const contextScore = Math.min(30, uniqueContexts * 10); // Max 30 points
    const timeScore = Math.min(25, timeSlots * 2); // Max 25 points
    const consistencyScore = Math.min(15, userPreferences.length / 5); // Max 15 points

    return Math.round(interactionScore + contextScore + timeScore + consistencyScore);
  }, [isLearningEnabled, userPreferences, learningData]);

  // Automatic adaptation based on performance
  useEffect(() => {
    if (isLearningEnabled && performanceMetrics.transitionTime > 0) {
      // If transitions are slow, reduce adaptation frequency
      if (performanceMetrics.transitionTime > 100) {
        setAdaptationRules(prev => ({
          ...prev,
          learningRate: Math.max(0.05, prev.learningRate - 0.01)
        }));
      } else if (performanceMetrics.transitionTime < 50) {
        // If transitions are fast, increase adaptation frequency
        setAdaptationRules(prev => ({
          ...prev,
          learningRate: Math.min(0.2, prev.learningRate + 0.01)
        }));
      }
    }
  }, [isLearningEnabled, performanceMetrics.transitionTime]);

  // Periodic adaptation
  useEffect(() => {
    if (isLearningEnabled) {
      const adaptationInterval = setInterval(() => {
        adaptToUserBehavior();
      }, 60000); // Check every minute

      return () => clearInterval(adaptationInterval);
    }
  }, [isLearningEnabled, adaptToUserBehavior]);

  // Context tracking
  useEffect(() => {
    const updateContext = () => {
      const newContext = getCurrentContext();
      if (newContext !== currentContext) {
        setCurrentContext(newContext);
      }
    };

    // Update context every 30 seconds
    const contextInterval = setInterval(updateContext, 30000);
    updateContext(); // Initial update

    return () => clearInterval(contextInterval);
  }, [getCurrentContext, currentContext]);

  // Debounced batch processing of interactions
  useEffect(() => {
    if (interactionBufferRef.current.length > 0) {
      if (adaptationTimeoutRef.current) {
        clearTimeout(adaptationTimeoutRef.current);
      }

      adaptationTimeoutRef.current = setTimeout(() => {
        // Process buffered interactions
        const interactions = interactionBufferRef.current;
        if (interactions.length >= adaptationRules.adaptationThreshold) {
          adaptToUserBehavior();
        }
      }, 5000); // Process after 5 seconds of inactivity
    }
  }, [userPreferences, adaptationRules.adaptationThreshold, adaptToUserBehavior]);

  // Persist learning data
  useEffect(() => {
    if (isLearningEnabled) {
      localStorage.setItem('colorLearningData', JSON.stringify(learningData));
      localStorage.setItem('userColorPreferences', JSON.stringify(userPreferences));
    }
  }, [isLearningEnabled, learningData, userPreferences]);

  // Load persisted learning data
  useEffect(() => {
    const savedLearningData = localStorage.getItem('colorLearningData');
    const savedPreferences = localStorage.getItem('userColorPreferences');

    if (savedLearningData) {
      try {
        setLearningData(JSON.parse(savedLearningData));
      } catch (error) {
        console.error('Failed to load learning data:', error);
      }
    }

    if (savedPreferences) {
      try {
        setUserPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (adaptationTimeoutRef.current) {
        clearTimeout(adaptationTimeoutRef.current);
      }
    };
  }, []);

  const value: RealTimeColorAdapterContextType = {
    userPreferences,
    learningData,
    adaptationRules,
    isLearningEnabled,
    setLearningEnabled: setIsLearningEnabled,
    recordInteraction,
    predictPreferredColor,
    adaptToUserBehavior,
    resetLearning,
    exportLearningData,
    importLearningData,
    setAdaptationRules,
    getPersonalizationScore,
    getCurrentContext
  };

  return (
    <RealTimeColorAdapterContext.Provider value={value}>
      {children}
    </RealTimeColorAdapterContext.Provider>
  );
};

export const useRealTimeColorAdapter = () => {
  const context = useContext(RealTimeColorAdapterContext);
  if (!context) {
    throw new Error('useRealTimeColorAdapter must be used within a RealTimeColorAdapterProvider');
  }
  return context;
};

// Hook for automatic interaction tracking
export const useColorInteractionTracker = () => {
  const { recordInteraction, getCurrentContext } = useRealTimeColorAdapter();

  const trackInteraction = useCallback((color: string, additionalContext?: string) => {
    const context = additionalContext || getCurrentContext();
    recordInteraction(color, context);
  }, [recordInteraction, getCurrentContext]);

  return { trackInteraction };
};

export default RealTimeColorAdapterProvider;