// Color utility functions for the adaptive color intelligence system

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface HSVColor {
  h: number;
  s: number;
  v: number;
}

export interface LABColor {
  l: number;
  a: number;
  b: number;
}

// Core color conversion functions
export const hexToRgb = (hex: string): RGBColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const rgbToHsl = (r: number, g: number, b: number): HSLColor => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

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

export const hslToRgb = (h: number, s: number, l: number): RGBColor => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

export const rgbToHsv = (r: number, g: number, b: number): HSVColor => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
};

export const hsvToRgb = (h: number, s: number, v: number): RGBColor => {
  h /= 360;
  s /= 100;
  v /= 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

// Advanced color calculations
export const getLuminance = (color: string): number => {
  const rgb = hexToRgb(color);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const isValidHex = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

export const normalizeHex = (hex: string): string => {
  if (!isValidHex(hex)) return '#000000';
  
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  
  return hex.toUpperCase();
};

// Color manipulation functions
export const lighten = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

export const darken = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

export const saturate = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.min(100, hsl.s + amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

export const desaturate = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, hsl.s - amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

export const adjustHue = (color: string, degrees: number): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
};

export const complement = (color: string): string => {
  return adjustHue(color, 180);
};

export const invert = (color: string): string => {
  const rgb = hexToRgb(color);
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
};

export const grayscale = (color: string): string => {
  const rgb = hexToRgb(color);
  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return rgbToHex(gray, gray, gray);
};

// Color harmony generators
export const generateAnalogous = (baseColor: string, count: number = 5): string[] => {
  const colors = [baseColor];
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  for (let i = 1; i < count; i++) {
    const hue = (hsl.h + (i * 30)) % 360;
    const newRgb = hslToRgb(hue, hsl.s, hsl.l);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }
  
  return colors;
};

export const generateTriadic = (baseColor: string): string[] => {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const colors = [baseColor];
  
  for (let i = 1; i < 3; i++) {
    const hue = (hsl.h + (i * 120)) % 360;
    const newRgb = hslToRgb(hue, hsl.s, hsl.l);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }
  
  return colors;
};

export const generateComplementary = (baseColor: string): string[] => {
  return [baseColor, complement(baseColor)];
};

export const generateSplitComplementary = (baseColor: string): string[] => {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const colors = [baseColor];
  
  // Add split complements (150° and 210° from base)
  const hue1 = (hsl.h + 150) % 360;
  const hue2 = (hsl.h + 210) % 360;
  
  const rgb1 = hslToRgb(hue1, hsl.s, hsl.l);
  const rgb2 = hslToRgb(hue2, hsl.s, hsl.l);
  
  colors.push(rgbToHex(rgb1.r, rgb1.g, rgb1.b));
  colors.push(rgbToHex(rgb2.r, rgb2.g, rgb2.b));
  
  return colors;
};

export const generateTetradic = (baseColor: string): string[] => {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const colors = [baseColor];
  
  for (let i = 1; i < 4; i++) {
    const hue = (hsl.h + (i * 90)) % 360;
    const newRgb = hslToRgb(hue, hsl.s, hsl.l);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }
  
  return colors;
};

export const generateMonochromatic = (baseColor: string, count: number = 5): string[] => {
  const colors = [baseColor];
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const step = 80 / (count - 1);
  
  for (let i = 1; i < count; i++) {
    const lightness = Math.max(10, Math.min(90, hsl.l + (i * step) - 40));
    const newRgb = hslToRgb(hsl.h, hsl.s, lightness);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }
  
  return colors;
};

// Color distance and similarity
export const getColorDistance = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

export const getColorSimilarity = (color1: string, color2: string): number => {
  const maxDistance = Math.sqrt(255 * 255 * 3);
  const distance = getColorDistance(color1, color2);
  return 1 - (distance / maxDistance);
};

// Color temperature
export const getColorTemperature = (color: string): 'warm' | 'cool' | 'neutral' => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  if (hsl.h >= 0 && hsl.h <= 60) return 'warm';
  if (hsl.h >= 300 && hsl.h <= 360) return 'warm';
  if (hsl.h >= 120 && hsl.h <= 240) return 'cool';
  return 'neutral';
};

// Color blindness simulation
export const simulateColorBlindness = (color: string, type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'): string => {
  const rgb = hexToRgb(color);
  const { r, g, b } = rgb;
  
  // Transformation matrices for different types of color blindness
  const matrices = {
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
    achromatopsia: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114]
    ]
  };
  
  const matrix = matrices[type];
  const [nr, ng, nb] = [r / 255, g / 255, b / 255];
  
  const newR = matrix[0][0] * nr + matrix[0][1] * ng + matrix[0][2] * nb;
  const newG = matrix[1][0] * nr + matrix[1][1] * ng + matrix[1][2] * nb;
  const newB = matrix[2][0] * nr + matrix[2][1] * ng + matrix[2][2] * nb;
  
  return rgbToHex(
    Math.round(Math.min(255, Math.max(0, newR * 255))),
    Math.round(Math.min(255, Math.max(0, newG * 255))),
    Math.round(Math.min(255, Math.max(0, newB * 255)))
  );
};

