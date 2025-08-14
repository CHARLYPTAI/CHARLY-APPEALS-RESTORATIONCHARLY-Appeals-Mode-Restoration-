/**
 * responsive_config.js: CHARLY Mobile-First Responsive Configuration
 * 
 * Enterprise-grade responsive design system combining Steve Jobs' mobile UX
 * principles with Larry Ellison's performance engineering standards.
 * 
 * Author: CHARLY Chief Design & Engineering Architect
 * Version: 1.0.0
 */

// Advanced Breakpoint System - Mobile-First Philosophy
const BREAKPOINTS = {
  // Mobile-first breakpoints following industry standards
  'xs': '320px',    // Small phones (iPhone SE, older Android)
  'sm': '640px',    // Large phones (iPhone 12, Galaxy S21)
  'md': '768px',    // Tablets (iPad Mini, smaller tablets)
  'lg': '1024px',   // Small laptops (iPad Pro, Surface Pro)
  'xl': '1280px',   // Desktops (MacBook Pro 13", standard monitors)
  'xxl': '1536px'   // Large displays (iMac, 4K monitors)
};

// Device Type Classification
const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop',
  LARGE_DESKTOP: 'large_desktop'
};

// Touch Target Standards (Apple Human Interface Guidelines)
const TOUCH_TARGETS = {
  MINIMUM: '44px',     // Apple HIG minimum
  RECOMMENDED: '48px', // Google Material Design recommendation
  COMFORTABLE: '56px', // Enhanced accessibility
  LARGE: '64px'        // High-traffic actions
};

// Typography Scale - Mobile-Optimized
const TYPOGRAPHY = {
  // Font sizes that scale appropriately across devices
  'text-xs': '0.75rem',   // 12px - Fine print
  'text-sm': '0.875rem',  // 14px - Secondary text
  'text-base': '1rem',    // 16px - Body text (mobile standard)
  'text-lg': '1.125rem',  // 18px - Large body text
  'text-xl': '1.25rem',   // 20px - Small headings
  'text-2xl': '1.5rem',   // 24px - Medium headings
  'text-3xl': '1.875rem', // 30px - Large headings
  'text-4xl': '2.25rem',  // 36px - Display text
  'text-5xl': '3rem',     // 48px - Hero text
  
  // Line heights optimized for mobile reading
  'leading-tight': '1.25',
  'leading-normal': '1.5',
  'leading-relaxed': '1.625',
  
  // Font weights
  'font-light': '300',
  'font-normal': '400',
  'font-medium': '500',
  'font-semibold': '600',
  'font-bold': '700'
};

// Spacing System - 8px Grid System
const SPACING = {
  // Base unit: 0.25rem = 4px
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
  
  // Mobile-specific spacing
  'mobile-tight': '0.5rem',    // 8px - Tight mobile spacing
  'mobile-normal': '1rem',     // 16px - Standard mobile spacing
  'mobile-loose': '1.5rem',    // 24px - Loose mobile spacing
  
  // Desktop spacing
  'desktop-tight': '1rem',     // 16px
  'desktop-normal': '2rem',    // 32px
  'desktop-loose': '3rem'      // 48px
};

// Color System - High Contrast for Mobile Outdoor Usage
const COLORS = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // Secondary colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  
  // Success, warning, error - High contrast for mobile
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Mobile-optimized colors
  mobile: {
    background: '#ffffff',
    surface: '#f8fafc',
    text_primary: '#0f172a',
    text_secondary: '#64748b',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }
};

// Dark Mode Colors - OLED Optimization
const DARK_COLORS = {
  primary: {
    50: '#0f172a',
    500: '#60a5fa',  // Brighter blue for dark mode
    900: '#eff6ff'
  },
  
  background: '#000000',     // True black for OLED
  surface: '#111827',        // Dark surface
  text_primary: '#f9fafb',   // High contrast white
  text_secondary: '#9ca3af', // Muted text
  border: '#374151',         // Dark border
  shadow: 'rgba(0, 0, 0, 0.5)'
};

