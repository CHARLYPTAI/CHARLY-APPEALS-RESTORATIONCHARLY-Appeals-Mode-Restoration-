export { TypographyProvider, useTypography } from './TypographyProvider';
export { default as DynamicFontEngine } from './DynamicFontEngine';
export { default as GoldenRatioSpacing } from './GoldenRatioSpacing';
export { default as ReadingFlowOptimizer } from './ReadingFlowOptimizer';
export { default as ContrastValidator } from './ContrastValidator';
export { default as AccessibilityCompliance } from './AccessibilityCompliance';
export { default as DynamicTextSizing } from './DynamicTextSizing';
export { default as HighContrastMode } from './HighContrastMode';
export { default as TypographyColorIntegration } from './TypographyColorIntegration';

// Export all hooks from the hooks file
export {
  useTypographyScale,
  useSpacing,
  useTextSizing,
  useGoldenRatioSpacing,
  useReadingFlow,
  useContrastValidator,
  useAccessibilityCompliance,
  useDynamicTextSizing,
  useHighContrastMode,
  useTypographyColorIntegration,
} from './hooks';

export type {
  TypographyScale,
  SpacingScale,
  TypographyTheme,
  TypographyConfig,
} from './TypographyProvider';