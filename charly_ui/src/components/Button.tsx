// 🍎 Button Component - Apple Design Language
// "The details are not details. They make the design." - Charles Eames

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { TRANSITIONS } from '../design/animations';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(e);
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      style={{
        ...getBaseStyles(),
        ...getVariantStyles(variant),
        ...getSizeStyles(size),
        ...(disabled || loading ? getDisabledStyles() : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          applyHoverStyles(e.currentTarget, variant);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          removeHoverStyles(e.currentTarget, variant);
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(0.98)';
          e.currentTarget.style.transition = 'transform 150ms cubic-bezier(0.25, 0.1, 0.25, 1)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.transition = TRANSITIONS.STANDARD;
        }
      }}
    >
      {loading ? (
        <LoadingDots />
      ) : (
        children
      )}
    </button>
  );
};

const LoadingDots: React.FC = () => (
  <div style={loadingStyles.container}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          ...loadingStyles.dot,
          animationDelay: `${i * 160}ms`,
        }}
      />
    ))}
  </div>
);

const getBaseStyles = () => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  fontWeight: 600,
  textDecoration: 'none',
  transition: TRANSITIONS.STANDARD,
  outline: 'none',
  position: 'relative' as const,
  
  // Focus styles for accessibility
  ':focus-visible': {
    boxShadow: `0 0 0 3px ${APPLE_COLORS.BLUE}40`,
  },
});

const getVariantStyles = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: APPLE_COLORS.BLUE,
        color: NEUTRAL_COLORS.WHITE,
      };
    case 'secondary':
      return {
        backgroundColor: NEUTRAL_COLORS.GRAY_50,
        color: NEUTRAL_COLORS.GRAY_900,
        border: `1px solid ${NEUTRAL_COLORS.GRAY_100}`,
      };
    case 'danger':
      return {
        backgroundColor: APPLE_COLORS.RED,
        color: NEUTRAL_COLORS.WHITE,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: APPLE_COLORS.BLUE,
      };
    default:
      return {};
  }
};

const getSizeStyles = (size: ButtonProps['size']) => {
  switch (size) {
    case 'sm':
      return {
        padding: `${SPACING.XS} ${SPACING.SM}`,
        fontSize: '14px',
        minHeight: '32px',
      };
    case 'md':
      return {
        padding: `${SPACING.SM} ${SPACING.LG}`,
        fontSize: '16px',
        minHeight: '40px',
      };
    case 'lg':
      return {
        padding: `${SPACING.SM} ${SPACING.XL}`,
        fontSize: '18px',
        minHeight: '48px',
      };
    default:
      return {};
  }
};

const getDisabledStyles = () => ({
  opacity: 0.5,
  cursor: 'not-allowed',
  transform: 'none',
});

const applyHoverStyles = (element: HTMLButtonElement, variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      element.style.backgroundColor = '#0056D6'; // Darker blue
      break;
    case 'secondary':
      element.style.backgroundColor = NEUTRAL_COLORS.GRAY_100;
      break;
    case 'danger':
      element.style.backgroundColor = '#E6322B'; // Darker red
      break;
    case 'ghost':
      element.style.backgroundColor = `${APPLE_COLORS.BLUE}08`;
      break;
  }
  element.style.transform = 'translateY(-1px)';
  element.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.04)';
};

const removeHoverStyles = (element: HTMLButtonElement, variant: ButtonProps['variant']) => {
  const originalStyles = getVariantStyles(variant);
  element.style.backgroundColor = originalStyles.backgroundColor || '';
  element.style.transform = 'translateY(0)';
  element.style.boxShadow = 'none';
};

const loadingStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  dot: {
    width: '4px',
    height: '4px',
    backgroundColor: 'currentColor',
    borderRadius: '50%',
    animation: 'loadingDots 1.4s infinite',
  },
};