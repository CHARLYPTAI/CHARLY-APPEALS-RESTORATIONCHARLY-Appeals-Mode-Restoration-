// 🍎 StatCard Component - Apple KPI Excellence
// Numbers that matter, presented beautifully

import React, { useEffect, useState } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS, SHADOWS } from '../design/animations';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'orange' | 'red';
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  color = 'blue',
  subtitle,
  onClick,
  loading = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animate number count-up effect
  useEffect(() => {
    if (loading || typeof value !== 'number') return;
    
    const target = Number(value);
    const duration = 800; // ms
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplayValue(Math.round(current));
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, loading]);

  const getColorValue = () => {
    switch (color) {
      case 'green': return APPLE_COLORS.GREEN;
      case 'orange': return APPLE_COLORS.ORANGE;
      case 'red': return APPLE_COLORS.RED;
      default: return APPLE_COLORS.BLUE;
    }
  };

  const cardStyle = {
    ...styles.card,
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: isHovered ? SHADOWS.HOVER : SHADOWS.MD,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.content}>
        <div style={styles.header}>
          <h3 style={styles.label}>{label}</h3>
          <div style={{...styles.colorIndicator, backgroundColor: getColorValue()}} />
        </div>
        
        <div style={styles.valueContainer}>
          {loading ? (
            <div style={styles.skeleton} />
          ) : (
            <span style={{...styles.value, color: getColorValue()}}>
              {typeof value === 'number' ? displayValue.toLocaleString() : value}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p style={styles.subtitle}>{subtitle}</p>
        )}
      </div>
      
      {onClick && (
        <div style={styles.clickIndicator}>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    position: 'relative' as const,
    backgroundColor: NEUTRAL_COLORS.WHITE,
    borderRadius: '12px',
    padding: SPACING.LG,
    border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
    transition: TRANSITIONS.STANDARD,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: '120px',
  },

  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: SPACING.XS,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },

  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  colorIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },

  valueContainer: {
    marginBottom: SPACING.XS,
  },

  value: {
    fontSize: '36px',
    fontWeight: 700,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    lineHeight: 1,
    letterSpacing: '-1px',
  },

  subtitle: {
    fontSize: '13px',
    color: NEUTRAL_COLORS.GRAY_600,
    margin: 0,
    fontWeight: 500,
  },

  clickIndicator: {
    color: NEUTRAL_COLORS.GRAY_600,
    marginLeft: SPACING.SM,
    opacity: 0.7,
  },

  skeleton: {
    height: '36px',
    width: '80px',
    backgroundColor: NEUTRAL_COLORS.GRAY_100,
    borderRadius: '6px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
} as const;