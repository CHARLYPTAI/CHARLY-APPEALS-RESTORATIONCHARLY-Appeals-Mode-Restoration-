/**
 * CHARLY 2.0 - Gesture Performance Optimizer
 * Ensures <100ms gesture response times with performance monitoring
 * Task 21: Revolutionary Gesture-Based Navigation - Performance
 */

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  gestureResponseTime: number;
  averageResponseTime: number;
  worstResponseTime: number;
  totalGestures: number;
  droppedFrames: number;
  memoryUsage: number;
  cpuUsage: number;
  lastUpdate: number;
}

interface PerformanceOptimizationContextType {
  metrics: PerformanceMetrics;
  isPerformanceMonitoringEnabled: boolean;
  setPerformanceMonitoringEnabled: (enabled: boolean) => void;
  optimizeGesture: (gestureType: string, callback: () => void) => void;
  recordGestureTime: (startTime: number, endTime: number) => void;
  showPerformanceOverlay: boolean;
  setShowPerformanceOverlay: (show: boolean) => void;
}

const GesturePerformanceContext = createContext<PerformanceOptimizationContextType | null>(null);

export const useGesturePerformance = () => {
  const context = useContext(GesturePerformanceContext);
  if (!context) {
    throw new Error('useGesturePerformance must be used within a GesturePerformanceProvider');
  }
  return context;
};

interface GesturePerformanceProviderProps {
  children: React.ReactNode;
  performanceTarget?: number; // Target response time in ms
  enableMonitoring?: boolean;
  className?: string;
}

