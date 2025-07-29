/*!
 * CHARLY Enterprise Design Tokens
 * 
 * Comprehensive design token system embodying Steve Jobs' attention to detail
 * and Larry Ellison's enterprise excellence standards.
 * 
 * Based on atomic design methodology with progressive enhancement
 * and enterprise-grade accessibility compliance.
 * 
 * Author: CHARLY Chief Design & Engineering Architect
 * Version: 2.0.0 Enterprise
 */

export const designTokens = {
  /**
   * Color System - Professional Enterprise Palette
   * 
   * Based on HSL color space for accessibility and consistency
   * Includes comprehensive scales and semantic meanings
   */
  colors: {
    // Primary Brand Colors - CHARLY Blue Family
    primary: {
      50: '#f0f9ff',   // Lightest tint for backgrounds
      100: '#e0f2fe',  // Subtle backgrounds and borders
      200: '#bae6fd',  // Hover states and accents
      300: '#7dd3fc',  // Active states
      400: '#38bdf8',  // Secondary actions
      500: '#0ea5e9',  // Primary brand color
      600: '#0284c7',  // Primary buttons and links
      700: '#0369a1',  // Primary button hover
      800: '#075985',  // Primary button active
      900: '#0c4a6e',  // Text on light backgrounds
      950: '#082f49'   // Darkest for high contrast
    },

    // Secondary Colors - Professional Teal
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',   // Secondary brand color
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e'
    },

    // Semantic Colors for UI States
    semantic: {
      success: {
        light: '#dcfce7',     // Success background
        DEFAULT: '#16a34a',   // Success text/icons
        dark: '#15803d'       // Success emphasis
      },
      warning: {
        light: '#fef3c7',     // Warning background
        DEFAULT: '#d97706',   // Warning text/icons
        dark: '#92400e'       // Warning emphasis
      },
      error: {
        light: '#fef2f2',     // Error background
        DEFAULT: '#dc2626',   // Error text/icons
        dark: '#991b1b'       // Error emphasis
      },
      info: {
        light: '#dbeafe',     // Info background
        DEFAULT: '#2563eb',   // Info text/icons
        dark: '#1d4ed8'       // Info emphasis
      }
    },

    // Neutral Grays - Sophisticated Enterprise Palette
    neutral: {
      0: '#ffffff',     // Pure white
      50: '#fafafa',    // Lightest gray backgrounds
      100: '#f5f5f5',   // Card backgrounds
      200: '#e5e5e5',   // Borders and dividers
      300: '#d4d4d4',   // Input borders
      400: '#a3a3a3',   // Placeholder text
      500: '#737373',   // Secondary text
      600: '#525252',   // Primary text on light
      700: '#404040',   // Headings
      800: '#262626',   // High contrast text
      900: '#171717',   // Darkest text
      950: '#0a0a0a'    // Pure black
    },

    // Client Branding Integration Point
    brand: {
      primary: 'var(--brand-primary, #0ea5e9)',
      secondary: 'var(--brand-secondary, #14b8a6)',
      accent: 'var(--brand-accent, #d97706)',
      logo: 'var(--brand-logo-url, "")'
    },

    // Background Colors for Different Contexts
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
      inverse: '#171717',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glass: 'rgba(255, 255, 255, 0.8)'
    },

    // Text Colors with Accessibility Compliance
    text: {
      primary: '#171717',      // WCAG AAA on white
      secondary: '#525252',    // WCAG AA on white
      tertiary: '#737373',     // WCAG AA on light backgrounds
      inverse: '#ffffff',      // White text on dark
      link: '#0ea5e9',         // Link color
      linkHover: '#0284c7',    // Link hover
      disabled: '#a3a3a3'      // Disabled text
    },

    // Border Colors for Various States
    border: {
      DEFAULT: '#e5e5e5',      // Default border
      light: '#f5f5f5',        // Light border
      medium: '#d4d4d4',       // Medium border
      dark: '#a3a3a3',         // Dark border
      focus: '#0ea5e9',        // Focus indicator
      error: '#dc2626',        // Error state
      success: '#16a34a'       // Success state
    }
  },

  /**
   * Typography System - Responsive and Accessible
   * 
   * Based on modular scale with perfect readability
   * across all devices and accessibility compliance
   */
  typography: {
    // Font Families
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
      ],
      serif: [
        'Merriweather',
        'Georgia',
        '"Times New Roman"',
        'Times',
        'serif'
      ],
      mono: [
        '"JetBrains Mono"',
        '"SF Mono"',
        'Monaco',
        'Inconsolata',
        '"Roboto Mono"',
        '"Droid Sans Mono"',
        '"Courier New"',
        'monospace'
      ],
      display: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif'
      ]
    },

    // Responsive Font Sizes (rem units)
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.025em' }]
    },

    // Font Weights
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },

    // Line Heights
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },

    // Letter Spacing
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  /**
   * Spacing System - 8px Grid for Consistency
   * 
   * Based on 8-point grid system for pixel-perfect alignment
   * across all screen densities and devices
   */
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    9: '2.25rem',       // 36px
    10: '2.5rem',       // 40px
    11: '2.75rem',      // 44px (minimum touch target)
    12: '3rem',         // 48px
    14: '3.5rem',       // 56px
    16: '4rem',         // 64px
    20: '5rem',         // 80px
    24: '6rem',         // 96px
    28: '7rem',         // 112px
    32: '8rem',         // 128px
    36: '9rem',         // 144px
    40: '10rem',        // 160px
    44: '11rem',        // 176px
    48: '12rem',        // 192px
    52: '13rem',        // 208px
    56: '14rem',        // 224px
    60: '15rem',        // 240px
    64: '16rem',        // 256px
    72: '18rem',        // 288px
    80: '20rem',        // 320px
    96: '24rem'         // 384px
  },

  /**
   * Animation System - Smooth and Purposeful
   * 
   * Carefully crafted timing functions for delightful interactions
   * with performance optimization and reduced motion support
   */
  animation: {
    // Timing Functions
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },

    // Duration Values
    duration: {
      instant: '0ms',
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      slowest: '1000ms'
    },

    // Pre-defined Animations
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      },
      fadeOut: {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' }
      },
      slideUp: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' }
      },
      slideDown: {
        '0%': { transform: 'translateY(-100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' }
      },
      scaleIn: {
        '0%': { transform: 'scale(0.9)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' }
      },
      shimmer: {
        '0%': { backgroundPosition: '-200px 0' },
        '100%': { backgroundPosition: 'calc(200px + 100%) 0' }
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' }
      },
      spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }
  },

  /**
   * Shadow System - Elevation and Depth
   * 
   * Carefully crafted shadows for visual hierarchy
   * and modern flat design aesthetics
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    
    // Colored shadows for interactive states
    focus: '0 0 0 3px rgb(14 165 233 / 0.2)',
    error: '0 0 0 3px rgb(220 38 38 / 0.2)',
    success: '0 0 0 3px rgb(22 163 74 / 0.2)',
    
    // Elevation system
    elevation: {
      0: 'none',
      1: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
      2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
      3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
      4: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
      5: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    }
  },

  /**
   * Border Radius System - Modern and Consistent
   * 
   * Rounded corners for modern design aesthetics
   * with accessibility considerations
   */
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px'      // Circular
  },

  /**
   * Z-Index System - Layering and Stacking
   * 
   * Consistent z-index values for proper layering
   * of modals, dropdowns, and overlays
   */
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    
    // Semantic layers
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
    toast: '1080'
  },

  /**
   * Breakpoints - Mobile-First Responsive Design
   * 
   * Carefully chosen breakpoints for optimal responsive behavior
   * across all device categories
   */
  screens: {
    xs: '475px',        // Large phones
    sm: '640px',        // Small tablets
    md: '768px',        // Tablets
    lg: '1024px',       // Small laptops
    xl: '1280px',       // Desktops
    '2xl': '1536px',    // Large desktops
    '3xl': '1920px',    // 4K displays
    
    // Device-specific breakpoints
    mobile: { max: '767px' },
    tablet: { min: '768px', max: '1023px' },
    desktop: { min: '1024px' },
    
    // Content-based breakpoints
    narrow: { max: '640px' },
    wide: { min: '1280px' },
    ultrawide: { min: '1920px' }
  },

  /**
   * Component-Specific Tokens
   * 
   * Specialized tokens for common UI patterns
   * and component variations
   */
  components: {
    // Button variations
    button: {
      height: {
        sm: '2rem',       // 32px
        md: '2.5rem',     // 40px
        lg: '3rem',       // 48px
        xl: '3.5rem'      // 56px
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.625rem 1rem',
        lg: '0.75rem 1.5rem',
        xl: '1rem 2rem'
      },
      fontSize: {
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      }
    },

    // Input field variations
    input: {
      height: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
        xl: '3.5rem'
      },
      padding: {
        sm: '0.5rem 0.75rem',
        md: '0.625rem 1rem',
        lg: '0.75rem 1rem',
        xl: '1rem 1.25rem'
      }
    },

    // Card variations
    card: {
      padding: {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '2.5rem'
      },
      gap: {
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      }
    },

    // Navigation variations
    nav: {
      height: {
        sm: '3rem',       // 48px
        md: '4rem',       // 64px
        lg: '5rem'        // 80px
      },
      padding: {
        sm: '0.75rem 1rem',
        md: '1rem 1.5rem',
        lg: '1.25rem 2rem'
      }
    }
  },

  /**
   * Accessibility Tokens
   * 
   * Tokens specifically for accessibility compliance
   * and inclusive design
   */
  accessibility: {
    // Focus indicators
    focus: {
      outline: '2px solid #0ea5e9',
      outlineOffset: '2px',
      borderRadius: '0.25rem'
    },

    // Touch targets (minimum 44px)
    touchTarget: {
      minHeight: '44px',
      minWidth: '44px'
    },

    // High contrast colors
    highContrast: {
      text: '#000000',
      background: '#ffffff',
      border: '#000000'
    },

    // Reduced motion preferences
    reducedMotion: {
      duration: '0.01ms',
      easing: 'linear'
    }
  },

  /**
   * Dark Mode Tokens
   * 
   * Complete dark mode color system
   * for enterprise applications
   */
  darkMode: {
    colors: {
      background: {
        primary: '#0a0a0a',
        secondary: '#171717',
        tertiary: '#262626'
      },
      text: {
        primary: '#ffffff',
        secondary: '#d4d4d4',
        tertiary: '#a3a3a3'
      },
      border: {
        DEFAULT: '#404040',
        light: '#525252',
        dark: '#262626'
      }
    }
  }
};

