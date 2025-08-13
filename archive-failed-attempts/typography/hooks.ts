import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTypography } from './TypographyProvider';

interface AccessibilityMetrics {
  contrastRatio: number;
  textSize: number;
  lineHeight: number;
  letterSpacing: number;
  readability: number;
  compliance: {
    wcag21AA: boolean;
    wcag21AAA: boolean;
    section508: boolean;
  };
}

interface ContrastRatio {
  ratio: number;
  level: 'fail' | 'aa-large' | 'aa' | 'aaa';
  score: number;
}

interface ColorValues {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export const useTypographyScale = () => {
  const { theme } = useTypography();
  return theme.scale;
};

export const useSpacing = () => {
  const { getSpacing } = useTypography();
  return getSpacing;
};

export const useTextSizing = () => {
  const { getTextSize, getLineHeight, getLetterSpacing } = useTypography();
  return { getTextSize, getLineHeight, getLetterSpacing };
};

export const useGoldenRatioSpacing = () => {
  return useMemo(() => {
    const GOLDEN_RATIO = 1.618;
    const FIBONACCI_SEQUENCE = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    
    return {
      calculate: (baseSize: number, multiplier: number = 1) => {
        const golden = baseSize * GOLDEN_RATIO * multiplier;
        const fibonacci = FIBONACCI_SEQUENCE.map(num => baseSize * num * multiplier);
        
        return {
          golden,
          fibonacci,
          harmonious: golden / GOLDEN_RATIO,
          optimal: Math.sqrt(golden * (golden / GOLDEN_RATIO)),
        };
      },
      
      getVerticalRhythm: (baseLineHeight: number) => {
        const golden = baseLineHeight * GOLDEN_RATIO;
        return {
          base: baseLineHeight,
          golden,
          half: golden / 2,
          quarter: golden / 4,
          double: golden * 2,
        };
      },
      
      getHorizontalFlow: (baseWidth: number) => {
        const golden = baseWidth * GOLDEN_RATIO;
        return {
          content: baseWidth,
          sidebar: baseWidth / GOLDEN_RATIO,
          margin: (golden - baseWidth) / 2,
          optimal: golden,
        };
      },
    };
  }, []);
};

export const useReadingFlow = () => {
  const { getSpacing } = useTypography();
  
  return {
    optimizeForReading: (content: string, contentType: string = 'article') => {
      const words = content.split(/\s+/).length;
      const sentences = content.split(/[.!?]+/).length;
      const avgWordsPerSentence = words / sentences;
      
      return {
        optimalWidth: Math.min(75, Math.max(45, Math.floor(words / 10))),
        lineHeight: avgWordsPerSentence > 20 ? 1.6 : 1.4,
        paragraphSpacing: getSpacing('md') * (avgWordsPerSentence > 15 ? 1.8 : 1.2),
        readingTime: Math.ceil(words / 200),
        scanPattern: contentType === 'article' ? 'F' : 
                    contentType === 'list' ? 'Z' : 'layer-cake',
      };
    },
    
    calculateReadingDifficulty: (text: string) => {
      const words = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).length;
      const syllables = text.match(/[aeiouy]+/gi)?.length || 0;
      
      const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
      
      return {
        score: Math.max(0, Math.min(100, fleschScore)),
        difficulty: fleschScore > 90 ? 'very easy' :
                   fleschScore > 80 ? 'easy' :
                   fleschScore > 70 ? 'fairly easy' :
                   fleschScore > 60 ? 'standard' :
                   fleschScore > 50 ? 'fairly difficult' :
                   fleschScore > 30 ? 'difficult' : 'very difficult',
      };
    },
  };
};

