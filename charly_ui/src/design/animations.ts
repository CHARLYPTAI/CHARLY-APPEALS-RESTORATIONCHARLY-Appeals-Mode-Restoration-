// 🍎 Animation System - 300ms Everywhere
// "Every animation should feel inevitable" - Jony Ive

export const TRANSITIONS = {
  // THE universal timing - used everywhere
  STANDARD: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  
  // Specific properties when needed
  OPACITY: 'opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  TRANSFORM: 'transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  SHADOW: 'box-shadow 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  COLOR: 'color 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  
  // Special cases
  QUICK: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',  // Click feedback
  SLOW: 'all 450ms cubic-bezier(0.25, 0.1, 0.25, 1)',   // Page transitions
} as const;

export const SHADOWS = {
  NONE: 'none',
  SM: '0px 1px 3px rgba(0, 0, 0, 0.04)',
  MD: '0px 2px 10px rgba(0, 0, 0, 0.04)',
  LG: '0px 10px 40px rgba(0, 0, 0, 0.08)',
  HOVER: '0px 14px 48px rgba(0, 0, 0, 0.12)',
} as const;

// Animation utilities
export const EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1)' as const;
export const DURATION = 300 as const; // milliseconds

// Hover state generators
export const createHoverStyle = (baseStyle: any) => ({
  ...baseStyle,
  transition: TRANSITIONS.STANDARD,
  '&:hover': {
    boxShadow: SHADOWS.HOVER,
    transform: 'translateY(-1px)',
  },
});

// Click feedback
export const createClickStyle = (baseStyle: any) => ({
  ...baseStyle,
  transition: TRANSITIONS.STANDARD,
  '&:active': {
    transform: 'scale(0.98)',
    transition: TRANSITIONS.QUICK,
  },
});

// Loading animation keyframes
export const LOADING_DOTS = `
  @keyframes loadingDots {
    0%, 80%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    40% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
` as const;