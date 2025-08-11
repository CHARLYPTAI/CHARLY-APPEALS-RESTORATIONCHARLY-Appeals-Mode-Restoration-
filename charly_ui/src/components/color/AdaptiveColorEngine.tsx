import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  chart: {
    positive: string;
    negative: string;
    neutral: string;
    trend: string[];
  };
}

interface ColorTransition {
  property: string;
  from: string;
  to: string;
  duration: number;
  startTime: number;
}

interface PerformanceMetrics {
  transitionTime: number;
  frameRate: number;
  memoryUsage: number;
  colorCalculations: number;
}

interface AdaptiveColorContextType {
  currentPalette: ColorPalette;
  isDarkMode: boolean;
  colorBlindMode: string | null;
  transitionDuration: number;
  performanceMetrics: PerformanceMetrics;
  updateColor: (category: string, color: string) => void;
  toggleDarkMode: () => void;
  setColorBlindMode: (mode: string | null) => void;
  getContrastRatio: (color1: string, color2: string) => number;
  generatePalette: (baseColor: string) => ColorPalette;
  applyDataSentiment: (sentiment: 'positive' | 'negative' | 'neutral') => void;
}

const defaultLightPalette: ColorPalette = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    disabled: '#C7C7CC'
  },
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF'
  },
  chart: {
    positive: '#34C759',
    negative: '#FF3B30',
    neutral: '#8E8E93',
    trend: ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500']
  }
};

const defaultDarkPalette: ColorPalette = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  accent: '#FF453A',
  background: '#000000',
  surface: '#1C1C1E',
  text: {
    primary: '#FFFFFF',
    secondary: '#EBEBF5',
    disabled: '#48484A'
  },
  semantic: {
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#0A84FF'
  },
  chart: {
    positive: '#32D74B',
    negative: '#FF453A',
    neutral: '#98989D',
    trend: ['#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FF9F0A']
  }
};

const AdaptiveColorContext = createContext<AdaptiveColorContextType | undefined>(undefined);

