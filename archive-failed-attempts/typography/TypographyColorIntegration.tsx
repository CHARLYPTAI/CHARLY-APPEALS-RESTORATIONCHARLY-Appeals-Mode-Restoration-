import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTypography } from './TypographyProvider';
import { useContrastValidator } from './ContrastValidator';

interface TypographyColorIntegrationProps {
  children: React.ReactNode;
  priority?: 'primary' | 'secondary' | 'tertiary';
  semanticColor?: 'default' | 'success' | 'warning' | 'error' | 'info';
  adaptToBackground?: boolean;
  enforceContrast?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TypographyColorIntegration: React.FC<TypographyColorIntegrationProps> = ({
  children,
  priority = 'primary',
  semanticColor = 'default',
  adaptToBackground = true,
  enforceContrast = true,
  className = '',
  style = {},
}) => {
  const { theme, config, isAccessibilityMode } = useTypography();
  const { validateColors } = useContrastValidator();
  const [computedColors, setComputedColors] = useState({
    text: '',
    background: '',
    accent: '',
  });
  const [isContrastValid, setIsContrastValid] = useState(true);
  const elementRef = useRef<HTMLDivElement>(null);

  const getSemanticColors = useCallback(() => {
    const colorMap = {
      default: {
        text: 'var(--color-text-primary)',
        background: 'var(--color-background-primary)',
        accent: 'var(--color-primary)',
      },
      success: {
        text: 'var(--color-success-text)',
        background: 'var(--color-success-background)',
        accent: 'var(--color-success)',
      },
      warning: {
        text: 'var(--color-warning-text)',
        background: 'var(--color-warning-background)',
        accent: 'var(--color-warning)',
      },
      error: {
        text: 'var(--color-error-text)',
        background: 'var(--color-error-background)',
        accent: 'var(--color-error)',
      },
      info: {
        text: 'var(--color-info-text)',
        background: 'var(--color-info-background)',
        accent: 'var(--color-info)',
      },
    };
    
    return colorMap[semanticColor] || colorMap.default;
  }, [semanticColor]);

  const getPriorityColors = useCallback(() => {
    const priorityMap = {
      primary: {
        opacity: 1,
        fontWeight: theme.fontWeights.semibold,
        textShadow: 'none',
      },
      secondary: {
        opacity: 0.8,
        fontWeight: theme.fontWeights.regular,
        textShadow: 'none',
      },
      tertiary: {
        opacity: 0.6,
        fontWeight: theme.fontWeights.light,
        textShadow: 'none',
      },
    };
    
    return priorityMap[priority] || priorityMap.primary;
  }, [priority, theme.fontWeights]);

  const adaptColorsToBackground = useCallback(() => {
    if (!adaptToBackground || !elementRef.current) return;

    const element = elementRef.current;
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const semanticColors = getSemanticColors();
      const result = validateColors(semanticColors.text, backgroundColor);
      
      if (result && result.ratio < 4.5 && enforceContrast) {
        const adjustedTextColor = result.ratio < 3 ? 
          (isAccessibilityMode ? '#000000' : '#333333') : 
          semanticColors.text;
        
        setComputedColors({
          text: adjustedTextColor,
          background: backgroundColor,
          accent: semanticColors.accent,
        });
        setIsContrastValid(result.ratio >= 4.5);
      } else {
        setComputedColors({
          text: semanticColors.text,
          background: backgroundColor,
          accent: semanticColors.accent,
        });
        setIsContrastValid(true);
      }
    }
  }, [adaptToBackground, enforceContrast, getSemanticColors, validateColors, isAccessibilityMode]);

  const getAccessibilityEnhancements = useCallback(() => {
    if (!isAccessibilityMode) return {};
    
    return {
      textShadow: config.contrastMode === 'high' ? 
        '0 0 1px rgba(0, 0, 0, 0.8)' : 'none',
      fontWeight: theme.fontWeights.medium,
      letterSpacing: '0.01em',
      lineHeight: 1.6,
    };
  }, [isAccessibilityMode, config.contrastMode, theme.fontWeights]);

  useEffect(() => {
    adaptColorsToBackground();
    
    const resizeObserver = new ResizeObserver(() => {
      adaptColorsToBackground();
    });
    
    if (elementRef.current) {
      resizeObserver.observe(elementRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [adaptColorsToBackground]);

  const colorIntegrationStyles: React.CSSProperties = {
    ...getSemanticColors(),
    ...getPriorityColors(),
    ...getAccessibilityEnhancements(),
    '--computed-text-color': computedColors.text || 'currentColor',
    '--computed-background-color': computedColors.background || 'transparent',
    '--computed-accent-color': computedColors.accent || 'var(--color-primary)',
    '--is-contrast-valid': isContrastValid ? '1' : '0',
    '--semantic-color': semanticColor,
    '--priority-level': priority,
    transition: 'color 0.3s ease, background-color 0.3s ease',
    ...style,
  };

  return (
    <motion.div
      ref={elementRef}
      className={`typography-color-integration ${semanticColor} ${priority} ${className}`}
      style={colorIntegrationStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      {process.env.NODE_ENV === 'development' && !isContrastValid && (
        <div className="contrast-warning" style={{
          position: 'absolute',
          top: '-25px',
          right: '0',
          background: '#ff4444',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 500,
          zIndex: 1000,
        }}>
          Low Contrast
        </div>
      )}
    </motion.div>
  );
};


export default TypographyColorIntegration;