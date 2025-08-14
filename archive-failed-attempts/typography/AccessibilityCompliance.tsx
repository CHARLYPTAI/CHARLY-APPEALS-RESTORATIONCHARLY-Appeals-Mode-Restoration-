import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTypography } from './TypographyProvider';
import { useContrastValidator } from './ContrastValidator';

interface AccessibilityMetrics {
  contrastRatio: number;
  textSize: number;
  lineHeight: number;
  letterSpacing: number;
  readability: number;
  compliance: {
    wcag21AA: boolean;
    wcag21AAA: boolean;
    section508: boolean;
  };
}

interface AccessibilityComplianceProps {
  children: React.ReactNode;
  enforceCompliance?: boolean;
  reportViolations?: boolean;
  autoFix?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const AccessibilityCompliance: React.FC<AccessibilityComplianceProps> = ({
  children,
  enforceCompliance = true,
  reportViolations = true,
  autoFix = true,
  className = '',
  style = {},
}) => {
  const { isAccessibilityMode, textScaleFactor } = useTypography();
  const { validateColors } = useContrastValidator();
  const [metrics, setMetrics] = useState<AccessibilityMetrics | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [isCompliant, setIsCompliant] = useState(true);

  const calculateReadabilityScore = useCallback((text: string): number => {
    if (!text) return 0;
    
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = text.match(/[aeiouy]+/gi)?.length || 0;
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, fleschScore));
  }, []);

  const checkWCAG21Compliance = useCallback((metrics: AccessibilityMetrics): boolean => {
    const checks = [
      metrics.contrastRatio >= 4.5,
      metrics.textSize >= 16,
      metrics.lineHeight >= 1.4,
      metrics.readability >= 60,
    ];
    
    return checks.every(check => check);
  }, []);

  const checkWCAG21AAACompliance = useCallback((metrics: AccessibilityMetrics): boolean => {
    const checks = [
      metrics.contrastRatio >= 7,
      metrics.textSize >= 18,
      metrics.lineHeight >= 1.5,
      metrics.readability >= 70,
    ];
    
    return checks.every(check => check);
  }, []);

  const checkSection508Compliance = useCallback((metrics: AccessibilityMetrics): boolean => {
    const checks = [
      metrics.contrastRatio >= 3,
      metrics.textSize >= 14,
      metrics.lineHeight >= 1.3,
    ];
    
    return checks.every(check => check);
  }, []);

  const generateViolationReport = useCallback((metrics: AccessibilityMetrics): string[] => {
    const violations: string[] = [];
    
    if (metrics.contrastRatio < 4.5) {
      violations.push(`Contrast ratio ${metrics.contrastRatio.toFixed(2)}:1 below WCAG 2.1 AA standard (4.5:1)`);
    }
    
    if (metrics.textSize < 16) {
      violations.push(`Text size ${metrics.textSize}px below recommended minimum (16px)`);
    }
    
    if (metrics.lineHeight < 1.4) {
      violations.push(`Line height ${metrics.lineHeight} below WCAG 2.1 minimum (1.4)`);
    }
    
    if (metrics.readability < 60) {
      violations.push(`Readability score ${metrics.readability.toFixed(0)} below standard (60)`);
    }
    
    if (textScaleFactor < 1 && !isAccessibilityMode) {
      violations.push('Text scaling below 100% may impact accessibility');
    }
    
    return violations;
  }, [textScaleFactor, isAccessibilityMode]);

  const calculateMetrics = useCallback((element: HTMLElement): AccessibilityMetrics => {
    const computedStyle = window.getComputedStyle(element);
    const textColor = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;
    
    let contrastRatio = 4.5;
    if (textColor && backgroundColor) {
      const result = validateColors(textColor, backgroundColor);
      contrastRatio = result?.ratio || 4.5;
    }
    
    const textSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) / textSize;
    const letterSpacing = parseFloat(computedStyle.letterSpacing) || 0;
    const readability = calculateReadabilityScore(element.textContent || '');
    
    const metrics: AccessibilityMetrics = {
      contrastRatio,
      textSize,
      lineHeight,
      letterSpacing,
      readability,
      compliance: {
        wcag21AA: false,
        wcag21AAA: false,
        section508: false,
      },
    };
    
    metrics.compliance.wcag21AA = checkWCAG21Compliance(metrics);
    metrics.compliance.wcag21AAA = checkWCAG21AAACompliance(metrics);
    metrics.compliance.section508 = checkSection508Compliance(metrics);
    
    return metrics;
  }, [validateColors, calculateReadabilityScore, checkWCAG21Compliance, checkWCAG21AAACompliance, checkSection508Compliance]);

  const auditAccessibility = useCallback((element: HTMLElement) => {
    const metrics = calculateMetrics(element);
    setMetrics(metrics);
    
    const violations = generateViolationReport(metrics);
    setViolations(violations);
    
    const compliant = metrics.compliance.wcag21AA;
    setIsCompliant(compliant);
    
    if (reportViolations && violations.length > 0) {
      console.warn('Accessibility Violations:', violations);
    }
  }, [calculateMetrics, generateViolationReport, reportViolations]);

  useEffect(() => {
    const element = document.querySelector('.accessibility-compliance') as HTMLElement;
    if (element) {
      auditAccessibility(element);
    }
  }, [auditAccessibility]);

  const getComplianceStyles = (): React.CSSProperties => {
    if (!enforceCompliance || !metrics) return {};
    
    const fixes: React.CSSProperties = {};
    
    if (metrics.textSize < 16) {
      fixes.fontSize = '16px';
    }
    
    if (metrics.lineHeight < 1.4) {
      fixes.lineHeight = '1.4';
    }
    
    if (metrics.contrastRatio < 4.5 && autoFix) {
      fixes.color = 'var(--color-text-primary)';
      fixes.backgroundColor = 'var(--color-background-primary)';
    }
    
    return fixes;
  };

  const getComplianceLevel = (): string => {
    if (!metrics) return 'unknown';
    
    if (metrics.compliance.wcag21AAA) return 'AAA';
    if (metrics.compliance.wcag21AA) return 'AA';
    if (metrics.compliance.section508) return 'Section 508';
    return 'Non-compliant';
  };

  const getComplianceColor = (): string => {
    const level = getComplianceLevel();
    
    switch (level) {
      case 'AAA': return '#4CAF50';
      case 'AA': return '#FF9800';
      case 'Section 508': return '#FFC107';
      default: return '#F44336';
    }
  };

  const complianceStyles: React.CSSProperties = {
    ...getComplianceStyles(),
    '--compliance-level': getComplianceLevel(),
    '--compliance-color': getComplianceColor(),
    '--is-compliant': isCompliant ? '1' : '0',
    '--violation-count': violations.length.toString(),
    ...style,
  };

  return (
    <motion.div
      className={`accessibility-compliance ${getComplianceLevel().toLowerCase()} ${className}`}
      style={complianceStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      {process.env.NODE_ENV === 'development' && metrics && (
        <div className="accessibility-debug" style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          background: getComplianceColor(),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          zIndex: 1000,
        }}>
          {getComplianceLevel()}
          {violations.length > 0 && ` (${violations.length} issues)`}
        </div>
      )}
      
      {reportViolations && violations.length > 0 && process.env.NODE_ENV === 'development' && (
        <motion.div
          className="accessibility-violations"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '0',
            right: '0',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '11px',
            zIndex: 1000,
          }}
        >
          <strong>Accessibility Issues:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            {violations.map((violation, index) => (
              <li key={index} style={{ margin: '2px 0' }}>
                {violation}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};


export default AccessibilityCompliance;