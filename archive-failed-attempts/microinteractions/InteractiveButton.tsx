import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useMicroInteractions } from './SpringPhysicsEngine';
import { useAdaptiveColor } from '../color/AdaptiveColorEngine';
import { useHapticFeedback } from '../mobile/HapticFeedbackEngine';

interface InteractiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'light' | 'medium' | 'heavy';
  disabled?: boolean;
  loading?: boolean;
  loadingType?: 'spinner' | 'pulse' | 'breathe';
  onClick?: (e: React.MouseEvent) => void;
  onHover?: (isHovered: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  hapticFeedback?: boolean;
  animationDelay?: number;
  'data-testid'?: string;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  intensity = 'medium',
  disabled = false,
  loading = false,
  loadingType = 'pulse',
  onClick,
  onHover,
  className = '',
  style = {},
  hapticFeedback = true,
  animationDelay = 0,
  'data-testid': testId,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { animateButtonPress, animateLoading, animateHover, cancelAnimation } = useMicroInteractions();
  const { currentPalette } = useAdaptiveColor();
  const { triggerHaptic } = useHapticFeedback();
  
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number; startTime: number }>>([]);

  // Style variants
  const getVariantStyles = useCallback(() => {
    const baseStyles = {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      border: 'none',
      borderRadius: '12px',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      WebkitTapHighlightColor: 'transparent'
    };

    const sizeStyles = {
      sm: { padding: '8px 16px', fontSize: '14px', minHeight: '36px' },
      md: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
      lg: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' },
      xl: { padding: '20px 40px', fontSize: '20px', minHeight: '60px' }
    };

    const variantStyles = {
      primary: {
        backgroundColor: currentPalette.primary,
        color: '#FFFFFF',
        boxShadow: `0 2px 8px ${currentPalette.primary}40`
      },
      secondary: {
        backgroundColor: currentPalette.secondary,
        color: '#FFFFFF',
        boxShadow: `0 2px 8px ${currentPalette.secondary}40`
      },
      tertiary: {
        backgroundColor: 'transparent',
        color: currentPalette.primary,
        border: `2px solid ${currentPalette.primary}`,
        boxShadow: 'none'
      },
      danger: {
        backgroundColor: currentPalette.semantic.error,
        color: '#FFFFFF',
        boxShadow: `0 2px 8px ${currentPalette.semantic.error}40`
      },
      success: {
        backgroundColor: currentPalette.semantic.success,
        color: '#FFFFFF',
        boxShadow: `0 2px 8px ${currentPalette.semantic.success}40`
      }
    };

    const disabledStyles = disabled ? {
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const
    } : {};

    const hoverStyles = isHovered && !disabled ? {
      transform: 'translateY(-2px)',
      boxShadow: variant === 'tertiary' 
        ? `0 4px 16px ${currentPalette.primary}20`
        : `0 8px 20px ${variantStyles[variant].backgroundColor}60`
    } : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyles,
      ...hoverStyles,
      ...style
    };
  }, [variant, size, disabled, isHovered, currentPalette, style]);

  // Ripple effect for Material Design feel
  const createRipple = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rippleId = Math.random().toString(36).substr(2, 9);
    const newRipple = { id: rippleId, x, y, startTime: Date.now() };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
  }, [disabled]);

  // Handle click with animation
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || loading) return;

    const element = buttonRef.current;
    if (!element) return;

    // Create ripple effect
    createRipple(e);

    // Trigger haptic feedback
    if (hapticFeedback) {
      triggerHaptic(intensity);
    }

    // Spring animation
    setTimeout(() => {
      animateButtonPress(element, intensity);
    }, animationDelay);

    // Call onClick handler
    onClick?.(e);
  }, [disabled, loading, createRipple, hapticFeedback, triggerHaptic, intensity, animateButtonPress, animationDelay, onClick]);

  // Handle hover
  const handleMouseEnter = useCallback(() => {
    if (disabled || loading) return;
    
    setIsHovered(true);
    onHover?.(true);
    
    if (buttonRef.current) {
      animateHover(buttonRef.current, 'lift');
    }
  }, [disabled, loading, onHover, animateHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(false);
  }, [onHover]);

  // Handle loading animation
  useEffect(() => {
    if (loading && buttonRef.current) {
      animateLoading(buttonRef.current, loadingType);
    } else if (!loading && buttonRef.current) {
      cancelAnimation(buttonRef.current);
    }
  }, [loading, loadingType, animateLoading, cancelAnimation]);

  // Handle press states for mobile
  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
    </div>
  );

  return (
    <button
      ref={buttonRef}
      style={getVariantStyles()}
      className={`interactive-button ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      data-testid={testId}
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      data-pressed={isPressed}
      {...props}
    >
      {/* Content */}
      <span 
        className={`relative z-10 flex items-center justify-center gap-2 transition-opacity duration-200 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {children}
      </span>
      
      {/* Loading overlay */}
      {loading && <LoadingSpinner />}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      ))}
      
      {/* Accessibility styles */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(50);
            opacity: 0;
          }
        }
        
        .interactive-button:focus-visible {
          outline: 2px solid ${currentPalette.primary};
          outline-offset: 2px;
        }
        
        .interactive-button:active {
          transform: scale(0.98);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .interactive-button {
            transition: none !important;
            animation: none !important;
          }
          
          .interactive-button:hover {
            transform: none !important;
          }
          
          .interactive-button:active {
            transform: none !important;
          }
        }
      `}</style>
    </button>
  );
};

export default InteractiveButton;