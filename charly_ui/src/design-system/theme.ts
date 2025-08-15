/**
 * CHARLY Design System - Jony Ive UI/UX Blueprint
 * 
 * Philosophy: "Invisible Excellence"
 * - Remove anything unnecessary, elevate the essentials
 * - Clean, confident design that gets out of the user's way
 * - Functional beauty through purposeful restraint
 */

export const theme = {
  // Typography - SF Pro Display hierarchy with Inter fallback
  typography: {
    fontFamily: {
      display: ['-apple-system', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      body: ['-apple-system', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }], 
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // Spacing - Generous whitespace for calm, confident experience
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px  
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem',   // 128px
    '6xl': '12rem'   // 192px
  },

  // Color System - Neutral base with subtle accents
  colors: {
    // Light mode colors
    light: {
      // Primary neutral palette
      background: '#ffffff',
      surface: '#fafafa',
      surfaceElevated: '#ffffff',
      
      // Text hierarchy
      text: {
        primary: '#171717',     // Near black for headings
        secondary: '#404040',   // Dark gray for body text
        tertiary: '#737373',    // Medium gray for supporting text
        quaternary: '#a3a3a3'   // Light gray for placeholder/disabled
      },
      
      // Border and dividers
      border: {
        primary: '#e5e5e5',     // Subtle primary borders
        secondary: '#f5f5f5',   // Very light dividers
        focus: '#3b82f6'        // Blue for focus states
      },
      
      // Accent colors (used sparingly)
      accent: {
        primary: '#3b82f6',     // Professional blue
        primaryHover: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b', 
        error: '#ef4444'
      },
      
      // Interactive states
      interactive: {
        hover: '#f9fafb',       // Very light gray hover
        active: '#f3f4f6',      // Slightly darker active
        selected: '#eff6ff'     // Blue-tinted selection
      }
    },

    // Dark mode colors
    dark: {
      // Primary neutral palette  
      background: '#0a0a0a',
      surface: '#171717',
      surfaceElevated: '#262626',
      
      // Text hierarchy
      text: {
        primary: '#fafafa',     // Near white for headings
        secondary: '#d4d4d4',   // Light gray for body text
        tertiary: '#a3a3a3',    // Medium gray for supporting text
        quaternary: '#737373'   // Dark gray for placeholder/disabled
      },
      
      // Border and dividers
      border: {
        primary: '#404040',     // Subtle primary borders
        secondary: '#262626',   // Very dark dividers
        focus: '#60a5fa'        // Lighter blue for focus states
      },
      
      // Accent colors (adjusted for dark mode)
      accent: {
        primary: '#60a5fa',     // Lighter blue for dark mode
        primaryHover: '#3b82f6',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171'
      },
      
      // Interactive states
      interactive: {
        hover: '#262626',       // Dark gray hover
        active: '#404040',      // Lighter active
        selected: '#1e3a8a'     // Dark blue selection
      }
    }
  },

  // Shadows - Subtle elevation
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },

  // Border radius - Consistent rounding
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },

  // Transitions - Fluid motion
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)', 
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Easing curves
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Breakpoints - Mobile-first responsive
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
} as const;

// Theme context types
export type Theme = typeof theme;
export type ColorMode = 'light' | 'dark';

// Utility function to get current theme colors
export function getThemeColors(mode: ColorMode) {
  return theme.colors[mode];
}