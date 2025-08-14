import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface ColorBlindnessTypes {
  protanopia: 'Red-blind (missing L-cones)';
  deuteranopia: 'Green-blind (missing M-cones)';
  tritanopia: 'Blue-blind (missing S-cones)';
  achromatopsia: 'Complete color blindness';
  protanomaly: 'Red-weak (anomalous L-cones)';
  deuteranomaly: 'Green-weak (anomalous M-cones)';
  tritanomaly: 'Blue-weak (anomalous S-cones)';
  achromatomaly: 'Partial color blindness';
}

interface ContrastLevel {
  level: 'AA' | 'AAA';
  normalText: number;
  largeText: number;
  graphicalElements: number;
}

interface AccessibilityMetrics {
  contrastRatio: number;
  wcagCompliance: 'AA' | 'AAA' | 'fail';
  colorBlindSafety: boolean;
  readabilityScore: number;
  differentiationScore: number;
}

interface ColorAccessibilityContextType {
  colorBlindMode: keyof ColorBlindnessTypes | null;
  setColorBlindMode: (mode: keyof ColorBlindnessTypes | null) => void;
  highContrastMode: boolean;
  setHighContrastMode: (enabled: boolean) => void;
  reducedMotionMode: boolean;
  setReducedMotionMode: (enabled: boolean) => void;
  textSizeMultiplier: number;
  setTextSizeMultiplier: (multiplier: number) => void;
  checkContrast: (foreground: string, background: string) => AccessibilityMetrics;
  getAccessibleColor: (originalColor: string, backgroundColor: string) => string;
  validateColorPalette: (palette: any) => { valid: boolean; issues: string[] };
  isColorBlindSafe: (colors: string[]) => boolean;
  generateAccessiblePalette: (baseColor: string) => string[];
  accessibilityReport: AccessibilityMetrics | null;
}

const contrastLevels: { [key: string]: ContrastLevel } = {
  AA: {
    level: 'AA',
    normalText: 4.5,
    largeText: 3.0,
    graphicalElements: 3.0
  },
  AAA: {
    level: 'AAA',
    normalText: 7.0,
    largeText: 4.5,
    graphicalElements: 4.5
  }
};

const ColorAccessibilityContext = createContext<ColorAccessibilityContextType | undefined>(undefined);

