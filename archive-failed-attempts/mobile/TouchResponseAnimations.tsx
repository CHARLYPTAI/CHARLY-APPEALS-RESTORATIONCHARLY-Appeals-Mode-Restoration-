/**
 * CHARLY 2.0 - Touch Response Animations
 * Apple-quality touch response animations with spring physics
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from './HapticFeedbackEngine';

interface TouchResponseProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  pressScale?: number;
  longPressDelay?: number;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  className?: string;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
}

export const TouchResponseAnimation: React.FC<TouchResponseProps> = ({
  children,
  onPress,
  onLongPress,
  pressScale = 0.95,
  longPressDelay = 500,
  springConfig = { damping: 25, stiffness: 400, mass: 0.8 },
  className = '',
  disabled = false,
  hapticType = 'light'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number; timestamp: number }>>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const rippleIdRef = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Motion values for smooth animations
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);
  const brightness = useMotionValue(1);

  // Spring physics for Apple-quality feel
  const springScale = useSpring(scale, springConfig);
  const springOpacity = useSpring(opacity, springConfig);
  const springBrightness = useSpring(brightness, springConfig);

  // Transform values for subtle effects
  const boxShadow = useTransform(
    springScale,
    [0.9, 1, 1.1],
    [
      '0 2px 8px rgba(0,0,0,0.1)',
      '0 4px 16px rgba(0,0,0,0.15)',
      '0 8px 32px rgba(0,0,0,0.2)'
    ]
  );

  // Add ripple effect
  const addRipple = useCallback((x: number, y: number) => {
    const id = `ripple-${++rippleIdRef.current}`;
    const ripple = { id, x, y, timestamp: Date.now() };
    
    setRipples(prev => [...prev, ripple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setIsPressed(true);
    scale.set(pressScale);
    opacity.set(0.9);
    brightness.set(1.1);

    // Add ripple effect
    addRipple(x, y);

    // Trigger haptic feedback
    triggerHaptic(hapticType, 1, { x: touch.clientX, y: touch.clientY });

    // Set up long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
        triggerHaptic('heavy', 1, { x: touch.clientX, y: touch.clientY });
      }, longPressDelay);
    }

    event.preventDefault();
  }, [disabled, pressScale, addRipple, triggerHaptic, hapticType, onLongPress, longPressDelay, scale, opacity, brightness]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    setIsPressed(false);
    scale.set(1);
    opacity.set(1);
    brightness.set(1);

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }

    // Trigger press callback
    if (onPress) {
      onPress();
    }
  }, [disabled, onPress, scale, opacity, brightness]);

  // Touch cancel handler
  const handleTouchCancel = useCallback(() => {
    if (disabled) return;

    setIsPressed(false);
    scale.set(1);
    opacity.set(1);
    brightness.set(1);

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, [disabled, scale, opacity, brightness]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        scale: springScale,
        opacity: springOpacity,
        filter: `brightness(${springBrightness})`,
        boxShadow
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
      
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-4 h-4 bg-white rounded-full" />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Press state indicator */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

// Enhanced button with touch response animations
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <TouchResponseAnimation
      onPress={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
      hapticType="medium"
    >
      {children}
    </TouchResponseAnimation>
  );
};

// Animated card with touch response
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
  interactive?: boolean;
}> = ({ children, onPress, onLongPress, className = '', interactive = true }) => {
  const baseClasses = 'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden';
  
  if (!interactive) {
    return (
      <div className={`${baseClasses} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <TouchResponseAnimation
      onPress={onPress}
      onLongPress={onLongPress}
      className={`${baseClasses} ${className}`}
      pressScale={0.98}
      hapticType="light"
    >
      {children}
    </TouchResponseAnimation>
  );
};

// Animated list item with touch response
export const AnimatedListItem: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
}> = ({ children, onPress, onLongPress, className = '' }) => {
  const baseClasses = 'px-4 py-3 border-b border-gray-200 last:border-b-0';
  
  return (
    <TouchResponseAnimation
      onPress={onPress}
      onLongPress={onLongPress}
      className={`${baseClasses} ${className}`}
      pressScale={0.99}
      hapticType="light"
    >
      {children}
    </TouchResponseAnimation>
  );
};

// Floating action button with touch response
export const FloatingActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className = '', disabled = false }) => {
  const baseClasses = 'fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40';
  const disabledClasses = disabled ? 'opacity-50' : '';

  return (
    <TouchResponseAnimation
      onPress={onClick}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      pressScale={0.9}
      hapticType="medium"
    >
      {children}
    </TouchResponseAnimation>
  );
};

// Tab bar item with touch response
export const AnimatedTabItem: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  className?: string;
}> = ({ children, onPress, active = false, className = '' }) => {
  const baseClasses = 'flex-1 flex flex-col items-center justify-center py-2 px-1';
  const activeClasses = active ? 'text-blue-600' : 'text-gray-500';

  return (
    <TouchResponseAnimation
      onPress={onPress}
      className={`${baseClasses} ${activeClasses} ${className}`}
      pressScale={0.95}
      hapticType="selection"
    >
      {children}
    </TouchResponseAnimation>
  );
};

// Toggle switch with touch response
export const AnimatedToggle: React.FC<{
  value: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}> = ({ value, onToggle, className = '', disabled = false }) => {
  const baseClasses = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors';
  const valueClasses = value ? 'bg-blue-600' : 'bg-gray-200';
  const disabledClasses = disabled ? 'opacity-50' : '';

  return (
    <TouchResponseAnimation
      onPress={() => !disabled && onToggle(!value)}
      className={`${baseClasses} ${valueClasses} ${disabledClasses} ${className}`}
      disabled={disabled}
      pressScale={0.95}
      hapticType="medium"
    >
      <motion.div
        className="inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform"
        animate={{
          x: value ? 24 : 4
        }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 300
        }}
      />
    </TouchResponseAnimation>
  );
};

// Slider with touch response
export const AnimatedSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}> = ({ value, min, max, step = 1, onChange, className = '', disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    triggerHaptic('light', 1, { x: event.touches[0].clientX, y: event.touches[0].clientY });
  }, [disabled, triggerHaptic]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled || !isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const touch = event.touches[0];
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const percentage = x / rect.width;
    const newValue = Math.round((min + (max - min) * percentage) / step) * step;
    
    if (newValue !== value) {
      onChange(newValue);
      triggerHaptic('selection', 0.5, { x: touch.clientX, y: touch.clientY });
    }
  }, [disabled, isDragging, min, max, step, value, onChange, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className={`relative h-2 bg-gray-200 rounded-full ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute h-2 bg-blue-600 rounded-full"
        style={{ width: `${percentage}%` }}
      />
      <TouchResponseAnimation
        className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-lg"
        style={{ left: `${percentage}%`, transform: 'translate(-50%, -50%)' }}
        pressScale={0.9}
        hapticType="light"
      >
        <div />
      </TouchResponseAnimation>
    </div>
  );
};

export default TouchResponseAnimation;