export const GesturePerformanceProvider: React.FC<GesturePerformanceProviderProps> = ({
  children,
  performanceTarget = 100,
  enableMonitoring = true,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    gestureResponseTime: 0,
    averageResponseTime: 0,
    worstResponseTime: 0,
    totalGestures: 0,
    droppedFrames: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    lastUpdate: Date.now()
  });

  const [isPerformanceMonitoringEnabled, setIsPerformanceMonitoringEnabled] = useState(enableMonitoring);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const frameDropCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const gestureQueueRef = useRef<Array<{ callback: () => void; priority: number; timestamp: number }>>([]);
  const isProcessingRef = useRef(false);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // High-performance gesture queue processor
  const processGestureQueue = useCallback(() => {
    if (isProcessingRef.current || gestureQueueRef.current.length === 0) return;

    isProcessingRef.current = true;
    
    const startTime = performance.now();
    const frameBudget = 16.67; // 60fps = 16.67ms per frame
    
    while (gestureQueueRef.current.length > 0 && (performance.now() - startTime) < frameBudget) {
      const gesture = gestureQueueRef.current.shift();
      if (gesture) {
        const gestureStartTime = performance.now();
        
        try {
          gesture.callback();
        } catch (error) {
          console.error('Gesture execution error:', error);
        }
        
        const gestureEndTime = performance.now();
        recordGestureTime(gestureStartTime, gestureEndTime);
      }
    }
    
    isProcessingRef.current = false;
    
    // Schedule next batch if queue is not empty
    if (gestureQueueRef.current.length > 0) {
      requestAnimationFrame(processGestureQueue);
    }
  }, [recordGestureTime]);

  // Record gesture response time
  const recordGestureTime = useCallback((startTime: number, endTime: number) => {
    if (!isPerformanceMonitoringEnabled) return;

    const responseTime = endTime - startTime;
    
    setResponseTimes(prev => {
      const newTimes = [...prev, responseTime];
      // Keep only last 100 measurements
      if (newTimes.length > 100) {
        newTimes.shift();
      }
      return newTimes;
    });

    setMetrics(prev => {
      const totalGestures = prev.totalGestures + 1;
      const averageResponseTime = ((prev.averageResponseTime * prev.totalGestures) + responseTime) / totalGestures;
      const worstResponseTime = Math.max(prev.worstResponseTime, responseTime);

      return {
        ...prev,
        gestureResponseTime: responseTime,
        averageResponseTime,
        worstResponseTime,
        totalGestures,
        lastUpdate: Date.now()
      };
    });

    // Warn if response time exceeds target
    if (responseTime > performanceTarget) {
      console.warn(`Gesture response time exceeded target: ${responseTime.toFixed(2)}ms > ${performanceTarget}ms`);
    }
  }, [isPerformanceMonitoringEnabled, performanceTarget]);

  // Optimize gesture execution with priority queue
  const optimizeGesture = useCallback((gestureType: string, callback: () => void) => {
    const priority = getGesturePriority(gestureType);
    const timestamp = performance.now();
    
    const gesture = { callback, priority, timestamp };
    
    // Insert into priority queue (higher priority first)
    const insertIndex = gestureQueueRef.current.findIndex(g => g.priority < priority);
    if (insertIndex === -1) {
      gestureQueueRef.current.push(gesture);
    } else {
      gestureQueueRef.current.splice(insertIndex, 0, gesture);
    }
    
    // Process queue if not already processing
    if (!isProcessingRef.current) {
      requestAnimationFrame(processGestureQueue);
    }
  }, [processGestureQueue, getGesturePriority]);

  // Get gesture priority for optimization
  const getGesturePriority = useCallback((gestureType: string): number => {
    switch (gestureType) {
      case 'tap':
      case 'touch':
        return 10; // Highest priority
      case 'swipe':
      case 'pan':
        return 8;
      case 'pinch':
      case 'zoom':
        return 7;
      case 'long-press':
        return 6;
      case 'double-tap':
        return 5;
      default:
        return 3; // Lowest priority
    }
  }, []);

  // Monitor frame drops
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;

    const checkFrameDrops = () => {
      const currentTime = performance.now();
      const timeSinceLastFrame = currentTime - lastFrameTimeRef.current;
      
      if (timeSinceLastFrame > 20) { // More than 20ms indicates dropped frames
        frameDropCountRef.current++;
        setMetrics(prev => ({
          ...prev,
          droppedFrames: frameDropCountRef.current
        }));
      }
      
      lastFrameTimeRef.current = currentTime;
      requestAnimationFrame(checkFrameDrops);
    };

    const animationId = requestAnimationFrame(checkFrameDrops);
    return () => cancelAnimationFrame(animationId);
  }, [isPerformanceMonitoringEnabled]);

  // Monitor memory usage
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 1000);
    return () => clearInterval(interval);
  }, [isPerformanceMonitoringEnabled]);

  // Setup performance observer
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;

    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('gesture')) {
            recordGestureTime(entry.startTime, entry.startTime + entry.duration);
          }
        });
      });

      performanceObserverRef.current.observe({ entryTypes: ['measure'] });
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [isPerformanceMonitoringEnabled, recordGestureTime]);

  // Context value
  const contextValue: PerformanceOptimizationContextType = {
    metrics,
    isPerformanceMonitoringEnabled,
    setPerformanceMonitoringEnabled: setIsPerformanceMonitoringEnabled,
    optimizeGesture,
    recordGestureTime,
    showPerformanceOverlay,
    setShowPerformanceOverlay
  };

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (metrics.averageResponseTime < performanceTarget * 0.5) return 'excellent';
    if (metrics.averageResponseTime < performanceTarget * 0.75) return 'good';
    if (metrics.averageResponseTime < performanceTarget) return 'fair';
    return 'poor';
  };

  const performanceStatus = getPerformanceStatus();
  const statusColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500'
  };

  return (
    <GesturePerformanceContext.Provider value={contextValue}>
      <div className={`relative ${className}`}>
        {children}
        
        {/* Performance monitor toggle */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
            <motion.button
              onClick={() => setShowPerformanceOverlay(!showPerformanceOverlay)}
              className={`
                p-2 rounded-full text-white transition-colors
                ${statusColors[performanceStatus]}
                hover:opacity-80
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Performance: ${performanceStatus} (${metrics.averageResponseTime.toFixed(1)}ms avg)`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.button>
          </div>
        )}

        {/* Performance overlay */}
        <AnimatePresence>
          {showPerformanceOverlay && (
            <motion.div
              className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono w-80"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Gesture Performance</h3>
                <button
                  onClick={() => setShowPerformanceOverlay(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Last Response:</span>
                  <span className={metrics.gestureResponseTime > performanceTarget ? 'text-red-400' : 'text-green-400'}>
                    {metrics.gestureResponseTime.toFixed(2)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Average:</span>
                  <span className={metrics.averageResponseTime > performanceTarget ? 'text-red-400' : 'text-green-400'}>
                    {metrics.averageResponseTime.toFixed(2)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Worst:</span>
                  <span className={metrics.worstResponseTime > performanceTarget ? 'text-red-400' : 'text-yellow-400'}>
                    {metrics.worstResponseTime.toFixed(2)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total Gestures:</span>
                  <span>{metrics.totalGestures}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Dropped Frames:</span>
                  <span className={metrics.droppedFrames > 0 ? 'text-red-400' : 'text-green-400'}>
                    {metrics.droppedFrames}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>{metrics.memoryUsage.toFixed(1)}MB</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="text-blue-400">{performanceTarget}ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${
                    performanceStatus === 'excellent' ? 'text-green-400' :
                    performanceStatus === 'good' ? 'text-blue-400' :
                    performanceStatus === 'fair' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {performanceStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Performance graph */}
              <div className="mt-4 h-20 bg-gray-800 rounded relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-end space-x-px">
                  {responseTimes.slice(-40).map((time, index) => (
                    <div
                      key={index}
                      className={`w-2 ${time > performanceTarget ? 'bg-red-400' : 'bg-green-400'}`}
                      style={{ height: `${Math.min((time / (performanceTarget * 2)) * 100, 100)}%` }}
                    />
                  ))}
                </div>
                
                {/* Target line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-yellow-400 opacity-60"
                  style={{ bottom: '50%' }}
                />
              </div>
              
              <div className="mt-2 text-center text-xs text-gray-400">
                Response Time History (Target: {performanceTarget}ms)
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GesturePerformanceContext.Provider>
  );
};

export default GesturePerformanceProvider;