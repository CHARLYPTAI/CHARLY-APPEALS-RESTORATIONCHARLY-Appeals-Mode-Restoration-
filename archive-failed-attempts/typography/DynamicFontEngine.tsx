import React, { useEffect, useState, useCallback } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useTypography } from './TypographyProvider';

interface FontSizeCalculation {
  baseSize: number;
  scaledSize: number;
  contextMultiplier: number;
  deviceMultiplier: number;
  accessibilityMultiplier: number;
}

interface DynamicFontEngineProps {
  content: string;
  variant: 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2';
  context?: 'display' | 'content' | 'ui';
  importance?: 'primary' | 'secondary' | 'tertiary';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ViewportMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  pixelDensity: number;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'wide';
}

const DynamicFontEngine: React.FC<DynamicFontEngineProps> = ({
  content,
  variant,
  context = 'content',
  importance = 'primary',
  children,
  className = '',
  style = {},
}) => {
  const { getTextSize, getLineHeight, getLetterSpacing, isAccessibilityMode } = useTypography();
  const [, setViewportMetrics] = useState<ViewportMetrics>({
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight,
    pixelDensity: window.devicePixelRatio,
    deviceType: 'desktop',
  });
  
  const fontSizeSpring = useSpring(getTextSize(variant, context), {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  });
  
  const lineHeightSpring = useSpring(getLineHeight(variant), {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  });
  
  const letterSpacingSpring = useSpring(getLetterSpacing(variant), {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  });

  const calculateOptimalFontSize = useCallback((metrics: ViewportMetrics): FontSizeCalculation => {
    const baseSize = getTextSize(variant, context);
    
    let deviceMultiplier = 1;
    switch (metrics.deviceType) {
      case 'mobile':
        deviceMultiplier = 0.9;
        break;
      case 'tablet':
        deviceMultiplier = 0.95;
        break;
      case 'wide':
        deviceMultiplier = 1.1;
        break;
      default:
        deviceMultiplier = 1;
    }
    
    const contextMultiplier = context === 'display' ? 1.1 : context === 'ui' ? 0.95 : 1;
    
    const importanceMultiplier = importance === 'primary' ? 1.05 : 
                                importance === 'secondary' ? 1 : 0.95;
    
    const accessibilityMultiplier = isAccessibilityMode ? 1.2 : 1;
    
    const readingDistanceMultiplier = metrics.deviceType === 'mobile' ? 1.1 : 1;
    
    const scaledSize = baseSize * deviceMultiplier * contextMultiplier * 
                      importanceMultiplier * accessibilityMultiplier * readingDistanceMultiplier;
    
    return {
      baseSize,
      scaledSize,
      contextMultiplier,
      deviceMultiplier,
      accessibilityMultiplier,
    };
  }, [variant, context, importance, isAccessibilityMode, getTextSize]);

  const updateViewportMetrics = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const pixelDensity = window.devicePixelRatio;
    
    let deviceType: ViewportMetrics['deviceType'] = 'desktop';
    if (width <= 768) deviceType = 'mobile';
    else if (width <= 1024) deviceType = 'tablet';
    else if (width >= 1440) deviceType = 'wide';
    
    const metrics: ViewportMetrics = {
      width,
      height,
      aspectRatio,
      pixelDensity,
      deviceType,
    };
    
    setViewportMetrics(metrics);
    
    const calculation = calculateOptimalFontSize(metrics);
    fontSizeSpring.set(calculation.scaledSize);
    lineHeightSpring.set(getLineHeight(variant));
    letterSpacingSpring.set(getLetterSpacing(variant));
  }, [calculateOptimalFontSize, fontSizeSpring, lineHeightSpring, letterSpacingSpring, variant, getLineHeight, getLetterSpacing]);

  useEffect(() => {
    updateViewportMetrics();
    
    const handleResize = () => {
      updateViewportMetrics();
    };
    
    const handleOrientationChange = () => {
      setTimeout(updateViewportMetrics, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewportMetrics]);

  // const calculateReadingMetrics = useCallback((text: string) => {
  //   const words = text.split(' ').length;
  //   const avgWordsPerMinute = 200;
  //   const readingTime = Math.ceil(words / avgWordsPerMinute);
  //   const complexity = text.length > 500 ? 'high' : text.length > 200 ? 'medium' : 'low';
  //   
  //   return { words, readingTime, complexity };
  // }, []);

  // const readingMetrics = calculateReadingMetrics(content);

  return (
    <motion.div
      className={`dynamic-font-engine ${className}`}
      style={{
        fontSize: fontSizeSpring,
        lineHeight: lineHeightSpring,
        letterSpacing: letterSpacingSpring,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: variant.includes('title') ? 600 : 
                   variant === 'headline' ? 500 : 
                   variant === 'body' ? 400 : 
                   variant.includes('caption') ? 300 : 400,
        color: importance === 'primary' ? 'var(--text-primary)' : 
               importance === 'secondary' ? 'var(--text-secondary)' : 'var(--text-tertiary)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children || content}
    </motion.div>
  );
};

export default DynamicFontEngine;