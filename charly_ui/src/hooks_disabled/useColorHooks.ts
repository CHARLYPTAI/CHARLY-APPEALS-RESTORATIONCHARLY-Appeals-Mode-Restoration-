import { useCallback, useEffect, useState, useRef } from 'react';
import { useAdaptiveColor } from '../components/color/AdaptiveColorEngine';
import { useSentimentColor } from '../components/color/SentimentColorMapper';
import { useColorAccessibility } from '../components/color/ColorAccessibilityProvider';
import { useDynamicTheme } from '../components/color/DynamicThemeProvider';
import { useColorPalette } from '../components/color/ColorPaletteManager';
import { useRealTimeColorAdapter } from '../components/color/RealTimeColorAdapter';
import { useColorTransitionOrchestrator } from '../components/color/ColorTransitionOrchestrator';

// Hook for automatic color updates based on data
export const useDataDrivenColors = (data: any[]) => {
  const { applyColorMapping, analyzeSentiment, createDataVisualizationPalette } = useSentimentColor();
  const [colors, setColors] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      // Analyze overall sentiment
      const overallSentiment = data.reduce((acc, item) => {
        const itemSentiment = analyzeSentiment(item);
        return {
          score: acc.score + itemSentiment.score,
          confidence: acc.confidence + itemSentiment.confidence,
          count: acc.count + 1
        };
      }, { score: 0, confidence: 0, count: 0 });

      const avgSentiment = {
        overall: overallSentiment.score > 0.1 ? 'positive' : overallSentiment.score < -0.1 ? 'negative' : 'neutral',
        score: overallSentiment.score / overallSentiment.count,
        confidence: overallSentiment.confidence / overallSentiment.count
      };

      setSentiment(avgSentiment);
      applyColorMapping(avgSentiment as any);

      // Create visualization palette
      const palette = createDataVisualizationPalette(data);
      setColors(palette);
    }
  }, [data, analyzeSentiment, applyColorMapping, createDataVisualizationPalette]);

  return { colors, sentiment };
};

// Hook for smooth color transitions
export const useColorTransition = (duration: number = 300) => {
  const { queueTransition, isTransitioning } = useColorTransitionOrchestrator();
  const { currentPalette } = useAdaptiveColor();
  const previousPaletteRef = useRef(currentPalette);

  const transitionTo = useCallback((newColors: { [key: string]: string }) => {
    queueTransition(
      previousPaletteRef.current as any,
      newColors,
      { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', delay: 0, stagger: 50 }
    );
    previousPaletteRef.current = { ...currentPalette, ...newColors };
  }, [queueTransition, duration, currentPalette]);

  return { transitionTo, isTransitioning };
};

// Hook for responsive color adjustments
export const useResponsiveColors = () => {
  const { updateColor } = useAdaptiveColor();
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Adjust colors based on screen size
    if (screenSize === 'mobile') {
      // Higher contrast for mobile
      updateColor('primary', '#006FE6');
      updateColor('text.primary', '#000000');
    } else if (screenSize === 'tablet') {
      // Balanced colors for tablet
      updateColor('primary', '#007AFF');
      updateColor('text.primary', '#1D1D1F');
    } else {
      // Full palette for desktop
      updateColor('primary', '#007AFF');
      updateColor('text.primary', '#1D1D1F');
    }
  }, [screenSize, updateColor]);

  return { screenSize };
};

// Hook for color accessibility testing
export const useColorAccessibilityTest = () => {
  const { checkContrast, getAccessibleColor, validateColorPalette } = useColorAccessibility();
  const { currentPalette } = useAdaptiveColor();
  const [accessibilityReport, setAccessibilityReport] = useState<any>(null);

  const testPalette = useCallback(() => {
    const report = validateColorPalette(currentPalette);
    setAccessibilityReport(report);
    return report;
  }, [validateColorPalette, currentPalette]);

  const testContrast = useCallback((foreground: string, background: string) => {
    return checkContrast(foreground, background);
  }, [checkContrast]);

  const makeAccessible = useCallback((color: string, backgroundColor: string) => {
    return getAccessibleColor(color, backgroundColor);
  }, [getAccessibleColor]);

  useEffect(() => {
    testPalette();
  }, [testPalette]);

  return { accessibilityReport, testContrast, makeAccessible, testPalette };
};

// Hook for theme-aware colors
export const useThemeAwareColors = () => {
  const { isDarkMode, currentPalette } = useAdaptiveColor();
  const { currentTheme } = useDynamicTheme();

  const getThemeColor = useCallback((lightColor: string, darkColor: string) => {
    return isDarkMode ? darkColor : lightColor;
  }, [isDarkMode]);

  const getContrastColor = useCallback((backgroundColor: string) => {
    // Simple contrast calculation
    const rgb = backgroundColor.match(/\w\w/g);
    if (!rgb) return '#000000';
    
    const [r, g, b] = rgb.map(x => parseInt(x, 16));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }, []);

  return {
    getThemeColor,
    getContrastColor,
    isDarkMode,
    currentTheme,
    palette: currentPalette
  };
};

