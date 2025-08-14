/**
 * 🍎 CHARLY 2.0 - IVE DESIGN SYSTEM TOKENS
 * 
 * Apple-quality design foundation implementing Jony Ive standards:
 * - Invisible Technology
 * - Inevitable Simplicity  
 * - Progressive Disclosure
 * - Professional Elevation
 */

// ============================================================================
// COLOR PALETTE - Apple System Inspired
// ============================================================================

export const colors = {
  // Primary Action Colors (Apple System Blues)
  primary: {
    50: '#F0F9FF',   // Lightest blue background
    100: '#E0F2FE',  // Very light blue
    500: '#007AFF',  // Apple Blue - primary actions
    600: '#0056CC',  // Darker blue for hover
    700: '#003D99',  // Dark blue for pressed
    900: '#002966',  // Darkest blue
  },

  // Success States (Apple Green)
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#34C759',  // Apple Green
    600: '#16A34A',
    700: '#15803D',
  },

  // Warning States (Apple Orange)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#FF9500',  // Apple Orange
    600: '#D97706',
    700: '#B45309',
  },

  // Critical States (Apple Red)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#FF3B30',  // Apple Red
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Neutral Grays (Apple System Grays)
  neutral: {
    0: '#FFFFFF',     // Pure white
    50: '#F9FAFB',    // Background
    100: '#F3F4F6',   // Light gray background
    200: '#E5E7EB',   // Border light
    300: '#D1D5DB',   // Border
    400: '#9CA3AF',   // Text tertiary
    500: '#6B7280',   // Text secondary
    600: '#4B5563',   // Text primary
    700: '#374151',   // Dark text
    800: '#1F2937',   // Very dark text
    900: '#111827',   // Darkest
    950: '#030712',   // Almost black
  },

  // Background System
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F7',  // Apple light gray
    tertiary: '#F2F2F7',   // Slightly darker
    elevated: '#FFFFFF',   // Cards, modals
    overlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Text Hierarchy
  text: {
    primary: '#000000',     // Pure black for headers
    secondary: '#8E8E93',   // Apple secondary gray
    tertiary: '#C7C7CC',    // Light gray for captions
    inverse: '#FFFFFF',     // White text on dark
    link: '#007AFF',        // Apple blue for links
    placeholder: '#C7C7CC', // Form placeholders
  },

  // Interactive States
  interactive: {
    hover: 'rgba(0, 122, 255, 0.1)',    // Light blue overlay
    pressed: 'rgba(0, 122, 255, 0.2)',   // Darker blue overlay
    focus: '#007AFF',                     // Focus ring color
    disabled: '#F2F2F7',                 // Disabled background
  },
} as const;

// ============================================================================
// TYPOGRAPHY SCALE - San Francisco Pro Inspired
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
    text: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
  },

  // Font Sizes (Apple's scale)
  fontSize: {
    // Large Display
    'display-large': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],  // 56px
    'display-medium': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }], // 36px
    'display-small': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '600' }],    // 30px

    // Headlines
    'headline-large': ['2rem', { lineHeight: '1.25', letterSpacing: '0em', fontWeight: '600' }],      // 32px
    'headline-medium': ['1.75rem', { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '600' }],   // 28px
    'headline-small': ['1.5rem', { lineHeight: '1.33', letterSpacing: '0em', fontWeight: '600' }],    // 24px

    // Titles
    'title-large': ['1.375rem', { lineHeight: '1.36', letterSpacing: '0em', fontWeight: '500' }],     // 22px
    'title-medium': ['1.125rem', { lineHeight: '1.44', letterSpacing: '0em', fontWeight: '500' }],    // 18px
    'title-small': ['1rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '500' }],          // 16px

    // Body Text
    'body-large': ['1.0625rem', { lineHeight: '1.47', letterSpacing: '0em', fontWeight: '400' }],     // 17px (Apple's preferred body size)
    'body-medium': ['1rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],          // 16px
    'body-small': ['0.875rem', { lineHeight: '1.57', letterSpacing: '0em', fontWeight: '400' }],      // 14px

    // Labels
    'label-large': ['0.875rem', { lineHeight: '1.57', letterSpacing: '0em', fontWeight: '500' }],     // 14px
    'label-medium': ['0.75rem', { lineHeight: '1.67', letterSpacing: '0em', fontWeight: '500' }],     // 12px
    'label-small': ['0.6875rem', { lineHeight: '1.64', letterSpacing: '0em', fontWeight: '500' }],    // 11px

    // Captions
    'caption': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],           // 12px
    'overline': ['0.625rem', { lineHeight: '1.6', letterSpacing: '0.05em', fontWeight: '500' }],      // 10px
  },

  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// SPACING SYSTEM - 8px Base Grid
