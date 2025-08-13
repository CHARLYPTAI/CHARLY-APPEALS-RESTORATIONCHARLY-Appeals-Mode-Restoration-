/**
 * CHARLY 2.0 - Touch-Optimized Button Component
 * Advanced mobile interface with haptic feedback and gesture recognition
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from '../../hooks/useFramerMotionLite';

interface TouchOptimizedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onTouchStart' | 'onTouchEnd' | 'disabled' | 'className'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: boolean;
  longPressEnabled?: boolean;
  longPressDuration?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onLongPress?: () => void;
  onTouchStart?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  className?: string;
  'data-testid'?: string;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  hapticFeedback = true,
  longPressEnabled = false,
  longPressDuration = 500,
  onClick,
  onLongPress,
  onTouchStart,
  onTouchEnd,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [, setTouchPosition] = useState<TouchPoint | null>(null);
  const [ripples, setRipples] = useState<TouchPoint[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);

  // Variant styles
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg active:shadow-xl',
    secondary: 'bg-white text-blue-600 border-2 border-blue-200 shadow-sm active:shadow-md',
    tertiary: 'bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg active:shadow-xl',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg active:shadow-xl'
  };

  // Size styles
  const sizeClasses = {
    small: 'min-h-[40px] px-3 py-2 text-sm',
    medium: 'min-h-[48px] px-4 py-3 text-base',
    large: 'min-h-[56px] px-6 py-4 text-lg',
    xl: 'min-h-[64px] px-8 py-5 text-xl'
  };

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !('vibrate' in navigator)) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }, [hapticFeedback]);

  // Handle touch start
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const touch = event.touches[0];
    const rect = buttonRef.current?.getBoundingClientRect();
    
    if (rect) {
      const touchPoint: TouchPoint = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now()
      };
      
      setTouchPosition(touchPoint);
      setIsPressed(true);
      touchStartTime.current = Date.now();
      
      // Add ripple effect
      setRipples(prev => [...prev, touchPoint]);
      
      // Trigger haptic feedback
      triggerHapticFeedback('light');
      
      // Start long press timer
      if (longPressEnabled && onLongPress) {
        longPressTimer.current = setTimeout(() => {
          triggerHapticFeedback('medium');
          onLongPress();
        }, longPressDuration);
      }
    }
    
    onTouchStart?.(event);
  }, [disabled, loading, longPressEnabled, onLongPress, longPressDuration, triggerHapticFeedback, onTouchStart]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    setTouchPosition(null);
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Remove ripples after animation
    setTimeout(() => {
      setRipples([]);
    }, 600);
    
    onTouchEnd?.(event);
  }, [onTouchEnd]);

  // Handle click
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    
    // Check if this was a long press
    const pressDuration = Date.now() - touchStartTime.current;
    if (longPressEnabled && pressDuration >= longPressDuration) {
      return; // Don't trigger click for long press
    }
    
    triggerHapticFeedback('medium');
    onClick?.(event);
  }, [disabled, loading, longPressEnabled, longPressDuration, triggerHapticFeedback, onClick]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Compute classes
  const baseClasses = `
    relative overflow-hidden rounded-xl font-medium transition-all duration-200 ease-out
    focus:outline-none focus:ring-4 focus:ring-blue-500/30
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-98 select-none
    ${fullWidth ? 'w-full' : ''}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${isPressed ? 'scale-95' : ''}
    ${className}
  `;

  return (
    <motion.button
      ref={buttonRef}
      className={baseClasses}
      disabled={disabled || loading}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      data-testid={testId}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple, index) => (
        <motion.div
          key={`${ripple.timestamp}-${index}`}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial="scaleOut"
          animate="scaleIn"
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {/* Left icon */}
        {leftIcon && (
          <motion.div
            className="flex-shrink-0"
            initial="fadeOut"
            animate="fadeIn"
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.div>
        )}

        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="flex-shrink-0"
            initial="scaleOut"
            animate="scaleIn"
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}

        {/* Button text */}
        <motion.span
          className="flex-1 text-center"
          initial={loading ? "fadeOut" : "fadeIn"}
          animate={loading ? "fadeOut" : "fadeIn"}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>

        {/* Right icon */}
        {rightIcon && (
          <motion.div
            className="flex-shrink-0"
            initial="fadeOut"
            animate="fadeIn"
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.div>
        )}
      </div>

      {/* Long press indicator */}
      {longPressEnabled && isPressed && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-xl"
          initial="scaleOut"
          animate="scaleIn"
          transition={{ duration: longPressDuration / 1000 }}
        />
      )}

      {/* Focus ring */}
      <div className="absolute inset-0 rounded-xl transition-all duration-200 ring-2 ring-transparent group-focus-visible:ring-blue-500/50" />
    </motion.button>
  );
};

// Touch-optimized icon button
interface TouchIconButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export const TouchIconButton: React.FC<TouchIconButtonProps> = ({
  icon,
  label,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  onLongPress,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14'
  };

  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-100 text-gray-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100'
  };

  return (
    <TouchOptimizedButton
      variant="tertiary"
      size="medium"
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      onLongPress={onLongPress}
      longPressEnabled={!!onLongPress}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full p-0 min-h-0
        ${className}
      `}
      aria-label={label}
    >
      <div className="w-6 h-6">
        {icon}
      </div>
    </TouchOptimizedButton>
  );
};

// Floating Action Button
interface TouchFABProps {
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  variant?: 'primary' | 'secondary';
  size?: 'medium' | 'large';
  extended?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TouchFAB: React.FC<TouchFABProps> = ({
  icon,
  label,
  position = 'bottom-right',
  variant = 'primary',
  size = 'large',
  extended = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const sizeClasses = {
    medium: extended ? 'h-12 px-4' : 'w-12 h-12',
    large: extended ? 'h-14 px-6' : 'w-14 h-14'
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]}`}>
      <TouchOptimizedButton
        variant={variant}
        size="large"
        disabled={disabled}
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          rounded-full shadow-2xl min-h-0
          ${extended ? 'gap-3' : 'p-0'}
          ${className}
        `}
        aria-label={label}
      >
        <div className="w-6 h-6 flex-shrink-0">
          {icon}
        </div>
        {extended && (
          <span className="font-medium text-sm">
            {label}
          </span>
        )}
      </TouchOptimizedButton>
    </div>
  );
};

export default TouchOptimizedButton;