export const AdaptiveColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(defaultLightPalette);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<string | null>(null);
  const [transitionDuration, setTransitionDuration] = useState(200);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    transitionTime: 0,
    frameRate: 60,
    memoryUsage: 0,
    colorCalculations: 0
  });

  const transitionsRef = useRef<ColorTransition[]>([]);
  const metricsRef = useRef<{ startTime: number; calculations: number }>({
    startTime: Date.now(),
    calculations: 0
  });
  const animationFrameRef = useRef<number>();

  // Performance monitoring
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const memory = (performance as any).memory;
    
    setPerformanceMetrics(prev => ({
      ...prev,
      transitionTime: transitionsRef.current.length > 0 
        ? Math.max(...transitionsRef.current.map(t => now - t.startTime))
        : 0,
      memoryUsage: memory ? memory.usedJSHeapSize / 1048576 : 0,
      colorCalculations: metricsRef.current.calculations
    }));

    metricsRef.current.calculations = 0;
  }, []);

  // Frame rate monitoring
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFrameRate = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setPerformanceMetrics(prev => ({
          ...prev,
          frameRate: Math.round(frames * 1000 / (currentTime - lastTime))
        }));
        frames = 0;
        lastTime = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(measureFrameRate);
    };
    
    animationFrameRef.current = requestAnimationFrame(measureFrameRate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Color calculation functions
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const getContrastRatio = useCallback((color1: string, color2: string): number => {
    metricsRef.current.calculations++;
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }, []);

  // Color blind adjustments
  const applyColorBlindFilter = useCallback((color: string, mode: string): string => {
    metricsRef.current.calculations++;
    const rgb = hexToRgb(color);
    let { r, g, b } = rgb;

    switch (mode) {
      case 'protanopia':
        // Red-blind
        r = 0.567 * r + 0.433 * g;
        g = 0.558 * r + 0.442 * g;
        b = 0.242 * g + 0.758 * b;
        break;
      case 'deuteranopia':
        // Green-blind
        r = 0.625 * r + 0.375 * g;
        g = 0.7 * r + 0.3 * g;
        b = 0.3 * g + 0.7 * b;
        break;
      case 'tritanopia':
        // Blue-blind
        r = 0.95 * r + 0.05 * g;
        g = 0.433 * g + 0.567 * b;
        b = 0.475 * g + 0.525 * b;
        break;
      case 'achromatopsia':
        // Complete color blindness
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
        break;
      case 'protanomaly':
        // Red-weak
        r = 0.817 * r + 0.183 * g;
        g = 0.333 * r + 0.667 * g;
        b = 0.125 * g + 0.875 * b;
        break;
      case 'deuteranomaly':
        // Green-weak
        r = 0.8 * r + 0.2 * g;
        g = 0.258 * r + 0.742 * g;
        b = 0.142 * g + 0.858 * b;
        break;
      case 'tritanomaly':
        // Blue-weak
        r = 0.967 * r + 0.033 * g;
        g = 0.733 * g + 0.267 * b;
        b = 0.183 * g + 0.817 * b;
        break;
      case 'achromatomaly':
        // Partial color blindness
        const gray2 = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r * 0.618 + gray2 * 0.382;
        g = g * 0.618 + gray2 * 0.382;
        b = b * 0.618 + gray2 * 0.382;
        break;
    }

    return rgbToHex(
      Math.round(Math.min(255, Math.max(0, r))),
      Math.round(Math.min(255, Math.max(0, g))),
      Math.round(Math.min(255, Math.max(0, b)))
    );
  }, []);

  // Generate color palette from base color
  const generatePalette = useCallback((baseColor: string): ColorPalette => {
    metricsRef.current.calculations++;
    const rgb = hexToRgb(baseColor);
    
    // Generate complementary colors
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const secondary = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
    const accent = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
    
    const palette: ColorPalette = {
      primary: baseColor,
      secondary,
      accent,
      background: isDarkMode ? '#000000' : '#FFFFFF',
      surface: isDarkMode ? '#1C1C1E' : '#F2F2F7',
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        secondary: isDarkMode ? '#EBEBF5' : '#3C3C43',
        disabled: isDarkMode ? '#48484A' : '#C7C7CC'
      },
      semantic: {
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        info: baseColor
      },
      chart: {
        positive: '#34C759',
        negative: '#FF3B30',
        neutral: '#8E8E93',
        trend: generateTrendColors(baseColor, 5)
      }
    };

    // Apply color blind filter if needed
    if (colorBlindMode) {
      return applyColorBlindFilterToPalette(palette, colorBlindMode);
    }

    return palette;
  }, [isDarkMode, colorBlindMode]);

  // Helper functions
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  };

  const generateTrendColors = (baseColor: string, count: number): string[] => {
    const colors: string[] = [];
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    for (let i = 0; i < count; i++) {
      const hue = (hsl.h + (i * 360 / count)) % 360;
      colors.push(hslToHex(hue, hsl.s, hsl.l));
    }
    
    return colors;
  };

  const applyColorBlindFilterToPalette = (palette: ColorPalette, mode: string): ColorPalette => {
    const filtered: any = {};
    
    const applyToObject = (obj: any): any => {
      if (typeof obj === 'string' && obj.startsWith('#')) {
        return applyColorBlindFilter(obj, mode);
      } else if (Array.isArray(obj)) {
        return obj.map(item => applyToObject(item));
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
          result[key] = applyToObject(obj[key]);
        }
        return result;
      }
      return obj;
    };
    
    return applyToObject(palette);
  };

  // Update functions
  const updateColor = useCallback((category: string, color: string) => {
    const startTime = performance.now();
    
    setCurrentPalette(prev => {
      const newPalette = { ...prev };
      const keys = category.split('.');
      let current: any = newPalette;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const oldColor = current[keys[keys.length - 1]];
      current[keys[keys.length - 1]] = color;
      
      // Track transition
      transitionsRef.current.push({
        property: category,
        from: oldColor,
        to: color,
        duration: transitionDuration,
        startTime
      });
      
      // Clean old transitions
      setTimeout(() => {
        transitionsRef.current = transitionsRef.current.filter(
          t => performance.now() - t.startTime < t.duration
        );
      }, transitionDuration);
      
      return newPalette;
    });
    
    measurePerformance();
  }, [transitionDuration, measurePerformance]);

  const toggleDarkMode = useCallback(() => {
    const startTime = performance.now();
    
    setIsDarkMode(prev => {
      const newMode = !prev;
      setCurrentPalette(newMode ? defaultDarkPalette : defaultLightPalette);
      
      // Track theme transition
      transitionsRef.current.push({
        property: 'theme',
        from: prev ? 'dark' : 'light',
        to: newMode ? 'dark' : 'light',
        duration: transitionDuration,
        startTime
      });
      
      return newMode;
    });
    
    measurePerformance();
  }, [transitionDuration, measurePerformance]);

  const applyDataSentiment = useCallback((sentiment: 'positive' | 'negative' | 'neutral') => {
    const sentimentColors = {
      positive: { primary: '#34C759', accent: '#32D74B' },
      negative: { primary: '#FF3B30', accent: '#FF453A' },
      neutral: { primary: '#8E8E93', accent: '#98989D' }
    };
    
    updateColor('primary', sentimentColors[sentiment].primary);
    updateColor('accent', sentimentColors[sentiment].accent);
  }, [updateColor]);

  // Auto-detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      setCurrentPalette(e.matches ? defaultDarkPalette : defaultLightPalette);
    };
    
    setIsDarkMode(mediaQuery.matches);
    setCurrentPalette(mediaQuery.matches ? defaultDarkPalette : defaultLightPalette);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply color blind mode
  useEffect(() => {
    if (colorBlindMode) {
      setCurrentPalette(prev => applyColorBlindFilterToPalette(prev, colorBlindMode));
      measurePerformance();
    }
  }, [colorBlindMode, measurePerformance]);

  const value: AdaptiveColorContextType = {
    currentPalette,
    isDarkMode,
    colorBlindMode,
    transitionDuration,
    performanceMetrics,
    updateColor,
    toggleDarkMode,
    setColorBlindMode,
    getContrastRatio,
    generatePalette,
    applyDataSentiment
  };

  return (
    <AdaptiveColorContext.Provider value={value}>
      {children}
    </AdaptiveColorContext.Provider>
  );
};

export const useAdaptiveColor = () => {
  const context = useContext(AdaptiveColorContext);
  if (!context) {
    throw new Error('useAdaptiveColor must be used within an AdaptiveColorProvider');
  }
  return context;
};

export default AdaptiveColorProvider;