export const ColorAccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setColorBlindMode: setEngineColorBlindMode, getContrastRatio, currentPalette } = useAdaptiveColor();
  const [colorBlindMode, setColorBlindMode] = useState<keyof ColorBlindnessTypes | null>(null);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotionMode, setReducedMotionMode] = useState(false);
  const [textSizeMultiplier, setTextSizeMultiplier] = useState(1.0);
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityMetrics | null>(null);

  // Color transformation matrices for different types of color blindness
  const colorBlindMatrices = {
    protanopia: [
      [0.567, 0.433, 0.000],
      [0.558, 0.442, 0.000],
      [0.000, 0.242, 0.758]
    ],
    deuteranopia: [
      [0.625, 0.375, 0.000],
      [0.700, 0.300, 0.000],
      [0.000, 0.300, 0.700]
    ],
    tritanopia: [
      [0.950, 0.050, 0.000],
      [0.000, 0.433, 0.567],
      [0.000, 0.475, 0.525]
    ],
    protanomaly: [
      [0.817, 0.183, 0.000],
      [0.333, 0.667, 0.000],
      [0.000, 0.125, 0.875]
    ],
    deuteranomaly: [
      [0.800, 0.200, 0.000],
      [0.258, 0.742, 0.000],
      [0.000, 0.142, 0.858]
    ],
    tritanomaly: [
      [0.967, 0.033, 0.000],
      [0.000, 0.733, 0.267],
      [0.000, 0.183, 0.817]
    ]
  };

  // Helper functions
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

  // Advanced contrast checking
  const checkContrast = useCallback((foreground: string, background: string): AccessibilityMetrics => {
    const contrastRatio = getContrastRatio(foreground, background);
    
    let wcagCompliance: 'AA' | 'AAA' | 'fail' = 'fail';
    if (contrastRatio >= contrastLevels.AAA.normalText) {
      wcagCompliance = 'AAA';
    } else if (contrastRatio >= contrastLevels.AA.normalText) {
      wcagCompliance = 'AA';
    }

    // Check color blind safety
    const colorBlindSafety = isColorBlindSafe([foreground, background]);
    
    // Calculate readability score (0-100)
    const maxContrast = 21;
    const readabilityScore = Math.min(100, (contrastRatio / maxContrast) * 100);
    
    // Calculate differentiation score
    const foregroundLum = getLuminance(foreground);
    const backgroundLum = getLuminance(background);
    const differentiationScore = Math.abs(foregroundLum - backgroundLum) * 100;

    return {
      contrastRatio,
      wcagCompliance,
      colorBlindSafety,
      readabilityScore,
      differentiationScore
    };
  }, [getContrastRatio]);

  // Get accessible color by adjusting brightness/contrast
  const getAccessibleColor = useCallback((originalColor: string, backgroundColor: string): string => {
    const currentContrast = getContrastRatio(originalColor, backgroundColor);
    
    if (currentContrast >= contrastLevels.AA.normalText) {
      return originalColor;
    }

    const rgb = hexToRgb(originalColor);
    const backgroundLum = getLuminance(backgroundColor);
    
    // Determine if we need to make the color lighter or darker
    const shouldLighten = backgroundLum < 0.5;
    
    let adjustedColor = originalColor;
    let iterations = 0;
    const maxIterations = 50;
    
    while (getContrastRatio(adjustedColor, backgroundColor) < contrastLevels.AA.normalText && iterations < maxIterations) {
      const currentRgb = hexToRgb(adjustedColor);
      
      if (shouldLighten) {
        // Lighten the color
        const factor = 1.1;
        adjustedColor = rgbToHex(
          Math.min(255, Math.floor(currentRgb.r * factor)),
          Math.min(255, Math.floor(currentRgb.g * factor)),
          Math.min(255, Math.floor(currentRgb.b * factor))
        );
      } else {
        // Darken the color
        const factor = 0.9;
        adjustedColor = rgbToHex(
          Math.max(0, Math.floor(currentRgb.r * factor)),
          Math.max(0, Math.floor(currentRgb.g * factor)),
          Math.max(0, Math.floor(currentRgb.b * factor))
        );
      }
      
      iterations++;
    }
    
    return adjustedColor;
  }, [getContrastRatio]);

  // Validate color palette for accessibility
  const validateColorPalette = useCallback((palette: any): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    let valid = true;

    // Check contrast ratios
    const textColors = [palette.text?.primary, palette.text?.secondary];
    const backgrounds = [palette.background, palette.surface];
    
    textColors.forEach((textColor, textIndex) => {
      if (textColor) {
        backgrounds.forEach((bgColor, bgIndex) => {
          if (bgColor) {
            const contrast = getContrastRatio(textColor, bgColor);
            if (contrast < contrastLevels.AA.normalText) {
              issues.push(`Text color ${textIndex + 1} and background ${bgIndex + 1} have insufficient contrast (${contrast.toFixed(2)}:1)`);
              valid = false;
            }
          }
        });
      }
    });

    // Check semantic colors
    const semanticColors = [palette.semantic?.success, palette.semantic?.error, palette.semantic?.warning];
    semanticColors.forEach((color, index) => {
      if (color && palette.background) {
        const contrast = getContrastRatio(color, palette.background);
        if (contrast < contrastLevels.AA.graphicalElements) {
          issues.push(`Semantic color ${index + 1} has insufficient contrast with background (${contrast.toFixed(2)}:1)`);
          valid = false;
        }
      }
    });

    // Check color blind safety
    const allColors = [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.semantic?.success,
      palette.semantic?.error,
      palette.semantic?.warning
    ].filter(Boolean);

    if (!isColorBlindSafe(allColors)) {
      issues.push('Color palette is not color-blind safe');
      valid = false;
    }

    return { valid, issues };
  }, [getContrastRatio]);

  // Check if colors are distinguishable for color blind users
  const isColorBlindSafe = useCallback((colors: string[]): boolean => {
    if (colors.length < 2) return true;

    const colorBlindTypes: (keyof ColorBlindnessTypes)[] = [
      'protanopia', 'deuteranopia', 'tritanopia', 'protanomaly', 'deuteranomaly', 'tritanomaly'
    ];

    return colorBlindTypes.every(type => {
      const transformedColors = colors.map(color => applyColorBlindTransform(color, type));
      
      // Check if transformed colors are sufficiently different
      for (let i = 0; i < transformedColors.length; i++) {
        for (let j = i + 1; j < transformedColors.length; j++) {
          const lum1 = getLuminance(transformedColors[i]);
          const lum2 = getLuminance(transformedColors[j]);
          const diff = Math.abs(lum1 - lum2);
          
          if (diff < 0.1) { // Minimum luminance difference
            return false;
          }
        }
      }
      
      return true;
    });
  }, []);

  // Apply color blind transformation
  const applyColorBlindTransform = useCallback((color: string, type: keyof ColorBlindnessTypes): string => {
    if (type === 'achromatopsia') {
      // Complete color blindness - convert to grayscale
      const rgb = hexToRgb(color);
      const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
      return rgbToHex(gray, gray, gray);
    }

    if (type === 'achromatomaly') {
      // Partial color blindness - reduce saturation
      const rgb = hexToRgb(color);
      const gray = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      const factor = 0.618; // Reduce saturation by ~38%
      return rgbToHex(
        Math.round(rgb.r * factor + gray * (1 - factor)),
        Math.round(rgb.g * factor + gray * (1 - factor)),
        Math.round(rgb.b * factor + gray * (1 - factor))
      );
    }

    const matrix = colorBlindMatrices[type];
    if (!matrix) return color;

    const rgb = hexToRgb(color);
    const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

    const newR = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
    const newG = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
    const newB = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;

    return rgbToHex(
      Math.round(Math.min(255, Math.max(0, newR * 255))),
      Math.round(Math.min(255, Math.max(0, newG * 255))),
      Math.round(Math.min(255, Math.max(0, newB * 255)))
    );
  }, []);

  // Generate accessible color palette
  const generateAccessiblePalette = useCallback((baseColor: string): string[] => {
    const palette: string[] = [baseColor];
    const targetColors = 5;
    
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Generate colors with different hues but maintained accessibility
    for (let i = 1; i < targetColors; i++) {
      const hueShift = (360 / targetColors) * i;
      const newHue = (hsl.h + hueShift) % 360;
      const newColor = hslToHex(newHue, hsl.s, hsl.l);
      
      // Ensure the new color is accessible
      const accessibleColor = getAccessibleColor(newColor, '#FFFFFF');
      palette.push(accessibleColor);
    }
    
    // Verify the palette is color-blind safe
    if (!isColorBlindSafe(palette)) {
      // Fallback to high-contrast grayscale palette
      return [
        '#000000', '#444444', '#888888', '#BBBBBB', '#FFFFFF'
      ];
    }
    
    return palette;
  }, [getAccessibleColor, isColorBlindSafe]);

  // Helper color conversion functions
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

  // Auto-detect system preferences
  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionMode(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotionMode(e.matches);
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrastMode(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setHighContrastMode(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Update engine when color blind mode changes
  useEffect(() => {
    setEngineColorBlindMode(colorBlindMode);
  }, [colorBlindMode, setEngineColorBlindMode]);

  // Generate accessibility report
  useEffect(() => {
    if (currentPalette) {
      const report = checkContrast(currentPalette.text.primary, currentPalette.background);
      setAccessibilityReport(report);
    }
  }, [currentPalette, checkContrast]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrastMode) {
      // Apply high contrast styles
      document.documentElement.style.setProperty('--high-contrast-mode', 'true');
      document.documentElement.style.setProperty('--text-shadow', '0 0 2px rgba(0,0,0,0.8)');
      document.documentElement.style.setProperty('--border-emphasis', '2px solid');
    } else {
      document.documentElement.style.removeProperty('--high-contrast-mode');
      document.documentElement.style.removeProperty('--text-shadow');
      document.documentElement.style.removeProperty('--border-emphasis');
    }
  }, [highContrastMode]);

  // Apply text size multiplier
  useEffect(() => {
    document.documentElement.style.setProperty('--text-size-multiplier', textSizeMultiplier.toString());
  }, [textSizeMultiplier]);

  // Apply reduced motion mode
  useEffect(() => {
    if (reducedMotionMode) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
  }, [reducedMotionMode]);

  const value: ColorAccessibilityContextType = {
    colorBlindMode,
    setColorBlindMode,
    highContrastMode,
    setHighContrastMode,
    reducedMotionMode,
    setReducedMotionMode,
    textSizeMultiplier,
    setTextSizeMultiplier,
    checkContrast,
    getAccessibleColor,
    validateColorPalette,
    isColorBlindSafe,
    generateAccessiblePalette,
    accessibilityReport
  };

  return (
    <ColorAccessibilityContext.Provider value={value}>
      {children}
    </ColorAccessibilityContext.Provider>
  );
};

export const useColorAccessibility = () => {
  const context = useContext(ColorAccessibilityContext);
  if (!context) {
    throw new Error('useColorAccessibility must be used within a ColorAccessibilityProvider');
  }
  return context;
};

export default ColorAccessibilityProvider;