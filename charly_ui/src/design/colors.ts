// 🍎 Color Constants - Apple Keynote Specifications
// Steve Jobs: "Simplicity is the ultimate sophistication"

export const APPLE_COLORS = {
  BLUE: '#007AFF',
  GREEN: '#34C759', 
  ORANGE: '#FF9500',
  RED: '#FF3B30',
} as const;

export const NEUTRAL_COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_25: '#FAFAFA',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
} as const;

// Color utility functions
export const getColorForStatus = (status: 'success' | 'warning' | 'error' | 'info') => {
  switch (status) {
    case 'success': return APPLE_COLORS.GREEN;
    case 'warning': return APPLE_COLORS.ORANGE;
    case 'error': return APPLE_COLORS.RED;
    case 'info': return APPLE_COLORS.BLUE;
    default: return APPLE_COLORS.BLUE;
  }
};

export const getColorForValue = (value: number, isPositive: boolean = true) => {
  if (value === 0) return NEUTRAL_COLORS.GRAY_600;
  return isPositive ? APPLE_COLORS.GREEN : APPLE_COLORS.RED;
};