// CSS Custom Properties for Runtime Theme Switching
export const cssVariables = {
  ':root': {
    // Primary colors
    '--color-primary-50': designTokens.colors.primary[50],
    '--color-primary-500': designTokens.colors.primary[500],
    '--color-primary-600': designTokens.colors.primary[600],
    '--color-primary-900': designTokens.colors.primary[900],
    
    // Semantic colors
    '--color-success': designTokens.colors.semantic.success.DEFAULT,
    '--color-warning': designTokens.colors.semantic.warning.DEFAULT,
    '--color-error': designTokens.colors.semantic.error.DEFAULT,
    '--color-info': designTokens.colors.semantic.info.DEFAULT,
    
    // Text colors
    '--color-text-primary': designTokens.colors.text.primary,
    '--color-text-secondary': designTokens.colors.text.secondary,
    '--color-text-tertiary': designTokens.colors.text.tertiary,
    
    // Background colors
    '--color-bg-primary': designTokens.colors.background.primary,
    '--color-bg-secondary': designTokens.colors.background.secondary,
    '--color-bg-tertiary': designTokens.colors.background.tertiary,
    
    // Border colors
    '--color-border-default': designTokens.colors.border.DEFAULT,
    '--color-border-focus': designTokens.colors.border.focus,
    
    // Spacing
    '--spacing-xs': designTokens.spacing[1],
    '--spacing-sm': designTokens.spacing[2],
    '--spacing-md': designTokens.spacing[4],
    '--spacing-lg': designTokens.spacing[6],
    '--spacing-xl': designTokens.spacing[8],
    
    // Typography
    '--font-family-sans': designTokens.typography.fontFamily.sans.join(', '),
    '--font-size-sm': designTokens.typography.fontSize.sm[0],
    '--font-size-base': designTokens.typography.fontSize.base[0],
    '--font-size-lg': designTokens.typography.fontSize.lg[0],
    '--font-size-xl': designTokens.typography.fontSize.xl[0],
    
    // Shadows
    '--shadow-sm': designTokens.shadows.sm,
    '--shadow-md': designTokens.shadows.md,
    '--shadow-lg': designTokens.shadows.lg,
    '--shadow-focus': designTokens.shadows.focus,
    
    // Border radius
    '--border-radius-sm': designTokens.borderRadius.sm,
    '--border-radius-md': designTokens.borderRadius.md,
    '--border-radius-lg': designTokens.borderRadius.lg,
    
    // Animation
    '--duration-fast': designTokens.animation.duration.fast,
    '--duration-normal': designTokens.animation.duration.normal,
    '--duration-slow': designTokens.animation.duration.slow,
    '--easing-default': designTokens.animation.easing.DEFAULT,
    
    // Component tokens
    '--button-height-md': designTokens.components.button.height.md,
    '--input-height-md': designTokens.components.input.height.md,
    '--nav-height-md': designTokens.components.nav.height.md,
    
    // Accessibility
    '--focus-outline': designTokens.accessibility.focus.outline,
    '--touch-target-min': designTokens.accessibility.touchTarget.minHeight
  },
  
  // Dark mode overrides
  '[data-theme="dark"]': {
    '--color-bg-primary': designTokens.darkMode.colors.background.primary,
    '--color-bg-secondary': designTokens.darkMode.colors.background.secondary,
    '--color-bg-tertiary': designTokens.darkMode.colors.background.tertiary,
    '--color-text-primary': designTokens.darkMode.colors.text.primary,
    '--color-text-secondary': designTokens.darkMode.colors.text.secondary,
    '--color-text-tertiary': designTokens.darkMode.colors.text.tertiary,
    '--color-border-default': designTokens.darkMode.colors.border.DEFAULT
  },
  
  // High contrast mode
  '[data-theme="high-contrast"]': {
    '--color-text-primary': designTokens.accessibility.highContrast.text,
    '--color-bg-primary': designTokens.accessibility.highContrast.background,
    '--color-border-default': designTokens.accessibility.highContrast.border
  },
  
  // Reduced motion preferences
  '@media (prefers-reduced-motion: reduce)': {
    '--duration-fast': designTokens.accessibility.reducedMotion.duration,
    '--duration-normal': designTokens.accessibility.reducedMotion.duration,
    '--duration-slow': designTokens.accessibility.reducedMotion.duration,
    '--easing-default': designTokens.accessibility.reducedMotion.easing
  }
};

export default designTokens;