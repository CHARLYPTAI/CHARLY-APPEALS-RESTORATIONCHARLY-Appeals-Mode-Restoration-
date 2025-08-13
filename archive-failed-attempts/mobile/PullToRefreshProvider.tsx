/**
 * CHARLY 2.0 - Pull-to-Refresh Provider
 * Apple-quality pull-to-refresh for analytics data with spring animations
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { RevolutionaryGestureEngine } from './RevolutionaryGestureEngine';

interface RefreshState {
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  pullPercentage: number;
  lastRefreshTime: number;
}

interface PullToRefreshContextType {
  refreshState: RefreshState;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  lastRefreshTime: number;
  registerRefreshHandler: (handler: () => Promise<void>) => void;
  unregisterRefreshHandler: () => void;
}

const PullToRefreshContext = createContext<PullToRefreshContextType | null>(null);

export const usePullToRefresh = () => {
  const context = useContext(PullToRefreshContext);
  if (!context) {
    throw new Error('usePullToRefresh must be used within a PullToRefreshProvider');
  }
  return context;
};

interface PullToRefreshProviderProps {
  children: React.ReactNode;
  refreshThreshold?: number;
  maxPullDistance?: number;
  refreshDelay?: number;
  enabledRoutes?: string[];
  className?: string;
}

export const PullToRefreshProvider: React.FC<PullToRefreshProviderProps> = ({
  children,
  refreshThreshold = 80,
  maxPullDistance = 120,
  refreshDelay = 1000,
  className = ''
}) => {
  const [refreshState, setRefreshState] = useState<RefreshState>({
    isRefreshing: false,
    isPulling: false,
    pullDistance: 0,
    pullPercentage: 0,
    lastRefreshTime: 0
  });

  const refreshHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const isPullingRef = useRef(false);

  // Motion values for smooth animations
  const pullY = useMotionValue(0);
  const pullRotation = useMotionValue(0);
  const pullScale = useMotionValue(1);

  // Spring physics for Apple-quality animations
  const springConfig = { damping: 25, stiffness: 300, mass: 0.8 };
  const springY = useSpring(pullY, springConfig);
  const springRotation = useSpring(pullRotation, springConfig);

  // Transform values for visual feedback
  const pullOpacity = useTransform(pullY, [0, refreshThreshold], [0, 1]);
  const indicatorScale = useTransform(pullY, [0, refreshThreshold, maxPullDistance], [0.5, 1, 1.2]);
  const indicatorRotation = useTransform(pullY, [0, maxPullDistance], [0, 360]);

  // Register refresh handler
  const registerRefreshHandler = useCallback((handler: () => Promise<void>) => {
    refreshHandlerRef.current = handler;
  }, []);

  // Unregister refresh handler
  const unregisterRefreshHandler = useCallback(() => {
    refreshHandlerRef.current = null;
  }, []);

  // Execute refresh
  const refresh = useCallback(async () => {
    if (refreshState.isRefreshing) return;

    setRefreshState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      if (refreshHandlerRef.current) {
        await refreshHandlerRef.current();
      }
      
      // Simulate minimum refresh time for better UX
      await new Promise(resolve => setTimeout(resolve, Math.max(refreshDelay, 1000)));
      
      setRefreshState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefreshTime: Date.now()
      }));
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [refreshState.isRefreshing, refreshDelay]);

  // Handle pan gesture for pull-to-refresh
  const handlePanGesture = useCallback((delta: { x: number; y: number }) => {
    // Only handle downward pulls
    if (delta.y <= 0) {
      if (isPullingRef.current) {
        // Reset pull state
        isPullingRef.current = false;
        pullY.set(0);
        pullRotation.set(0);
        pullScale.set(1);
        
        setRefreshState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          pullPercentage: 0
        }));
      }
      return;
    }

    // Calculate pull distance with rubber band effect
    const distance = Math.min(delta.y, maxPullDistance);
    const percentage = Math.min((distance / refreshThreshold) * 100, 100);
    
    // Apply rubber band physics
    const rubberBandDistance = distance > refreshThreshold 
      ? refreshThreshold + (distance - refreshThreshold) * 0.3
      : distance;

    isPullingRef.current = true;
    pullY.set(rubberBandDistance);
    pullRotation.set(percentage * 3.6); // 360 degrees at 100%
    pullScale.set(1 + (percentage / 100) * 0.2);

    setRefreshState(prev => ({
      ...prev,
      isPulling: true,
      pullDistance: distance,
      pullPercentage: percentage
    }));
  }, [maxPullDistance, refreshThreshold, pullY, pullRotation, pullScale]);

  // Handle swipe gesture for pull-to-refresh
  const handleSwipeGesture = useCallback(async (direction: 'left' | 'right' | 'up' | 'down') => {
    if (direction === 'down' && refreshState.pullDistance > refreshThreshold && !refreshState.isRefreshing) {
      // Trigger refresh
      pullY.set(refreshThreshold);
      pullRotation.set(360);
      pullScale.set(1.1);
      
      await refresh();
      
      // Reset pull state
      pullY.set(0);
      pullRotation.set(0);
      pullScale.set(1);
      
      setRefreshState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        pullPercentage: 0
      }));
    } else if (isPullingRef.current && direction !== 'down') {
      // Cancel pull if swiping in other directions
      isPullingRef.current = false;
      pullY.set(0);
      pullRotation.set(0);
      pullScale.set(1);
      
      setRefreshState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        pullPercentage: 0
      }));
    }
  }, [refreshState.pullDistance, refreshState.isRefreshing, refreshThreshold, refresh, pullY, pullRotation, pullScale]);

  // Context value
  const contextValue: PullToRefreshContextType = {
    refreshState,
    refresh,
    isRefreshing: refreshState.isRefreshing,
    lastRefreshTime: refreshState.lastRefreshTime,
    registerRefreshHandler,
    unregisterRefreshHandler
  };

  // Refresh indicator component
  const RefreshIndicator = () => (
    <motion.div
      className="absolute top-0 left-0 right-0 z-40 flex items-center justify-center"
      style={{
        y: springY,
        opacity: pullOpacity,
        height: Math.max(refreshState.pullDistance, 0)
      }}
    >
      <motion.div
        className="flex items-center space-x-3 bg-white bg-opacity-95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
        style={{
          scale: indicatorScale,
          rotate: refreshState.isRefreshing ? springRotation : indicatorRotation
        }}
      >
        <motion.div
          className={`w-6 h-6 rounded-full border-2 ${
            refreshState.isRefreshing
              ? 'border-blue-500 border-t-transparent animate-spin'
              : refreshState.pullPercentage >= 100
              ? 'border-green-500'
              : 'border-blue-500'
          }`}
          animate={{
            borderColor: refreshState.pullPercentage >= 100 ? '#10b981' : '#3b82f6'
          }}
        />
        
        <motion.span
          className="text-sm font-medium"
          animate={{
            color: refreshState.pullPercentage >= 100 ? '#10b981' : '#3b82f6'
          }}
        >
          {refreshState.isRefreshing
            ? 'Refreshing...'
            : refreshState.pullPercentage >= 100
            ? 'Release to refresh'
            : 'Pull to refresh'
          }
        </motion.span>
        
        {refreshState.pullPercentage > 0 && !refreshState.isRefreshing && (
          <motion.div
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(refreshState.pullPercentage)}%
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <PullToRefreshContext.Provider value={contextValue}>
      <div className={`relative overflow-hidden ${className}`}>
        <RevolutionaryGestureEngine
          onPan={handlePanGesture}
          onSwipe={handleSwipeGesture}
          gestureThreshold={10}
          velocityThreshold={0.1}
          enableHaptics={true}
          className="h-full w-full"
        >
          {/* Refresh indicator */}
          <AnimatePresence>
            {(refreshState.isPulling || refreshState.isRefreshing) && <RefreshIndicator />}
          </AnimatePresence>

          {/* Content with transform */}
          <motion.div
            className="relative z-10"
            style={{
              y: refreshState.isPulling || refreshState.isRefreshing ? springY : 0
            }}
          >
            {children}
          </motion.div>

          {/* Background gradient effect */}
          <AnimatePresence>
            {refreshState.isPulling && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-transparent to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </RevolutionaryGestureEngine>
      </div>
    </PullToRefreshContext.Provider>
  );
};

export default PullToRefreshProvider;