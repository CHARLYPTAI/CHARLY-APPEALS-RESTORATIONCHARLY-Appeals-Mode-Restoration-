/**
 * CHARLY 2.0 - Mobile Gesture Handler
 * Advanced gesture recognition for mobile interface interactions
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from '../../hooks/useFramerMotionLite';

interface GesturePoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

interface PinchGesture {
  scale: number;
  velocity: number;
  center: { x: number; y: number };
}

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onLongPress?: (point: GesturePoint) => void;
  onDoubleTap?: (point: GesturePoint) => void;
  swipeThreshold?: number;
  longPressDuration?: number;
  doubleTapDelay?: number;
  className?: string;
  disabled?: boolean;
}

export const MobileGestureHandler: React.FC<MobileGestureHandlerProps> = ({
  children,
  onSwipe,
  onPinch,
  onLongPress,
  onDoubleTap,
  swipeThreshold = 50,
  longPressDuration = 500,
  doubleTapDelay = 300,
  className = '',
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [touches, setTouches] = useState<GesturePoint[]>([]);
  const [lastTap, setLastTap] = useState<GesturePoint | null>(null);
  
  const gestureRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchStartPoints = useRef<GesturePoint[]>([]);
  const initialPinchDistance = useRef<number>(0);

  // Motion values for gesture feedback
  const [gestureStyle, setGestureStyle] = useState<React.CSSProperties>({});

  // Handle gesture feedback
  const updateGestureStyle = useCallback((deltaX: number, deltaY: number) => {
    setGestureStyle({
      transform: `translate(${deltaX}px, ${deltaY}px)`
    });
  }, []);

  const resetGestureStyle = useCallback(() => {
    setGestureStyle({});
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((p1: GesturePoint, p2: GesturePoint): number => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate gesture direction
  const getSwipeDirection = useCallback((start: GesturePoint, end: GesturePoint): 'left' | 'right' | 'up' | 'down' => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    const touchList = Array.from(event.touches);
    const touchPoints: GesturePoint[] = touchList.map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    setTouches(touchPoints);
    touchStartPoints.current = touchPoints;
    touchStartTime.current = Date.now();
    setIsPressed(true);

    // Single touch - potential long press
    if (touchPoints.length === 1 && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(touchPoints[0]);
      }, longPressDuration);
    }

    // Two touches - potential pinch
    if (touchPoints.length === 2) {
      initialPinchDistance.current = getDistance(touchPoints[0], touchPoints[1]);
    }

    // Clear any existing long press timer
    if (longPressTimer.current && touchPoints.length > 1) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [disabled, onLongPress, longPressDuration, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled || !isPressed) return;

    const touchList = Array.from(event.touches);
    const touchPoints: GesturePoint[] = touchList.map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    setTouches(touchPoints);

    // Clear long press timer on movement
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle pinch gesture
    if (touchPoints.length === 2 && touchStartPoints.current.length === 2 && onPinch) {
      const currentDistance = getDistance(touchPoints[0], touchPoints[1]);
      const scale = currentDistance / initialPinchDistance.current;
      const velocity = (currentDistance - initialPinchDistance.current) / (Date.now() - touchStartTime.current);
      
      const center = {
        x: (touchPoints[0].x + touchPoints[1].x) / 2,
        y: (touchPoints[0].y + touchPoints[1].y) / 2
      };

      const pinchGesture: PinchGesture = {
        scale,
        velocity,
        center
      };

      onPinch(pinchGesture);
    }

    // Update gesture feedback for visual feedback
    if (touchPoints.length === 1 && touchStartPoints.current.length === 1) {
      const deltaX = touchPoints[0].x - touchStartPoints.current[0].x;
      const deltaY = touchPoints[0].y - touchStartPoints.current[0].y;
      updateGestureStyle(deltaX, deltaY);
    }
  }, [disabled, isPressed, onPinch, getDistance, updateGestureStyle]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (disabled) return;

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Handle swipe gesture (single touch)
    if (touchStartPoints.current.length === 1 && touches.length === 1 && onSwipe) {
      const startPoint = touchStartPoints.current[0];
      const endPoint = touches[0];
      const distance = getDistance(startPoint, endPoint);

      if (distance > swipeThreshold) {
        const direction = getSwipeDirection(startPoint, endPoint);
        const velocity = distance / touchDuration;

        const swipeGesture: SwipeGesture = {
          direction,
          distance,
          velocity,
          duration: touchDuration
        };

        onSwipe(swipeGesture);
      }
    }

    // Handle double tap
    if (touchStartPoints.current.length === 1 && onDoubleTap && touchDuration < 200) {
      const currentTap = touches[0];
      
      if (lastTap && (touchEndTime - lastTap.timestamp) < doubleTapDelay) {
        const tapDistance = getDistance(lastTap, currentTap);
        if (tapDistance < 50) { // Taps must be close together
          onDoubleTap(currentTap);
          setLastTap(null);
        } else {
          setLastTap(currentTap);
        }
      } else {
        setLastTap(currentTap);
      }
    }

    // Reset state
    setIsPressed(false);
    setTouches([]);
    touchStartPoints.current = [];
    
    // Reset gesture style
    resetGestureStyle();
  }, [disabled, touches, onSwipe, onDoubleTap, swipeThreshold, doubleTapDelay, lastTap, getDistance, getSwipeDirection, resetGestureStyle]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <motion.div
      ref={gestureRef}
      className={`relative ${className}`}
      style={gestureStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Visual feedback for gestures */}
      {isPressed && touches.length === 1 && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: touches[0]?.x || 0,
            top: touches[0]?.y || 0,
            transform: 'translate(-50%, -50%)'
          }}
          initial="scaleOut"
          animate="scaleIn"
        >
          <div className="w-16 h-16 bg-blue-500 rounded-full" />
        </motion.div>
      )}
      
      {/* Pinch gesture feedback */}
      {isPressed && touches.length === 2 && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: (touches[0]?.x + touches[1]?.x) / 2 || 0,
            top: (touches[0]?.y + touches[1]?.y) / 2 || 0,
            transform: 'translate(-50%, -50%)'
          }}
          initial="scaleOut"
          animate="scaleIn"
        >
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded-full" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  disabled = false
}) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = useCallback((gesture: SwipeGesture) => {
    if (disabled) return;

    setSwipeDirection(gesture.direction as 'left' | 'right');
    
    if (gesture.direction === 'left' && onSwipeLeft) {
      setTimeout(() => onSwipeLeft(), 200);
    } else if (gesture.direction === 'right' && onSwipeRight) {
      setTimeout(() => onSwipeRight(), 200);
    }
    
    // Reset direction after animation
    setTimeout(() => setSwipeDirection(null), 300);
  }, [disabled, onSwipeLeft, onSwipeRight]);

  return (
    <MobileGestureHandler
      onSwipe={handleSwipe}
      className={className}
      disabled={disabled}
    >
      <motion.div
        className="w-full h-full"
        animate={swipeDirection ? "slideOutDown" : "slideInUp"}
      >
        {children}
      </motion.div>
    </MobileGestureHandler>
  );
};

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipe = useCallback(async (gesture: SwipeGesture) => {
    if (gesture.direction === 'down' && gesture.distance > refreshThreshold) {
      setIsRefreshing(true);
      setPullDistance(refreshThreshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    }
  }, [onRefresh, refreshThreshold]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 z-10"
        style={{ height: pullDistance }}
        animate="slideInUp"
      >
        <motion.div
          className="flex items-center space-x-2 text-blue-600"
          animate="fadeIn"
        >
          <motion.div
            className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
            animate={isRefreshing ? "scaleIn" : "scaleOut"}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <MobileGestureHandler onSwipe={handleSwipe}>
        <motion.div
          style={{ paddingTop: pullDistance }}
          animate="slideInUp"
        >
          {children}
        </motion.div>
      </MobileGestureHandler>
    </div>
  );
};

export default MobileGestureHandler;