// ============================================================================

export const spacing = {
  // Micro spacing (for fine adjustments)
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1.5': '0.375rem',  // 6px

  // Base spacing scale (8px grid)
  '2': '0.5rem',      // 8px
  '3': '0.75rem',     // 12px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '8': '2rem',        // 32px
  '10': '2.5rem',     // 40px
  '12': '3rem',       // 48px
  '16': '4rem',       // 64px (Major layout grid)
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
  '32': '8rem',       // 128px

  // Semantic spacing
  'xs': '0.5rem',     // 8px
  'sm': '0.75rem',    // 12px
  'md': '1rem',       // 16px
  'lg': '1.5rem',     // 24px
  'xl': '2rem',       // 32px
  '2xl': '3rem',      // 48px
  '3xl': '4rem',      // 64px
  '4xl': '6rem',      // 96px
} as const;

// ============================================================================
// BORDER RADIUS - Apple's Subtle Curves
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',      // 4px - Small elements
  md: '0.5rem',       // 8px - Standard (Apple's preferred)
  lg: '0.75rem',      // 12px - Cards
  xl: '1rem',         // 16px - Large cards
  '2xl': '1.5rem',    // 24px - Major containers
  full: '9999px',     // Fully rounded
} as const;

// ============================================================================
// SHADOWS - Subtle Depth Apple Style
// ============================================================================

export const shadows = {
  // Subtle Apple-style shadows
  none: 'none',
  sm: '0px 1px 2px rgba(0, 0, 0, 0.04)',                    // Subtle hover
  md: '0px 2px 10px rgba(0, 0, 0, 0.04)',                   // Standard elevation (from handoff)
  lg: '0px 4px 16px rgba(0, 0, 0, 0.08)',                   // Cards
  xl: '0px 8px 32px rgba(0, 0, 0, 0.12)',                   // Modals
  '2xl': '0px 16px 64px rgba(0, 0, 0, 0.16)',               // Major elevation

  // Focused states
  focus: '0px 0px 0px 3px rgba(0, 122, 255, 0.3)',          // Focus ring
  'focus-danger': '0px 0px 0px 3px rgba(255, 59, 48, 0.3)', // Error focus ring

  // Inner shadows for depth
  inner: 'inset 0px 1px 2px rgba(0, 0, 0, 0.05)',
} as const;

// ============================================================================
// TRANSITIONS - Apple's Smooth Animations
// ============================================================================

export const transitions = {
  // Duration (Apple prefers 0.3s for most interactions)
  duration: {
    fast: '150ms',
    normal: '300ms',      // Apple standard
    slow: '500ms',
  },

  // Easing (Apple's preferred curves)
  easing: {
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',      // Standard
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',           // Enter
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',            // Exit
    'ease-apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',   // Apple's signature ease
  },

  // Common transitions
  all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================================================
// Z-INDEX SCALE - Logical Layering
// ============================================================================

export const zIndex = {
  base: 0,
  raised: 10,       // Floating elements
  dropdown: 20,     // Dropdowns, tooltips
  overlay: 30,      // Overlays
  modal: 40,        // Modals
  toast: 50,        // Notifications
  tooltip: 60,      // Tooltips above everything
} as const;

// ============================================================================
// BREAKPOINTS - Responsive Design
// ============================================================================

export const breakpoints = {
  sm: '640px',      // Small devices
  md: '768px',      // Tablets
  lg: '1024px',     // Laptops
  xl: '1280px',     // Desktops
  '2xl': '1536px',  // Large screens
} as const;

// ============================================================================
// DESIGN TOKENS EXPORT
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;

// ============================================================================
// CSS CUSTOM PROPERTIES GENERATOR
// ============================================================================

export const generateCSSCustomProperties = () => {
  const cssVars: Record<string, string> = {};

  // Colors
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        cssVars[`--color-${category}-${key}`] = value;
      });
    } else {
      cssVars[`--color-${category}`] = values;
    }
  });

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Border Radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value;
  });

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  return cssVars;
};