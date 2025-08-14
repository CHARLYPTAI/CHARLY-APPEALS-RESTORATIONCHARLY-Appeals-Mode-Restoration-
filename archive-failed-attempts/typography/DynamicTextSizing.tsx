import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useTypography } from './TypographyProvider';

interface TextSizingConfig {
  minSize: number;
  maxSize: number;
  autoSize: boolean;
  respectUserPreferences: boolean;
  enableFluidScaling: boolean;
  maintainRatio: boolean;
}

interface DynamicTextSizingProps {
  children: React.ReactNode;
  variant?: 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2';
  config?: Partial<TextSizingConfig>;
  containerRef?: React.RefObject<HTMLElement>;
  className?: string;
  style?: React.CSSProperties;
}

const DynamicTextSizing: React.FC<DynamicTextSizingProps> = ({
  children,
  variant = 'body',
  config = {},
  containerRef,
  className = '',
  style = {},
}) => {
  const { getTextSize, textScaleFactor, isAccessibilityMode } = useTypography();
  const textRef = useRef<HTMLDivElement>(null);
  const [userFontSize, setUserFontSize] = useState(100);
  const [systemFontSize, setSystemFontSize] = useState(100);
  const [fluidScale, setFluidScale] = useState(1);
  
  const finalConfig = useMemo(() => {
    const defaultConfig: TextSizingConfig = {
      minSize: 12,
      maxSize: 72,
      autoSize: true,
      respectUserPreferences: true,
      enableFluidScaling: true,
      maintainRatio: true,
    };
    
    return { ...defaultConfig, ...config };
  }, [config]);
  
  const baseSize = getTextSize(variant);
  const fontSize = useMotionValue(baseSize);
  const animatedFontSize = useSpring(fontSize, {
    damping: 25,
    stiffness: 200,
    mass: 0.8,
  });

  const detectUserPreferences = useCallback(() => {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const browserDefault = 16;
    const userPreference = (rootFontSize / browserDefault) * 100;
    setUserFontSize(userPreference);
    
    const systemPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 95 : 100;
    setSystemFontSize(systemPreference);
  }, []);

  const calculateFluidScale = useCallback(() => {
    if (!finalConfig.enableFluidScaling) return 1;
    
    const minViewport = 320;
    const maxViewport = 1920;
    const currentViewport = window.innerWidth;
    
    const clampedViewport = Math.max(minViewport, Math.min(maxViewport, currentViewport));
    const viewportRatio = (clampedViewport - minViewport) / (maxViewport - minViewport);
    
    const minScale = 0.8;
    const maxScale = 1.2;
    const scale = minScale + (viewportRatio * (maxScale - minScale));
    
    return scale;
  }, [finalConfig.enableFluidScaling]);

  const calculateOptimalSize = useCallback(() => {
    let calculatedSize = baseSize;
    
    if (finalConfig.respectUserPreferences) {
      calculatedSize *= (userFontSize / 100);
      calculatedSize *= (systemFontSize / 100);
    }
    
    calculatedSize *= textScaleFactor;
    
    if (finalConfig.enableFluidScaling) {
      calculatedSize *= fluidScale;
    }
    
    if (isAccessibilityMode) {
      calculatedSize *= 1.2;
    }
    
    if (finalConfig.autoSize && containerRef?.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      
      if (textWidth > containerWidth) {
        const scaleFactor = containerWidth / textWidth;
        calculatedSize *= Math.max(0.8, scaleFactor);
      }
    }
    
    calculatedSize = Math.max(finalConfig.minSize, Math.min(finalConfig.maxSize, calculatedSize));
    
    return calculatedSize;
  }, [
    baseSize,
    finalConfig,
    userFontSize,
    systemFontSize,
    textScaleFactor,
    fluidScale,
    isAccessibilityMode,
    containerRef,
  ]);

  const updateFontSize = useCallback(() => {
    const newSize = calculateOptimalSize();
    fontSize.set(newSize);
  }, [calculateOptimalSize, fontSize]);

  useEffect(() => {
    detectUserPreferences();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handlePreferenceChange = () => {
      detectUserPreferences();
    };
    
    mediaQuery.addEventListener('change', handlePreferenceChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, [detectUserPreferences]);

  useEffect(() => {
    const newFluidScale = calculateFluidScale();
    setFluidScale(newFluidScale);
    
    const handleResize = () => {
      const newScale = calculateFluidScale();
      setFluidScale(newScale);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateFluidScale]);

  useEffect(() => {
    updateFontSize();
  }, [updateFontSize]);

  useEffect(() => {
    if (!finalConfig.autoSize) return;
    
    const resizeObserver = new ResizeObserver(() => {
      updateFontSize();
    });
    
    if (containerRef?.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [finalConfig.autoSize, updateFontSize, containerRef]);

  const getLineHeight = useCallback((size: number) => {
    if (size > 32) return 1.2;
    if (size > 20) return 1.4;
    if (size > 16) return 1.5;
    return 1.6;
  }, []);

  const getLetterSpacing = useCallback((size: number) => {
    if (size > 32) return '-0.02em';
    if (size > 20) return '-0.01em';
    if (size > 16) return '0';
    return '0.01em';
  }, []);

  const textStyles: React.CSSProperties = {
    fontSize: animatedFontSize,
    lineHeight: getLineHeight(calculateOptimalSize()),
    letterSpacing: getLetterSpacing(calculateOptimalSize()),
    '--user-font-size': `${userFontSize}%`,
    '--system-font-size': `${systemFontSize}%`,
    '--fluid-scale': fluidScale.toFixed(3),
    '--text-scale-factor': textScaleFactor.toFixed(3),
    '--is-accessibility-mode': isAccessibilityMode ? '1' : '0',
    '--min-size': `${finalConfig.minSize}px`,
    '--max-size': `${finalConfig.maxSize}px`,
    transition: 'line-height 0.3s ease, letter-spacing 0.3s ease',
    ...style,
  };

  return (
    <motion.div
      ref={textRef}
      className={`dynamic-text-sizing ${variant} ${className}`}
      style={textStyles}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="text-sizing-debug" style={{
          position: 'absolute',
          top: '-30px',
          right: '0',
          background: '#2196F3',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 500,
          zIndex: 1000,
        }}>
          {Math.round(calculateOptimalSize())}px
        </div>
      )}
    </motion.div>
  );
};


export default DynamicTextSizing;