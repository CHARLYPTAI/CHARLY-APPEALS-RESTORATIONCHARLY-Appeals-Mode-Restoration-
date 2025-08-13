// 🍎 Spacing System - 8px Base Grid
// Perfect mathematical harmony in every layout

export const SPACING = {
  XS: '8px',    // space-1
  SM: '16px',   // space-2  
  MD: '24px',   // space-3
  LG: '32px',   // space-4
  XL: '48px',   // space-6
  XXL: '64px',  // space-8 - Major sections
  XXXL: '128px', // space-16 - Page padding
} as const;

// Semantic spacing for specific use cases
export const LAYOUT = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '280px',
  CARD_PADDING: SPACING.LG,
  SECTION_MARGIN: SPACING.XXL,
  PAGE_PADDING: SPACING.XL,
  BORDER_RADIUS: '12px',
} as const;

// Responsive spacing helpers
export const responsive = {
  mobile: {
    padding: SPACING.MD,
    margin: SPACING.LG,
  },
  desktop: {
    padding: SPACING.XL,
    margin: SPACING.XXL,
  },
} as const;