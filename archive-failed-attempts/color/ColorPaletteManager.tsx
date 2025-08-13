import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
}

interface ColorHarmony {
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split-complementary' | 'tetradic';
  colors: string[];
}

interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: BrandColors;
  category: 'professional' | 'creative' | 'accessibility' | 'industry';
}

interface ColorPaletteContextType {
  brandColors: BrandColors;
  setBrandColors: (colors: Partial<BrandColors>) => void;
  currentPreset: PalettePreset | null;
  setPreset: (preset: PalettePreset) => void;
  availablePresets: PalettePreset[];
  generateHarmony: (baseColor: string, type: ColorHarmony['type']) => ColorHarmony;
  validateBrandConsistency: (colors: BrandColors) => { consistent: boolean; issues: string[] };
  exportPalette: (format: 'css' | 'json' | 'scss' | 'figma') => string;
  importPalette: (data: string, format: 'css' | 'json' | 'scss') => BrandColors | null;
  savePalette: (name: string, description: string) => void;
  deletePalette: (id: string) => void;
  getColorUsage: () => { [key: string]: number };
}

const defaultBrandColors: BrandColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF3B30',
  neutral: '#8E8E93'
};

const professionalPresets: PalettePreset[] = [
  {
    id: 'apple-like',
    name: 'Apple-inspired',
    description: 'Clean, minimalist colors inspired by Apple design',
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      accent: '#FF3B30',
      neutral: '#8E8E93'
    },
    category: 'professional'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue palette for business applications',
    colors: {
      primary: '#2563EB',
      secondary: '#1E40AF',
      accent: '#F59E0B',
      neutral: '#6B7280'
    },
    category: 'professional'
  },
  {
    id: 'financial-green',
    name: 'Financial Green',
    description: 'Trust-building greens for financial applications',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#DC2626',
      neutral: '#6B7280'
    },
    category: 'industry'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum accessibility with high contrast ratios',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#FF0000',
      neutral: '#666666'
    },
    category: 'accessibility'
  },
  {
    id: 'creative-vibrant',
    name: 'Creative Vibrant',
    description: 'Bold, energetic colors for creative applications',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EF4444',
      accent: '#F59E0B',
      neutral: '#6B7280'
    },
    category: 'creative'
  }
];

const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