// Component Configuration
const COMPONENTS = {
  // Button configurations
  button: {
    mobile: {
      height: TOUCH_TARGETS.RECOMMENDED,
      padding: `${SPACING['3']} ${SPACING['6']}`,
      fontSize: TYPOGRAPHY['text-base'],
      borderRadius: '8px'
    },
    desktop: {
      height: '40px',
      padding: `${SPACING['2']} ${SPACING['5']}`,
      fontSize: TYPOGRAPHY['text-sm'],
      borderRadius: '6px'
    }
  },
  
  // Input field configurations
  input: {
    mobile: {
      height: TOUCH_TARGETS.COMFORTABLE,
      fontSize: TYPOGRAPHY['text-base'],
      padding: `${SPACING['3']} ${SPACING['4']}`,
      borderRadius: '8px'
    },
    desktop: {
      height: '40px',
      fontSize: TYPOGRAPHY['text-sm'],
      padding: `${SPACING['2']} ${SPACING['3']}`,
      borderRadius: '6px'
    }
  },
  
  // Card component
  card: {
    mobile: {
      padding: SPACING['4'],
      margin: SPACING['2'],
      borderRadius: '12px',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    desktop: {
      padding: SPACING['6'],
      margin: SPACING['4'],
      borderRadius: '8px',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    }
  }
};

// Performance Budgets
const PERFORMANCE = {
  // Image optimization
  images: {
    mobile_max_width: 768,
    mobile_quality: 75,
    desktop_quality: 85,
    lazy_load_threshold: 2,  // Load 2 screens ahead
    formats: ['webp', 'jpg', 'png']
  },
  
  // Bundle size limits
  bundles: {
    critical_css: '50kb',    // Critical CSS for above-fold
    js_chunk: '250kb',       // Maximum JS chunk size
    total_page: '1mb'        // Total page weight limit
  },
  
  // Loading targets
  performance_targets: {
    fcp: 1500,              // First Contentful Paint (ms)
    lcp: 2500,              // Largest Contentful Paint (ms)
    fid: 100,               // First Input Delay (ms)
    cls: 0.1                // Cumulative Layout Shift
  }
};

// Feature Flags for Progressive Enhancement
const FEATURES = {
  // Advanced features that can be disabled on slower devices
  advanced_charts: {
    enabled: true,
    mobile_threshold: 'md',  // Enable on medium screens and up
    memory_threshold: 2048   // Require 2GB+ RAM
  },
  
  animations: {
    enabled: true,
    reduce_motion_support: true,
    mobile_simplified: true
  },
  
  offline_support: {
    enabled: true,
    cache_size: '50mb',
    data_retention: '7d'
  },
  
  pwa_features: {
    enabled: true,
    install_prompt: true,
    push_notifications: false  // Disabled for property data privacy
  }
};

// Device Capability Detection Rules
const DEVICE_CAPABILITIES = {
  // Memory thresholds for feature enablement
  memory_levels: {
    low: 1024,      // <1GB - Minimal features
    medium: 2048,   // 1-2GB - Standard features  
    high: 4096,     // 2-4GB - Enhanced features
    premium: 8192   // >4GB - All features
  },
  
  // Network speed categories
  network_speeds: {
    slow: 'slow-2g',
    medium: '3g', 
    fast: '4g'
  },
  
  // Touch capability detection
  touch_support: {
    detect_method: 'ontouchstart',
    hover_support: 'pointer: fine',
    precision: 'any-pointer: fine'
  }
};

// Grid System - 12 Column Responsive Grid
const GRID = {
  columns: 12,
  gap: {
    mobile: SPACING['4'],     // 16px
    tablet: SPACING['6'],     // 24px
    desktop: SPACING['8']     // 32px
  },
  
  // Container max widths
  container: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px'
  },
  
  // Responsive column patterns
  patterns: {
    mobile_stack: {
      xs: 12,      // Full width on mobile
      md: 6,       // Half width on tablet
      lg: 4        // Third width on desktop
    },
    
    sidebar_layout: {
      xs: 12,      // Stack on mobile
      lg: [8, 4]   // 2/3 main, 1/3 sidebar on desktop
    },
    
    three_column: {
      xs: 12,      // Stack on mobile
      md: 6,       // Two columns on tablet
      lg: 4        // Three columns on desktop
    }
  }
};