// Hook for brand color consistency
export const useBrandColors = () => {
  const { brandColors, setBrandColors, validateBrandConsistency } = useColorPalette();
  const { updateColor } = useAdaptiveColor();
  const [consistencyReport, setConsistencyReport] = useState<any>(null);

  const updateBrandColor = useCallback((category: keyof typeof brandColors, color: string) => {
    setBrandColors({ [category]: color });
    updateColor(category, color);
  }, [setBrandColors, updateColor]);

  const validateConsistency = useCallback(() => {
    const report = validateBrandConsistency(brandColors);
    setConsistencyReport(report);
    return report;
  }, [validateBrandConsistency, brandColors]);

  useEffect(() => {
    validateConsistency();
  }, [validateConsistency]);

  return {
    brandColors,
    updateBrandColor,
    consistencyReport,
    validateConsistency
  };
};

// Hook for performance-aware color updates
export const usePerformantColors = () => {
  const { performanceMetrics, updateColor } = useAdaptiveColor();
  const { setBatchMode } = useColorTransitionOrchestrator();
  const updateQueueRef = useRef<{ [key: string]: string }>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdateColor = useCallback((key: string, color: string) => {
    updateQueueRef.current[key] = color;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      Object.entries(updateQueueRef.current).forEach(([k, c]) => {
        updateColor(k, c);
      });
      updateQueueRef.current = {};
    }, 16); // Next frame
  }, [updateColor]);

  useEffect(() => {
    // Enable batch mode if performance is poor
    if (performanceMetrics.frameRate < 30 || performanceMetrics.transitionTime > 100) {
      setBatchMode(true);
    } else {
      setBatchMode(false);
    }
  }, [performanceMetrics, setBatchMode]);

  return {
    batchUpdateColor,
    performanceMetrics,
    isBatchMode: performanceMetrics.frameRate < 30 || performanceMetrics.transitionTime > 100
  };
};

// Hook for color learning and adaptation
export const useColorLearning = () => {
  const { 
    recordInteraction, 
    predictPreferredColor, 
    getPersonalizationScore,
    isLearningEnabled,
    setLearningEnabled
  } = useRealTimeColorAdapter();
  const [personalizationScore, setPersonalizationScore] = useState(0);

  const trackColorUsage = useCallback((color: string, context?: string) => {
    if (isLearningEnabled) {
      recordInteraction(color, context || 'general');
    }
  }, [recordInteraction, isLearningEnabled]);

  const getPredictedColor = useCallback((context: string) => {
    return predictPreferredColor(context);
  }, [predictPreferredColor]);

  useEffect(() => {
    const score = getPersonalizationScore();
    setPersonalizationScore(score);
  }, [getPersonalizationScore]);

  return {
    trackColorUsage,
    getPredictedColor,
    personalizationScore,
    isLearningEnabled,
    setLearningEnabled
  };
};

// Hook for color animation sequences
export const useColorAnimations = () => {
  const { createSequence, playSequence } = useColorTransitionOrchestrator();
  const [sequences, setSequences] = useState<Map<string, any>>(new Map());

  const createColorSequence = useCallback((name: string, keyframes: any[], duration: number = 1000) => {
    const sequence = createSequence(name, keyframes, {
      duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0,
      stagger: 50
    });
    setSequences(prev => new Map(prev).set(sequence.id, sequence));
    return sequence.id;
  }, [createSequence]);

  const playColorSequence = useCallback((sequenceId: string) => {
    playSequence(sequenceId);
  }, [playSequence]);

  // Preset animations
  const fadeIn = useCallback((colors: { [key: string]: string }, duration: number = 300) => {
    const keyframes = [
      { progress: 0, properties: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, v + '00'])) },
      { progress: 1, properties: colors }
    ];
    const sequenceId = createColorSequence('fadeIn', keyframes, duration);
    playColorSequence(sequenceId);
  }, [createColorSequence, playColorSequence]);

  const pulse = useCallback((color: string, duration: number = 1000) => {
    const keyframes = [
      { progress: 0, properties: { primary: color } },
      { progress: 0.5, properties: { primary: adjustBrightness(color, 20) } },
      { progress: 1, properties: { primary: color } }
    ];
    const sequenceId = createColorSequence('pulse', keyframes, duration);
    playColorSequence(sequenceId);
  }, [createColorSequence, playColorSequence]);

  return {
    createColorSequence,
    playColorSequence,
    fadeIn,
    pulse,
    sequences
  };
};

// Utility function for color adjustment
const adjustBrightness = (color: string, amount: number): string => {
  const rgb = color.match(/\w\w/g);
  if (!rgb) return color;
  
  const [r, g, b] = rgb.map(x => {
    const val = parseInt(x, 16) + amount;
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
  });
  
  return `#${r}${g}${b}`;
};

// Master hook that combines all color functionality
export const useColorSystem = () => {
  const adaptiveColor = useAdaptiveColor();
  const sentimentColor = useSentimentColor();
  const accessibility = useColorAccessibility();
  const dynamicTheme = useDynamicTheme();
  const palette = useColorPalette();
  const adapter = useRealTimeColorAdapter();
  const orchestrator = useColorTransitionOrchestrator();

  return {
    adaptive: adaptiveColor,
    sentiment: sentimentColor,
    accessibility,
    theme: dynamicTheme,
    palette,
    adapter,
    orchestrator
  };
};

export default {
  useDataDrivenColors,
  useColorTransition,
  useResponsiveColors,
  useColorAccessibilityTest,
  useThemeAwareColors,
  useBrandColors,
  usePerformantColors,
  useColorLearning,
  useColorAnimations,
  useColorSystem
};