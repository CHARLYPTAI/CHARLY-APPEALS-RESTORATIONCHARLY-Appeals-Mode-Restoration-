// 🍎 CHARLY Design System - Apple Quality Standards
// Steve Jobs Implementation - Every pixel matters

export const colors = {
  // Primary Apple Colors - EXACTLY 4 colors only
  apple: {
    blue: '#007AFF',    // Primary actions, links, focus
    green: '#34C759',   // Success, savings, positive
    orange: '#FF9500',  // Warnings, time-sensitive
    red: '#FF3B30',     // Errors, critical only
  },
  
  // Neutral palette
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',    // Subtle backgrounds
      100: '#F3F4F6',   // Borders
      600: '#4B5563',   // Secondary text
      900: '#111827',   // Primary text
    },
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    text: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  
  lineHeight: 1.6,
  maxWidth: '65ch',
} as const;

export const spacing = {
  // 8px base system
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  6: '48px',
  8: '64px',   // Major sections
  16: '128px', // Page padding on large screens
} as const;

export const animations = {
  // ONE timing for everything - Apple perfection
  transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  
  shadows: {
    sm: '0px 1px 3px rgba(0, 0, 0, 0.04)',
    md: '0px 2px 10px rgba(0, 0, 0, 0.04)',
    lg: '0px 10px 40px rgba(0, 0, 0, 0.08)',
    hover: '0px 14px 48px rgba(0, 0, 0, 0.12)',
  },
  
  timing: {
    fast: '150ms',
    base: '300ms',
    slow: '450ms',
  },
} as const;

export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

// CSS Custom Properties for runtime usage
export const cssVariables = `
  :root {
    /* Colors */
    --apple-blue: ${colors.apple.blue};
    --apple-green: ${colors.apple.green};
    --apple-orange: ${colors.apple.orange};
    --apple-red: ${colors.apple.red};
    --white: ${colors.neutral.white};
    --black: ${colors.neutral.black};
    --gray-50: ${colors.neutral.gray[50]};
    --gray-100: ${colors.neutral.gray[100]};
    --gray-600: ${colors.neutral.gray[600]};
    --gray-900: ${colors.neutral.gray[900]};
    
    /* Typography */
    --font-display: ${typography.fontFamily.display};
    --font-text: ${typography.fontFamily.text};
    --line-height: ${typography.lineHeight};
    --max-width-text: ${typography.maxWidth};
    
    /* Spacing */
    --space-1: ${spacing[1]};
    --space-2: ${spacing[2]};
    --space-3: ${spacing[3]};
    --space-4: ${spacing[4]};
    --space-6: ${spacing[6]};
    --space-8: ${spacing[8]};
    --space-16: ${spacing[16]};
    
    /* Animation */
    --transition: ${animations.transition};
    --shadow-sm: ${animations.shadows.sm};
    --shadow-md: ${animations.shadows.md};
    --shadow-lg: ${animations.shadows.lg};
    --shadow-hover: ${animations.shadows.hover};
  }
` as const;

// Type definitions for TypeScript autocomplete
export type Color = keyof typeof colors.apple | keyof typeof colors.neutral;
export type Space = keyof typeof spacing;
export type FontSize = keyof typeof typography.fontSize;