// Animation Configuration
const ANIMATIONS = {
  // Durations (following Apple HIG)
  durations: {
    instant: '0ms',
    fast: '150ms',      // Quick feedback
    normal: '250ms',    // Standard transitions
    slow: '350ms',      // Complex animations
    page: '500ms'       // Page transitions
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    ease_in: 'cubic-bezier(0.4, 0, 1, 1)',
    ease_out: 'cubic-bezier(0, 0, 0.2, 1)',
    ease_in_out: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Reduced motion preferences
  reduced_motion: {
    respect_preference: true,
    fallback_duration: '0ms',
    alternative_indication: 'opacity'  // Use opacity instead of transforms
  }
};

// Mobile-Specific Configurations
const MOBILE_CONFIG = {
  // Viewport settings
  viewport: {
    width: 'device-width',
    initial_scale: 1,
    maximum_scale: 5,  // Allow zoom for accessibility
    user_scalable: 'yes',
    viewport_fit: 'cover'  // iPhone X+ notch support
  },
  
  // Touch and gesture settings
  touch: {
    action: 'manipulation',  // Disable double-tap zoom
    select: 'none',         // Prevent text selection on UI elements
    callout: 'none',        // Disable iOS callout
    tap_highlight: 'transparent'  // Remove tap highlight
  },
  
  // iOS specific
  ios: {
    status_bar: 'black-translucent',
    format_detection: 'telephone=no',  // Prevent auto-detection
    apple_mobile_web_app_capable: 'yes',
    apple_mobile_web_app_status_bar_style: 'default'
  },
  
  // Android specific
  android: {
    theme_color: COLORS.primary[500],
    color_scheme: 'light dark'
  }
};

// Export configuration object
const RESPONSIVE_CONFIG = {
  breakpoints: BREAKPOINTS,
  deviceTypes: DEVICE_TYPES,
  touchTargets: TOUCH_TARGETS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  colors: COLORS,
  darkColors: DARK_COLORS,
  components: COMPONENTS,
  performance: PERFORMANCE,
  features: FEATURES,
  deviceCapabilities: DEVICE_CAPABILITIES,
  grid: GRID,
  animations: ANIMATIONS,
  mobile: MOBILE_CONFIG
};

// Utility functions for JavaScript environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RESPONSIVE_CONFIG;
}

// For browser environments
if (typeof window !== 'undefined') {
  window.CHARLY_RESPONSIVE_CONFIG = RESPONSIVE_CONFIG;
}

/**
 * Utility function to get responsive value based on screen size
 * @param {Object} values - Object with breakpoint keys and values
 * @param {string} currentBreakpoint - Current screen breakpoint
 * @returns {any} Appropriate value for current breakpoint
 */
function getResponsiveValue(values, currentBreakpoint) {
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Find the largest breakpoint that has a value and is <= current
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  // Fallback to smallest available value
  for (const bp of breakpointOrder) {
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return null;
}

/**
 * Check if device is mobile based on screen width
 * @param {number} width - Screen width in pixels
 * @returns {boolean} True if device is considered mobile
 */
function isMobileDevice(width = window.innerWidth) {
  return width < parseInt(BREAKPOINTS.md);
}

/**
 * Get device type based on screen width
 * @param {number} width - Screen width in pixels
 * @returns {string} Device type from DEVICE_TYPES
 */
function getDeviceType(width = window.innerWidth) {
  if (width < parseInt(BREAKPOINTS.md)) {
    return DEVICE_TYPES.MOBILE;
  } else if (width < parseInt(BREAKPOINTS.lg)) {
    return DEVICE_TYPES.TABLET;
  } else if (width < parseInt(BREAKPOINTS.xxl)) {
    return DEVICE_TYPES.DESKTOP;
  } else {
    return DEVICE_TYPES.LARGE_DESKTOP;
  }
}

// Export utility functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports.utils = {
    getResponsiveValue,
    isMobileDevice,
    getDeviceType
  };
}