export const useDynamicTextSizing = () => {
  const { getTextSize, textScaleFactor, isAccessibilityMode } = useTypography();
  const [userPreferences, setUserPreferences] = useState({
    fontSize: 100,
    reducedMotion: false,
  });
  
  const detectUserPreferences = useCallback(() => {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const browserDefault = 16;
    const userPreference = (rootFontSize / browserDefault) * 100;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setUserPreferences({
      fontSize: userPreference,
      reducedMotion,
    });
  }, []);
  
  const calculateOptimalSize = useCallback((
    variant: string,
    containerWidth?: number,
    textWidth?: number
  ) => {
    let baseSize = getTextSize(variant as 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2');
    
    baseSize *= (userPreferences.fontSize / 100);
    baseSize *= textScaleFactor;
    
    if (isAccessibilityMode) {
      baseSize *= 1.2;
    }
    
    if (containerWidth && textWidth && textWidth > containerWidth) {
      const scaleFactor = containerWidth / textWidth;
      baseSize *= Math.max(0.8, scaleFactor);
    }
    
    return Math.max(12, Math.min(72, baseSize));
  }, [getTextSize, userPreferences, textScaleFactor, isAccessibilityMode]);
  
  useEffect(() => {
    detectUserPreferences();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', detectUserPreferences);
    
    return () => {
      mediaQuery.removeEventListener('change', detectUserPreferences);
    };
  }, [detectUserPreferences]);
  
  return {
    calculateOptimalSize,
    userPreferences,
    detectUserPreferences,
  };
};

export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('dark');
  
  const detectHighContrast = useCallback(() => {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersMore = window.matchMedia('(prefers-contrast: more)').matches;
    const forcedColors = window.matchMedia('(forced-colors: active)').matches;
    
    return prefersHighContrast || prefersMore || forcedColors;
  }, []);
  
  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => !prev);
  }, []);
  
  const switchTheme = useCallback((theme: string) => {
    setCurrentTheme(theme);
  }, []);
  
  useEffect(() => {
    const detected = detectHighContrast();
    setIsHighContrast(detected);
    
    if (detected) {
      const savedTheme = localStorage.getItem('high-contrast-theme');
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, [detectHighContrast]);
  
  return {
    isHighContrast,
    currentTheme,
    toggleHighContrast,
    switchTheme,
    detectHighContrast,
  };
};

export const useTypographyColorIntegration = () => {
  const { validateColors } = useContrastValidator();
  
  const getOptimalTextColor = useCallback((backgroundColor: string, priority: string = 'primary') => {
    const lightText = '#ffffff';
    const darkText = '#000000';
    
    const lightResult = validateColors(lightText, backgroundColor);
    const darkResult = validateColors(darkText, backgroundColor);
    
    const bestChoice = (lightResult?.ratio || 0) > (darkResult?.ratio || 0) ? lightText : darkText;
    
    const priorityAdjustment = {
      primary: bestChoice,
      secondary: bestChoice === lightText ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
      tertiary: bestChoice === lightText ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    };
    
    return priorityAdjustment[priority as keyof typeof priorityAdjustment] || bestChoice;
  }, [validateColors]);
  
  const getSemanticColorPalette = useCallback((semanticType: string) => {
    const palettes = {
      success: ['#10b981', '#065f46', '#d1fae5'],
      warning: ['#f59e0b', '#92400e', '#fef3c7'],
      error: ['#ef4444', '#991b1b', '#fee2e2'],
      info: ['#3b82f6', '#1e40af', '#dbeafe'],
      default: ['var(--color-primary)', 'var(--color-text-primary)', 'var(--color-background-primary)'],
    };
    
    return palettes[semanticType as keyof typeof palettes] || palettes.default;
  }, []);
  
  const adjustColorLuminance = useCallback((color: string, amount: number) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : null;
    };
    
    const rgbToHex = (r: number, g: number, b: number) => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };
    
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    
    const adjust = (value: number) => {
      const adjusted = Math.round(value * (1 + amount));
      return Math.max(0, Math.min(255, adjusted));
    };
    
    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  }, []);
  
  const generateAccessiblePalette = useCallback((baseColor: string) => {
    const colors = [];
    const baseResult = validateColors('#ffffff', baseColor);
    
    if (baseResult && baseResult.ratio < 4.5) {
      colors.push(baseColor);
      
      const darkerVariant = adjustColorLuminance(baseColor, -0.3);
      const lighterVariant = adjustColorLuminance(baseColor, 0.3);
      
      colors.push(darkerVariant, lighterVariant);
    } else {
      colors.push(baseColor);
    }
    
    return colors;
  }, [validateColors, adjustColorLuminance]);
  
  return {
    getOptimalTextColor,
    getSemanticColorPalette,
    generateAccessiblePalette,
    adjustColorLuminance,
  };
};

export const useAccessibilityCompliance = () => {
  const { validateColors } = useContrastValidator();
  const [auditResults, setAuditResults] = useState<AccessibilityMetrics | null>(null);
  
  const auditElement = useCallback((element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    const textColor = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    let contrastRatio = 4.5;
    if (textColor && backgroundColor) {
      const result = validateColors(textColor, backgroundColor);
      contrastRatio = result?.ratio || 4.5;
    }
    
    const textSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) / textSize;
    const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0;
    
    const words = element.textContent?.split(/\s+/).length || 0;
    const sentences = element.textContent?.split(/[.!?]+/).length || 0;
    const syllables = element.textContent?.match(/[aeiouy]+/gi)?.length || 0;
    
    const readability = sentences > 0 && words > 0 ? 
      206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words)) : 0;
    
    const metrics = {
      contrastRatio,
      textSize,
      lineHeight,
      letterSpacing,
      readability: Math.max(0, Math.min(100, readability)),
      compliance: {
        wcag21AA: contrastRatio >= 4.5 && textSize >= 16 && lineHeight >= 1.4,
        wcag21AAA: contrastRatio >= 7 && textSize >= 18 && lineHeight >= 1.5,
        section508: contrastRatio >= 3 && textSize >= 14 && lineHeight >= 1.3,
      },
    };
    
    setAuditResults(metrics);
    return metrics;
  }, [validateColors]);
  
  return { auditElement, auditResults };
};

export const useContrastValidator = () => {
  const [contrastRatio, setContrastRatio] = useState<ContrastRatio | null>(null);
  
  const validateColors = useCallback((textColor: string, backgroundColor: string, fontSize: number = 16, fontWeight: number = 400) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : null;
    };
    
    const getLuminance = (color: ColorValues) => {
      const sRGB = [color.r, color.g, color.b].map((c: number) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const bgColor = hexToRgb(backgroundColor);
    const txtColor = hexToRgb(textColor);
    
    if (!bgColor || !txtColor) return null;
    
    const lum1 = getLuminance(txtColor);
    const lum2 = getLuminance(bgColor);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    
    let level = 'fail';
    if (isLargeText) {
      if (ratio >= 3) level = 'aa-large';
      if (ratio >= 4.5) level = 'aaa';
    } else {
      if (ratio >= 4.5) level = 'aa';
      if (ratio >= 7) level = 'aaa';
    }
    
    const score = Math.min(100, (ratio / 21) * 100);
    
    const result = { ratio, level, score };
    setContrastRatio(result);
    return result;
  }, []);
  
  return { validateColors, contrastRatio };
};