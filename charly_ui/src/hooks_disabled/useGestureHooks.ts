/**
 * CHARLY 2.0 - Gesture Hooks
 * Custom hooks for gesture functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { detectBrowserCapabilities } from '../utils/gestureUtils';

// Hook for browser capability detection
export const useBrowserCapabilities = () => {
  const [capabilities, setCapabilities] = useState<ReturnType<typeof detectBrowserCapabilities> | null>(null);

  useEffect(() => {
    setCapabilities(detectBrowserCapabilities());
  }, []);

  return capabilities;
};

// Hook for performance measurement
export const useGesturePerformanceMeasure = (recordGestureTime?: (start: number, end: number) => void) => {
  return useCallback((name: string, callback: () => void) => {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    callback();
    
    const endTime = performance.now();
    performance.mark(`${name}-end`);
    performance.measure(`gesture-${name}`, `${name}-start`, `${name}-end`);
    
    if (recordGestureTime) {
      recordGestureTime(startTime, endTime);
    }
  }, [recordGestureTime]);
};

// Hook for optimized gesture execution
export const useOptimizedGesture = (gestureType: string, optimizeGesture?: (type: string, callback: () => void) => void) => {
  return useCallback((callback: () => void) => {
    if (optimizeGesture) {
      optimizeGesture(gestureType, callback);
    } else {
      callback();
    }
  }, [optimizeGesture, gestureType]);
};

// Hook for haptic feedback trigger
export const useHapticTrigger = (triggerHaptic?: (type: string, position?: { x: number; y: number }) => void) => {
  return useCallback((type: string, position?: { x: number; y: number }) => {
    if (triggerHaptic) {
      triggerHaptic(type, position);
    }
  }, [triggerHaptic]);
};

// Hook for gesture alternative registration
export const useGestureAlternative = (
  gesture: string,
  action: () => void,
  description: string,
  registerGestureAlternative?: (gesture: string, action: () => void, description: string) => void,
  unregisterGestureAlternative?: (gesture: string) => void
) => {
  useEffect(() => {
    if (registerGestureAlternative) {
      registerGestureAlternative(gesture, action, description);
    }
    return () => {
      if (unregisterGestureAlternative) {
        unregisterGestureAlternative(gesture);
      }
    };
  }, [gesture, action, description, registerGestureAlternative, unregisterGestureAlternative]);
};

// Hook for refresh handler registration
export const useRefreshHandler = (
  refreshHandler: () => Promise<void>,
  registerRefreshHandler?: (handler: () => Promise<void>) => void,
  unregisterRefreshHandler?: () => void
) => {
  useEffect(() => {
    if (registerRefreshHandler) {
      registerRefreshHandler(refreshHandler);
    }
    return () => {
      if (unregisterRefreshHandler) {
        unregisterRefreshHandler();
      }
    };
  }, [refreshHandler, registerRefreshHandler, unregisterRefreshHandler]);
};

// Hook for context actions registration
export const useContextActions = (
  actions: Array<{ id: string; label: string; onAction: () => void }>,
  registerContextActions?: (actions: Array<{ id: string; label: string; onAction: () => void }>) => void,
  unregisterContextActions?: () => void
) => {
  useEffect(() => {
    if (registerContextActions) {
      registerContextActions(actions);
    }
    return () => {
      if (unregisterContextActions) {
        unregisterContextActions();
      }
    };
  }, [actions, registerContextActions, unregisterContextActions]);
};