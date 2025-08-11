import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ContrastRatio {
  ratio: number;
  level: 'fail' | 'aa-large' | 'aa' | 'aaa';
  score: number;
}

interface ColorValues {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface ContrastValidatorProps {
  children: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  enforceCompliance?: boolean;
  minimumLevel?: 'aa-large' | 'aa' | 'aaa';
  onContrastChange?: (ratio: ContrastRatio) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ContrastValidator: React.FC<ContrastValidatorProps> = ({
  children,
  backgroundColor = '#ffffff',
  textColor = '#000000',
  fontSize = 16,
  fontWeight = 400,
  enforceCompliance = true,
  minimumLevel = 'aa',
  onContrastChange,
  className = '',
  style = {},
}) => {
  const [contrastRatio, setContrastRatio] = useState<ContrastRatio | null>(null);
  const [isCompliant, setIsCompliant] = useState(true);
  const [adjustedColors, setAdjustedColors] = useState({
    background: backgroundColor,
    text: textColor,
  });

  const hexToRgb = useCallback((hex: string): ColorValues | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }, []);

  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }, []);

  const getLuminance = useCallback((color: ColorValues): number => {
    const sRGB = [color.r, color.g, color.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }, []);

  const calculateContrastRatio = useCallback((color1: ColorValues, color2: ColorValues): ContrastRatio => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    
    let level: ContrastRatio['level'] = 'fail';
    if (isLargeText) {
      if (ratio >= 3) level = 'aa-large';
      if (ratio >= 4.5) level = 'aaa';
    } else {
      if (ratio >= 4.5) level = 'aa';
      if (ratio >= 7) level = 'aaa';
    }
    
    const score = Math.min(100, (ratio / 21) * 100);
    
    return { ratio, level, score };
  }, [fontSize, fontWeight, getLuminance]);

  const adjustColorForCompliance = useCallback((
    textColor: ColorValues,
    backgroundColor: ColorValues,
    targetRatio: number
  ): { text: string; background: string } => {
    const backgroundLum = getLuminance(backgroundColor);
    const textLum = getLuminance(textColor);
    
    if (backgroundLum > textLum) {
      const targetTextLum = (backgroundLum + 0.05) / targetRatio - 0.05;
      const adjustedTextColor = adjustLuminance(textColor, targetTextLum);
      return {
        text: rgbToHex(adjustedTextColor.r, adjustedTextColor.g, adjustedTextColor.b),
        background: rgbToHex(backgroundColor.r, backgroundColor.g, backgroundColor.b),
      };
    } else {
      const targetBackgroundLum = (textLum + 0.05) * targetRatio - 0.05;
      const adjustedBackgroundColor = adjustLuminance(backgroundColor, targetBackgroundLum);
      return {
        text: rgbToHex(textColor.r, textColor.g, textColor.b),
        background: rgbToHex(adjustedBackgroundColor.r, adjustedBackgroundColor.g, adjustedBackgroundColor.b),
      };
    }
  }, [getLuminance, rgbToHex, adjustLuminance]);

  const adjustLuminance = useCallback((color: ColorValues, targetLuminance: number): ColorValues => {
    const currentLuminance = getLuminance(color);
    const ratio = targetLuminance / currentLuminance;
    
    const adjustedColor = {
      r: Math.max(0, Math.min(255, Math.round(color.r * ratio))),
      g: Math.max(0, Math.min(255, Math.round(color.g * ratio))),
      b: Math.max(0, Math.min(255, Math.round(color.b * ratio))),
    };
    
    return adjustedColor;
  }, [getLuminance]);

  const validateContrast = useCallback(() => {
    const bgColor = hexToRgb(backgroundColor);
    const txtColor = hexToRgb(textColor);
    
    if (!bgColor || !txtColor) return;
    
    const ratio = calculateContrastRatio(txtColor, bgColor);
    setContrastRatio(ratio);
    
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    const requiredRatio = minimumLevel === 'aaa' ? (isLargeText ? 4.5 : 7) :
                         minimumLevel === 'aa' ? (isLargeText ? 3 : 4.5) :
                         minimumLevel === 'aa-large' ? 3 : 4.5;
    
    const compliant = ratio.ratio >= requiredRatio;
    setIsCompliant(compliant);
    
    if (enforceCompliance && !compliant) {
      const adjusted = adjustColorForCompliance(txtColor, bgColor, requiredRatio);
      setAdjustedColors(adjusted);
    } else {
      setAdjustedColors({
        background: backgroundColor,
        text: textColor,
      });
    }
    
    onContrastChange?.(ratio);
  }, [
    backgroundColor,
    textColor,
    fontSize,
    fontWeight,
    minimumLevel,
    enforceCompliance,
    hexToRgb,
    calculateContrastRatio,
    adjustColorForCompliance,
    onContrastChange,
  ]);

  useEffect(() => {
    validateContrast();
  }, [validateContrast]);

  const getComplianceIcon = (): string => {
    if (!contrastRatio) return '';
    
    switch (contrastRatio.level) {
      case 'aaa': return '🟢';
      case 'aa': return '🟡';
      case 'aa-large': return '🟠';
      case 'fail': return '🔴';
      default: return '';
    }
  };

  const getComplianceMessage = (): string => {
    if (!contrastRatio) return '';
    
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    
    switch (contrastRatio.level) {
      case 'aaa': return 'AAA Compliant - Enhanced accessibility';
      case 'aa': return 'AA Compliant - Standard accessibility';
      case 'aa-large': return isLargeText ? 'AA Large Text Compliant' : 'Below AA standard';
      case 'fail': return 'Fails accessibility standards';
      default: return '';
    }
  };

  const contrastStyles: React.CSSProperties = {
    backgroundColor: adjustedColors.background,
    color: adjustedColors.text,
    '--contrast-ratio': contrastRatio?.ratio.toFixed(2) || '0',
    '--contrast-level': contrastRatio?.level || 'fail',
    '--contrast-score': contrastRatio?.score.toFixed(0) || '0',
    '--is-compliant': isCompliant ? '1' : '0',
    ...style,
  };

  return (
    <motion.div
      className={`contrast-validator ${isCompliant ? 'compliant' : 'non-compliant'} ${className}`}
      style={contrastStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      {contrastRatio && !isCompliant && (
        <motion.div
          className="contrast-warning"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '-30px',
            right: '0',
            background: '#ff4444',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            zIndex: 1000,
          }}
        >
          {getComplianceIcon()} {contrastRatio.ratio.toFixed(2)}:1
        </motion.div>
      )}
      
      {process.env.NODE_ENV === 'development' && contrastRatio && (
        <div
          className="contrast-debug"
          style={{
            position: 'absolute',
            bottom: '-25px',
            left: '0',
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            opacity: 0.7,
          }}
        >
          {getComplianceMessage()} ({contrastRatio.ratio.toFixed(2)}:1)
        </div>
      )}
    </motion.div>
  );
};


export default ContrastValidator;