// Color interpolation
export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return rgbToHex(r, g, b);
};

// Color palette generation
export const generatePalette = (baseColor: string, type: 'analogous' | 'triadic' | 'complementary' | 'split-complementary' | 'tetradic' | 'monochromatic', count?: number): string[] => {
  switch (type) {
    case 'analogous':
      return generateAnalogous(baseColor, count || 5);
    case 'triadic':
      return generateTriadic(baseColor);
    case 'complementary':
      return generateComplementary(baseColor);
    case 'split-complementary':
      return generateSplitComplementary(baseColor);
    case 'tetradic':
      return generateTetradic(baseColor);
    case 'monochromatic':
      return generateMonochromatic(baseColor, count || 5);
    default:
      return [baseColor];
  }
};

// Color naming and categorization
export const getColorName = (color: string): string => {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const colorNames = {
    red: { h: [0, 30], s: [50, 100], l: [30, 70] },
    orange: { h: [30, 60], s: [50, 100], l: [30, 70] },
    yellow: { h: [60, 90], s: [50, 100], l: [30, 70] },
    green: { h: [90, 150], s: [50, 100], l: [30, 70] },
    cyan: { h: [150, 210], s: [50, 100], l: [30, 70] },
    blue: { h: [210, 270], s: [50, 100], l: [30, 70] },
    purple: { h: [270, 330], s: [50, 100], l: [30, 70] },
    pink: { h: [330, 360], s: [50, 100], l: [30, 70] }
  };
  
  for (const [name, ranges] of Object.entries(colorNames)) {
    if (hsl.h >= ranges.h[0] && hsl.h < ranges.h[1] &&
        hsl.s >= ranges.s[0] && hsl.s <= ranges.s[1] &&
        hsl.l >= ranges.l[0] && hsl.l <= ranges.l[1]) {
      return name;
    }
  }
  
  if (hsl.s < 10) return 'gray';
  if (hsl.l < 20) return 'black';
  if (hsl.l > 80) return 'white';
  
  return 'unknown';
};

// Export all functions as a single object
export const colorUtils = {
  // Conversion functions
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  
  // Color analysis
  getLuminance,
  getContrastRatio,
  isValidHex,
  normalizeHex,
  
  // Color manipulation
  lighten,
  darken,
  saturate,
  desaturate,
  adjustHue,
  complement,
  invert,
  grayscale,
  
  // Color harmony
  generateAnalogous,
  generateTriadic,
  generateComplementary,
  generateSplitComplementary,
  generateTetradic,
  generateMonochromatic,
  generatePalette,
  
  // Color comparison
  getColorDistance,
  getColorSimilarity,
  getColorTemperature,
  
  // Accessibility
  simulateColorBlindness,
  
  // Interpolation
  interpolateColor,
  
  // Naming
  getColorName
};

export default colorUtils;