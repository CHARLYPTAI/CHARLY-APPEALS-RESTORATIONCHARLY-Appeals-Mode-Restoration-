import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTypography } from './TypographyProvider';

interface SpacingCalculation {
  vertical: number;
  horizontal: number;
  optimal: number;
  harmonious: number;
}

interface GoldenRatioSpacingProps {
  children: React.ReactNode;
  variant?: 'container' | 'section' | 'component' | 'element';
  density?: 'compact' | 'normal' | 'spacious';
  rhythm?: 'tight' | 'normal' | 'loose';
  className?: string;
  style?: React.CSSProperties;
}

const GOLDEN_RATIO = 1.618;

const GoldenRatioSpacing: React.FC<GoldenRatioSpacingProps> = ({
  children,
  variant = 'component',
  density = 'normal',
  rhythm = 'normal',
  className = '',
  style = {},
}) => {
  const { getSpacing, theme } = useTypography();

  const spacingCalculations = useMemo((): SpacingCalculation => {
    const baseSpacing = getSpacing('md');
    
    const goldenVertical = baseSpacing * GOLDEN_RATIO;
    const goldenHorizontal = baseSpacing * (GOLDEN_RATIO - 1);
    
    const densityMultiplier = density === 'compact' ? 0.618 : 
                             density === 'spacious' ? GOLDEN_RATIO : 1;
    
    const rhythmMultiplier = rhythm === 'tight' ? 0.8 : 
                           rhythm === 'loose' ? 1.2 : 1;
    
    const variantMultiplier = variant === 'container' ? 2 : 
                            variant === 'section' ? 1.5 : 
                            variant === 'element' ? 0.5 : 1;
    
    const vertical = goldenVertical * densityMultiplier * rhythmMultiplier * variantMultiplier;
    const horizontal = goldenHorizontal * densityMultiplier * rhythmMultiplier * variantMultiplier;
    
    const optimal = Math.sqrt(vertical * horizontal);
    const harmonious = (vertical + horizontal) / GOLDEN_RATIO;
    
    return {
      vertical,
      horizontal,
      optimal,
      harmonious,
    };
  }, [getSpacing, density, rhythm, variant]);


  const verticalRhythm = useMemo(() => {
    const baseLineHeight = theme.scale.body * 1.4;
    const goldenRhythm = baseLineHeight * GOLDEN_RATIO;
    
    return {
      base: baseLineHeight,
      golden: goldenRhythm,
      half: goldenRhythm / 2,
      quarter: goldenRhythm / 4,
    };
  }, [theme.scale.body]);

  const spacingStyles: React.CSSProperties = {
    paddingTop: `${spacingCalculations.vertical}px`,
    paddingBottom: `${spacingCalculations.vertical}px`,
    paddingLeft: `${spacingCalculations.horizontal}px`,
    paddingRight: `${spacingCalculations.horizontal}px`,
    marginBottom: `${verticalRhythm.base}px`,
    '--spacing-vertical': `${spacingCalculations.vertical}px`,
    '--spacing-horizontal': `${spacingCalculations.horizontal}px`,
    '--spacing-optimal': `${spacingCalculations.optimal}px`,
    '--spacing-harmonious': `${spacingCalculations.harmonious}px`,
    '--golden-ratio': GOLDEN_RATIO.toString(),
    ...style,
  } as React.CSSProperties;

  return (
    <motion.div
      className={`golden-ratio-spacing ${variant} ${density} ${rhythm} ${className}`}
      style={spacingStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
};


export default GoldenRatioSpacing;