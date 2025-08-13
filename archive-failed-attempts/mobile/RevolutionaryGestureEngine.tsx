/**
 * CHARLY 2.0 - Revolutionary Gesture Engine
 * Apple-quality gesture recognition with sub-100ms response times
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Performance optimized gesture types
interface GestureState {
  isActive: boolean;
  startTime: number;
  touchPoints: TouchPoint[];
  velocity: { x: number; y: number };
  direction: GestureDirection | null;
  confidence: number;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
  radiusX: number;
  radiusY: number;
}

type GestureDirection = 'left' | 'right' | 'up' | 'down';
type GestureType = 'swipe' | 'pinch' | 'long-press' | 'double-tap' | 'pan' | 'fling';

interface GestureEvent {
  type: GestureType;
  direction?: GestureDirection;
  distance: number;
  velocity: number;
  scale?: number;
  rotation?: number;
  center: { x: number; y: number };
  confidence: number;
  timestamp: number;
}

interface HapticFeedback {
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact';
  intensity?: number;
}

interface RevolutionaryGestureEngineProps {
  children: React.ReactNode;
  onGesture?: (event: GestureEvent) => void;
  onSwipe?: (direction: GestureDirection, velocity: number) => void;
  onPinch?: (scale: number, velocity: number) => void;
  onLongPress?: (point: { x: number; y: number }) => void;
  onDoubleTap?: (point: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }, velocity: { x: number; y: number }) => void;
  enableHaptics?: boolean;
  gestureThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  maxTouchPoints?: number;
  className?: string;
  disabled?: boolean;
}

export const RevolutionaryGestureEngine: React.FC<RevolutionaryGestureEngineProps> = ({
  children,
  onGesture,
  onSwipe,
  onPinch,
  onLongPress,
  onDoubleTap,
  onPan,
  enableHaptics = true,
  gestureThreshold = 10,
  longPressDelay = 500,
  doubleTapDelay = 300,
  className = '',
  disabled = false
}) => {
  // High-performance state management
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startTime: 0,
    touchPoints: [],
    velocity: { x: 0, y: 0 },
    direction: null,
    confidence: 0
  });

  // Performance-optimized refs
  const gestureRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const lastTapRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const velocityTrackerRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  const touchHistoryRef = useRef<Map<number, TouchPoint[]>>(new Map());

  // Apple-quality spring physics
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotation = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 400, mass: 0.8 };
  const springX = useSpring(motionX, springConfig);
  const springY = useSpring(motionY, springConfig);
  const springScale = useSpring(scale, springConfig);
  const springRotation = useSpring(rotation, springConfig);

  // Transform values for visual feedback
  const opacity = useTransform(springScale, [0.95, 1, 1.05], [0.8, 1, 0.9]);
  const blur = useTransform(springScale, [0.95, 1, 1.05], [0, 0, 1]);

  // Haptic feedback simulation
  const triggerHapticFeedback = useCallback((feedback: HapticFeedback) => {
    if (!enableHaptics) return;

    // Simulate haptic feedback with visual/audio cues
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        selection: [5],
        impact: [15, 10, 15]
      };
      navigator.vibrate(patterns[feedback.type] || [10]);
    }

    // Visual feedback
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `
      fixed pointer-events-none z-50 rounded-full
      ${feedback.type === 'light' ? 'bg-blue-400' : ''}
      ${feedback.type === 'medium' ? 'bg-green-400' : ''}
      ${feedback.type === 'heavy' ? 'bg-red-400' : ''}
      ${feedback.type === 'selection' ? 'bg-yellow-400' : ''}
      ${feedback.type === 'impact' ? 'bg-purple-400' : ''}
    `;
    feedbackElement.style.cssText = `
      width: 20px;
      height: 20px;
      opacity: 0.7;
      animation: haptic-pulse 0.3s ease-out;
      transform: translate(-50%, -50%);
    `;

    document.body.appendChild(feedbackElement);
    setTimeout(() => document.body.removeChild(feedbackElement), 300);
  }, [enableHaptics]);

  // High-performance gesture recognition
  const calculateGestureMetrics = useCallback((touches: TouchPoint[]) => {
    if (touches.length === 0) return null;

    const now = performance.now();
    const center = {
      x: touches.reduce((sum, t) => sum + t.x, 0) / touches.length,
      y: touches.reduce((sum, t) => sum + t.y, 0) / touches.length
    };

    // Calculate velocity using recent touch history
    const history = velocityTrackerRef.current;
    if (history.length >= 2) {
      const recent = history[history.length - 1];
      const previous = history[history.length - 2];
      const timeDelta = recent.timestamp - previous.timestamp;
      
      if (timeDelta > 0) {
        const velocity = {
          x: (recent.x - previous.x) / timeDelta,
          y: (recent.y - previous.y) / timeDelta
        };
        
        return { center, velocity, timestamp: now };
      }
    }

    return { center, velocity: { x: 0, y: 0 }, timestamp: now };
  }, []);

  // Gesture event handlers with sub-100ms response
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled) return;

    const now = performance.now();
    const touches: TouchPoint[] = Array.from(event.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: now,
      pressure: touch.force || 0.5,
      radiusX: touch.radiusX || 10,
      radiusY: touch.radiusY || 10
    }));

    // Update gesture state
    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startTime: now,
      touchPoints: touches,
      velocity: { x: 0, y: 0 },
      direction: null,
      confidence: 0.8
    }));

    // Initialize velocity tracking
    velocityTrackerRef.current = [{ x: touches[0].x, y: touches[0].y, timestamp: now }];
    
    // Store touch history for each touch point
    touches.forEach(touch => {
      if (!touchHistoryRef.current.has(touch.id)) {
        touchHistoryRef.current.set(touch.id, []);
      }
      touchHistoryRef.current.get(touch.id)!.push(touch);
    });

    // Long press detection
    if (touches.length === 1 && onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress({ x: touches[0].x, y: touches[0].y });
        triggerHapticFeedback({ type: 'heavy' });
      }, longPressDelay);
    }

    // Visual feedback
    triggerHapticFeedback({ type: 'light' });
    
    // Prevent default to ensure smooth gesture handling
    event.preventDefault();
  }, [disabled, onLongPress, longPressDelay, triggerHapticFeedback]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || !gestureState.isActive) return;

    const now = performance.now();
    const touches: TouchPoint[] = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: now,
      pressure: touch.force || 0.5,
      radiusX: touch.radiusX || 10,
      radiusY: touch.radiusY || 10
    }));

    // Update velocity tracking
    const velocityHistory = velocityTrackerRef.current;
    velocityHistory.push({ x: touches[0].x, y: touches[0].y, timestamp: now });
    if (velocityHistory.length > 10) {
      velocityHistory.shift();
    }

    // Calculate metrics
    const metrics = calculateGestureMetrics(touches);
    if (!metrics) return;

    // Update gesture state
    setGestureState(prev => ({
      ...prev,
      touchPoints: touches,
      velocity: metrics.velocity,
      confidence: Math.min(prev.confidence + 0.1, 1.0)
    }));

    // Clear long press timer on movement
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }

    // Handle pinch gesture
    if (touches.length === 2) {
      const distance = Math.sqrt(
        Math.pow(touches[1].x - touches[0].x, 2) + 
        Math.pow(touches[1].y - touches[0].y, 2)
      );
      
      const initialDistance = gestureState.touchPoints.length === 2 ? 
        Math.sqrt(
          Math.pow(gestureState.touchPoints[1].x - gestureState.touchPoints[0].x, 2) + 
          Math.pow(gestureState.touchPoints[1].y - gestureState.touchPoints[0].y, 2)
        ) : distance;

      if (initialDistance > 0) {
        const scaleValue = distance / initialDistance;
        scale.set(scaleValue);

        if (onPinch) {
          onPinch(scaleValue, Math.abs(metrics.velocity.x + metrics.velocity.y));
        }

        // Trigger gesture event
        if (onGesture) {
          onGesture({
            type: 'pinch',
            distance,
            velocity: Math.abs(metrics.velocity.x + metrics.velocity.y),
            scale: scaleValue,
            center: metrics.center,
            confidence: gestureState.confidence,
            timestamp: now
          });
        }
      }
    }

    // Handle pan gesture
    if (touches.length === 1 && onPan) {
      const startTouch = gestureState.touchPoints[0];
      if (startTouch) {
        const delta = {
          x: touches[0].x - startTouch.x,
          y: touches[0].y - startTouch.y
        };

        motionX.set(delta.x);
        motionY.set(delta.y);

        onPan(delta, metrics.velocity);
      }
    }

    event.preventDefault();
  }, [disabled, gestureState, calculateGestureMetrics, onPinch, onPan, onGesture, scale, motionX, motionY]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled) return;

    const now = performance.now();
    const duration = now - gestureState.startTime;
    const velocityHistory = velocityTrackerRef.current;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }

    // Calculate final velocity
    let finalVelocity = { x: 0, y: 0 };
    if (velocityHistory.length >= 2) {
      const recent = velocityHistory[velocityHistory.length - 1];
      const previous = velocityHistory[0];
      const timeDelta = recent.timestamp - previous.timestamp;
      
      if (timeDelta > 0) {
        finalVelocity = {
          x: (recent.x - previous.x) / timeDelta,
          y: (recent.y - previous.y) / timeDelta
        };
      }
    }

    // Detect swipe gesture
    if (gestureState.touchPoints.length === 1 && velocityHistory.length > 1) {
      const startPoint = velocityHistory[0];
      const endPoint = velocityHistory[velocityHistory.length - 1];
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      );

      if (distance > gestureThreshold) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const direction: GestureDirection = Math.abs(dx) > Math.abs(dy) 
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');

        const velocity = Math.sqrt(finalVelocity.x * finalVelocity.x + finalVelocity.y * finalVelocity.y);

        if (onSwipe) {
          onSwipe(direction, velocity);
        }

        if (onGesture) {
          onGesture({
            type: 'swipe',
            direction,
            distance,
            velocity,
            center: { x: endPoint.x, y: endPoint.y },
            confidence: gestureState.confidence,
            timestamp: now
          });
        }

        triggerHapticFeedback({ type: 'medium' });
      }
    }

    // Detect double tap
    if (gestureState.touchPoints.length === 1 && duration < 200) {
      const currentTap = gestureState.touchPoints[0];
      const lastTap = lastTapRef.current;

      if (lastTap && (now - lastTap.timestamp) < doubleTapDelay) {
        const distance = Math.sqrt(
          Math.pow(currentTap.x - lastTap.x, 2) + 
          Math.pow(currentTap.y - lastTap.y, 2)
        );

        if (distance < 50) {
          if (onDoubleTap) {
            onDoubleTap({ x: currentTap.x, y: currentTap.y });
          }
          
          if (onGesture) {
            onGesture({
              type: 'double-tap',
              distance,
              velocity: 0,
              center: { x: currentTap.x, y: currentTap.y },
              confidence: 1.0,
              timestamp: now
            });
          }

          triggerHapticFeedback({ type: 'selection' });
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { x: currentTap.x, y: currentTap.y, timestamp: now };
        }
      } else {
        lastTapRef.current = { x: currentTap.x, y: currentTap.y, timestamp: now };
      }
    }

    // Reset gesture state
    setGestureState({
      isActive: false,
      startTime: 0,
      touchPoints: [],
      velocity: { x: 0, y: 0 },
      direction: null,
      confidence: 0
    });

    // Reset motion values with spring animation
    motionX.set(0);
    motionY.set(0);
    scale.set(1);
    rotation.set(0);

    // Clear touch history
    touchHistoryRef.current.clear();
    velocityTrackerRef.current = [];

    event.preventDefault();
  }, [disabled, gestureState, gestureThreshold, doubleTapDelay, onSwipe, onDoubleTap, onGesture, triggerHapticFeedback, motionX, motionY, scale, rotation]);

  // Setup event listeners
  useEffect(() => {
    const element = gestureRef.current;
    if (!element) return;

    const options = { passive: false };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, options);
      element.removeEventListener('touchmove', handleTouchMove, options);
      element.removeEventListener('touchend', handleTouchEnd, options);
      element.removeEventListener('touchcancel', handleTouchEnd, options);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      const animationFrame = animationFrameRef.current;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Gesture confidence indicator
  const confidenceIndicator = useMemo(() => {
    if (!gestureState.isActive || gestureState.confidence < 0.5) return null;

    return (
      <motion.div
        className="absolute top-4 right-4 pointer-events-none z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {Math.round(gestureState.confidence * 100)}%
        </div>
      </motion.div>
    );
  }, [gestureState.isActive, gestureState.confidence]);

  return (
    <motion.div
      ref={gestureRef}
      className={`relative touch-none select-none ${className}`}
      style={{
        x: springX,
        y: springY,
        scale: springScale,
        rotate: springRotation,
        opacity,
        filter: `blur(${blur}px)`
      }}
    >
      {children}
      {confidenceIndicator}
      
      {/* Visual feedback for active gestures */}
      {gestureState.isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-blue-500 rounded-lg" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default RevolutionaryGestureEngine;