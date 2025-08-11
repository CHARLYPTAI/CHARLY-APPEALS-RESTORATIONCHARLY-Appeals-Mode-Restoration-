import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface TypographyScale {
  largeTitle: number;
  title1: number;
  title2: number;
  title3: number;
  headline: number;
  body: number;
  callout: number;
  subheadline: number;
  footnote: number;
  caption1: number;
  caption2: number;
}

interface SpacingScale {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

interface TypographyTheme {
  scale: TypographyScale;
  spacing: SpacingScale;
  lineHeight: {
    tight: number;
    normal: number;
    loose: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
  fontWeights: {
    ultraLight: number;
    thin: number;
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    heavy: number;
    black: number;
  };
  fontFamilies: {
    system: string;
    monospace: string;
    serif: string;
  };
}

interface TypographyConfig {
  baseSize: number;
  scaleRatio: number;
  enableDynamicScaling: boolean;
  accessibilityMode: boolean;
  contrastMode: 'normal' | 'high' | 'enhanced';
  readingMode: 'default' | 'focus' | 'comfort';
}

interface TypographyContextType {
  theme: TypographyTheme;
  config: TypographyConfig;
  updateConfig: (config: Partial<TypographyConfig>) => void;
  getTextSize: (variant: keyof TypographyScale, context?: 'display' | 'content' | 'ui') => number;
  getSpacing: (size: keyof SpacingScale, multiplier?: number) => number;
  getLineHeight: (variant: keyof TypographyScale) => number;
  getLetterSpacing: (variant: keyof TypographyScale) => number;
  isAccessibilityMode: boolean;
  textScaleFactor: number;
  contentImportance: 'primary' | 'secondary' | 'tertiary';
  setContentImportance: (importance: 'primary' | 'secondary' | 'tertiary') => void;
}

const TypographyContext = createContext<TypographyContextType | undefined>(undefined);

const GOLDEN_RATIO = 1.618;

const createTypographyScale = (baseSize: number, ratio: number): TypographyScale => {
  const scale = (steps: number) => baseSize * Math.pow(ratio, steps);
  
  return {
    largeTitle: scale(6),
    title1: scale(5),
    title2: scale(4),
    title3: scale(3),
    headline: scale(2),
    body: baseSize,
    callout: scale(0.5),
    subheadline: scale(-0.5),
    footnote: scale(-1),
    caption1: scale(-1.5),
    caption2: scale(-2),
  };
};

const createSpacingScale = (baseSize: number): SpacingScale => {
  const goldenSpacing = (multiplier: number) => baseSize * GOLDEN_RATIO * multiplier;
  
  return {
    xxs: goldenSpacing(0.125),
    xs: goldenSpacing(0.25),
    sm: goldenSpacing(0.5),
    md: goldenSpacing(1),
    lg: goldenSpacing(1.5),
    xl: goldenSpacing(2),
    xxl: goldenSpacing(3),
    xxxl: goldenSpacing(4),
  };
};

const defaultTheme: TypographyTheme = {
  scale: createTypographyScale(16, GOLDEN_RATIO),
  spacing: createSpacingScale(16),
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    loose: 1.6,
  },
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
  fontWeights: {
    ultraLight: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
    black: 900,
  },
  fontFamilies: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    monospace: 'SF Mono, Monaco, Inconsolata, "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", monospace',
    serif: 'Georgia, "Times New Roman", serif',
  },
};

const defaultConfig: TypographyConfig = {
  baseSize: 16,
  scaleRatio: GOLDEN_RATIO,
  enableDynamicScaling: true,
  accessibilityMode: false,
  contrastMode: 'normal',
  readingMode: 'default',
};

interface TypographyProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<TypographyConfig>;
}

export const TypographyProvider: React.FC<TypographyProviderProps> = ({
  children,
  initialConfig = {},
}) => {
  const [config, setConfig] = useState<TypographyConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [contentImportance, setContentImportance] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [textScaleFactor, setTextScaleFactor] = useState(1);
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);

  const theme = useMemo(() => {
    const baseSize = config.baseSize * textScaleFactor;
    const ratio = config.scaleRatio;
    
    return {
      ...defaultTheme,
      scale: createTypographyScale(baseSize, ratio),
      spacing: createSpacingScale(baseSize),
    };
  }, [config.baseSize, config.scaleRatio, textScaleFactor]);

  const updateConfig = (newConfig: Partial<TypographyConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getTextSize = (
    variant: keyof TypographyScale,
    context: 'display' | 'content' | 'ui' = 'content'
  ): number => {
    const baseSize = theme.scale[variant];
    let contextMultiplier = 1;
    
    switch (context) {
      case 'display':
        contextMultiplier = 1.1;
        break;
      case 'ui':
        contextMultiplier = 0.95;
        break;
      default:
        contextMultiplier = 1;
    }
    
    const importanceMultiplier = contentImportance === 'primary' ? 1.05 : 
                                contentImportance === 'secondary' ? 1 : 0.95;
    
    return baseSize * contextMultiplier * importanceMultiplier;
  };

  const getSpacing = (size: keyof SpacingScale, multiplier: number = 1): number => {
    return theme.spacing[size] * multiplier;
  };

  const getLineHeight = (variant: keyof TypographyScale): number => {
    const size = theme.scale[variant];
    
    if (size > 32) return theme.lineHeight.tight;
    if (size > 20) return theme.lineHeight.normal;
    return theme.lineHeight.loose;
  };

  const getLetterSpacing = (variant: keyof TypographyScale): number => {
    const size = theme.scale[variant];
    
    if (size > 32) return theme.letterSpacing.tight;
    if (size > 20) return theme.letterSpacing.normal;
    return theme.letterSpacing.wide;
  };

  useEffect(() => {
    const handleResize = () => {
      if (!config.enableDynamicScaling) return;
      
      const viewportWidth = window.innerWidth;
      const breakpoints = {
        mobile: 320,
        tablet: 768,
        desktop: 1024,
        wide: 1440,
      };
      
      let scaleFactor = 1;
      
      if (viewportWidth <= breakpoints.mobile) {
        scaleFactor = 0.9;
      } else if (viewportWidth <= breakpoints.tablet) {
        scaleFactor = 0.95;
      } else if (viewportWidth >= breakpoints.wide) {
        scaleFactor = 1.1;
      }
      
      setTextScaleFactor(scaleFactor);
    };

    const handleAccessibilityChange = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersLargeText = window.matchMedia('(prefers-contrast: high)').matches;
      
      setIsAccessibilityMode(prefersReducedMotion || prefersLargeText);
      
      if (prefersLargeText) {
        setTextScaleFactor(prev => Math.max(prev, 1.2));
      }
    };

    handleResize();
    handleAccessibilityChange();
    
    window.addEventListener('resize', handleResize);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', handleAccessibilityChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleAccessibilityChange);
    };
  }, [config.enableDynamicScaling]);

  const contextValue: TypographyContextType = {
    theme,
    config,
    updateConfig,
    getTextSize,
    getSpacing,
    getLineHeight,
    getLetterSpacing,
    isAccessibilityMode,
    textScaleFactor,
    contentImportance,
    setContentImportance,
  };

  return (
    <TypographyContext.Provider value={contextValue}>
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = (): TypographyContextType => {
  const context = useContext(TypographyContext);
  if (!context) {
    throw new Error('useTypography must be used within a TypographyProvider');
  }
  return context;
};


export { TypographyScale, SpacingScale, TypographyTheme, TypographyConfig };