export const ColorPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateColor, currentPalette } = useAdaptiveColor();
  const [brandColors, setBrandColors] = useState<BrandColors>(defaultBrandColors);
  const [currentPreset, setCurrentPreset] = useState<PalettePreset | null>(null);
  const [availablePresets, setAvailablePresets] = useState<PalettePreset[]>(professionalPresets);
  const [colorUsage, setColorUsage] = useState<{ [key: string]: number }>({});

  // Color calculation utilities
  const hexToHsl = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

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

    return [h * 360, s * 100, l * 100];
  }, []);

  const hslToHex = useCallback((h: number, s: number, l: number) => {
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

    return "#" + [r, g, b].map(x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }, []);

  // Generate color harmony
  const generateHarmony = useCallback((baseColor: string, type: ColorHarmony['type']): ColorHarmony => {
    const [h, s, l] = hexToHsl(baseColor);
    const colors: string[] = [baseColor];

    switch (type) {
      case 'monochromatic':
        colors.push(
          hslToHex(h, s, Math.max(10, l - 20)),
          hslToHex(h, s, Math.min(90, l + 20)),
          hslToHex(h, Math.max(10, s - 20), l),
          hslToHex(h, Math.min(90, s + 20), l)
        );
        break;

      case 'analogous':
        colors.push(
          hslToHex((h + 30) % 360, s, l),
          hslToHex((h - 30 + 360) % 360, s, l),
          hslToHex((h + 60) % 360, s, l),
          hslToHex((h - 60 + 360) % 360, s, l)
        );
        break;

      case 'complementary':
        colors.push(
          hslToHex((h + 180) % 360, s, l),
          hslToHex(h, s, Math.max(10, l - 20)),
          hslToHex((h + 180) % 360, s, Math.max(10, l - 20)),
          hslToHex(h, Math.max(10, s - 20), l)
        );
        break;

      case 'triadic':
        colors.push(
          hslToHex((h + 120) % 360, s, l),
          hslToHex((h + 240) % 360, s, l),
          hslToHex(h, Math.max(10, s - 20), l),
          hslToHex((h + 120) % 360, Math.max(10, s - 20), l)
        );
        break;

      case 'split-complementary':
        colors.push(
          hslToHex((h + 150) % 360, s, l),
          hslToHex((h + 210) % 360, s, l),
          hslToHex(h, Math.max(10, s - 20), l),
          hslToHex((h + 150) % 360, Math.max(10, s - 20), l)
        );
        break;

      case 'tetradic':
        colors.push(
          hslToHex((h + 90) % 360, s, l),
          hslToHex((h + 180) % 360, s, l),
          hslToHex((h + 270) % 360, s, l),
          hslToHex(h, Math.max(10, s - 20), l)
        );
        break;
    }

    return { type, colors };
  }, [hexToHsl, hslToHex]);

  // Validate brand consistency
  const validateBrandConsistency = useCallback((colors: BrandColors): { consistent: boolean; issues: string[] } => {
    const issues: string[] = [];
    let consistent = true;

    // Check hue consistency
    const hues = Object.values(colors).map(color => hexToHsl(color)[0]);
    const hueRange = Math.max(...hues) - Math.min(...hues);
    
    if (hueRange > 180) {
      issues.push('Colors span too wide a hue range, may lack cohesion');
      consistent = false;
    }

    // Check saturation consistency
    const saturations = Object.values(colors).map(color => hexToHsl(color)[1]);
    const saturationRange = Math.max(...saturations) - Math.min(...saturations);
    
    if (saturationRange > 60) {
      issues.push('Saturation levels vary too much, may appear inconsistent');
      consistent = false;
    }

    // Check lightness balance
    const lightnesses = Object.values(colors).map(color => hexToHsl(color)[2]);
    const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);
    
    if (lightnessRange < 20) {
      issues.push('Colors are too similar in lightness, may lack contrast');
      consistent = false;
    }

    // Check for sufficient contrast between primary and secondary
    const primaryLum = getLuminance(colors.primary);
    const secondaryLum = getLuminance(colors.secondary);
    const contrastRatio = (Math.max(primaryLum, secondaryLum) + 0.05) / (Math.min(primaryLum, secondaryLum) + 0.05);
    
    if (contrastRatio < 1.5) {
      issues.push('Primary and secondary colors are too similar');
      consistent = false;
    }

    return { consistent, issues };
  }, [hexToHsl]);

  // Helper function for luminance calculation
  const getLuminance = (color: string): number => {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Export palette in different formats
  const exportPalette = useCallback((format: 'css' | 'json' | 'scss' | 'figma'): string => {
    switch (format) {
      case 'css':
        return `:root {
  --color-primary: ${brandColors.primary};
  --color-secondary: ${brandColors.secondary};
  --color-accent: ${brandColors.accent};
  --color-neutral: ${brandColors.neutral};
}`;

      case 'scss':
        return `$color-primary: ${brandColors.primary};
$color-secondary: ${brandColors.secondary};
$color-accent: ${brandColors.accent};
$color-neutral: ${brandColors.neutral};

$brand-colors: (
  "primary": $color-primary,
  "secondary": $color-secondary,
  "accent": $color-accent,
  "neutral": $color-neutral
);`;

      case 'json':
        return JSON.stringify(brandColors, null, 2);

      case 'figma':
        return JSON.stringify({
          colors: Object.entries(brandColors).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value.toUpperCase(),
            type: 'color'
          }))
        }, null, 2);

      default:
        return JSON.stringify(brandColors, null, 2);
    }
  }, [brandColors]);

  // Import palette from different formats
  const importPalette = useCallback((data: string, format: 'css' | 'json' | 'scss'): BrandColors | null => {
    try {
      switch (format) {
        case 'json':
          const parsed = JSON.parse(data);
          if (parsed.primary && parsed.secondary && parsed.accent && parsed.neutral) {
            return parsed as BrandColors;
          }
          break;

        case 'css':
          const cssColors: Partial<BrandColors> = {};
          const cssMatches = data.match(/--color-(\w+):\s*(#[0-9a-fA-F]{6})/g);
          cssMatches?.forEach(match => {
            const [, name, value] = match.match(/--color-(\w+):\s*(#[0-9a-fA-F]{6})/) || [];
            if (name && value) {
              (cssColors as any)[name] = value;
            }
          });
          if (Object.keys(cssColors).length === 4) {
            return cssColors as BrandColors;
          }
          break;

        case 'scss':
          const scssColors: Partial<BrandColors> = {};
          const scssMatches = data.match(/\$color-(\w+):\s*(#[0-9a-fA-F]{6})/g);
          scssMatches?.forEach(match => {
            const [, name, value] = match.match(/\$color-(\w+):\s*(#[0-9a-fA-F]{6})/) || [];
            if (name && value) {
              (scssColors as any)[name] = value;
            }
          });
          if (Object.keys(scssColors).length === 4) {
            return scssColors as BrandColors;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to import palette:', error);
    }
    return null;
  }, []);

  // Save palette to local storage
  const savePalette = useCallback((name: string, description: string) => {
    const newPreset: PalettePreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      colors: { ...brandColors },
      category: 'professional'
    };

    setAvailablePresets(prev => [...prev, newPreset]);
    
    // Save to local storage
    const customPresets = JSON.parse(localStorage.getItem('customPalettes') || '[]');
    customPresets.push(newPreset);
    localStorage.setItem('customPalettes', JSON.stringify(customPresets));
  }, [brandColors]);

  // Delete palette
  const deletePalette = useCallback((id: string) => {
    setAvailablePresets(prev => prev.filter(preset => preset.id !== id));
    
    // Remove from local storage
    const customPresets = JSON.parse(localStorage.getItem('customPalettes') || '[]');
    const filtered = customPresets.filter((preset: PalettePreset) => preset.id !== id);
    localStorage.setItem('customPalettes', JSON.stringify(filtered));
  }, []);

  // Get color usage statistics
  const getColorUsage = useCallback(() => {
    return colorUsage;
  }, [colorUsage]);

  // Update brand colors
  const updateBrandColors = useCallback((colors: Partial<BrandColors>) => {
    setBrandColors(prev => ({ ...prev, ...colors }));
    
    // Update the adaptive color engine
    if (colors.primary) updateColor('primary', colors.primary);
    if (colors.secondary) updateColor('secondary', colors.secondary);
    if (colors.accent) updateColor('accent', colors.accent);
    
    // Track usage
    setColorUsage(prev => {
      const updated = { ...prev };
      Object.entries(colors).forEach(([key, value]) => {
        updated[value] = (updated[value] || 0) + 1;
      });
      return updated;
    });
  }, [updateColor]);

  // Set preset
  const setPreset = useCallback((preset: PalettePreset) => {
    setCurrentPreset(preset);
    updateBrandColors(preset.colors);
  }, [updateBrandColors]);

  // Load custom presets on mount
  useEffect(() => {
    const customPresets = JSON.parse(localStorage.getItem('customPalettes') || '[]');
    setAvailablePresets(prev => [...prev, ...customPresets]);
  }, []);

  // Apply initial brand colors
  useEffect(() => {
    updateBrandColors(brandColors);
  }, []); // Only on mount

  const value: ColorPaletteContextType = {
    brandColors,
    setBrandColors: updateBrandColors,
    currentPreset,
    setPreset,
    availablePresets,
    generateHarmony,
    validateBrandConsistency,
    exportPalette,
    importPalette,
    savePalette,
    deletePalette,
    getColorUsage
  };

  return (
    <ColorPaletteContext.Provider value={value}>
      {children}
    </ColorPaletteContext.Provider>
  );
};

export const useColorPalette = () => {
  const context = useContext(ColorPaletteContext);
  if (!context) {
    throw new Error('useColorPalette must be used within a ColorPaletteProvider');
  }
  return context;
};

export default ColorPaletteProvider;