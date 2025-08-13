// 🍎 Performance Monitoring Hook - Apple Optimization Excellence
// "The desktop metaphor of today is the doorway to the information superhighway of tomorrow" - Steve Jobs

import { useEffect, useRef } from 'react';

// Performance monitoring hook
export const usePerformance = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    // Component mount time
    if (!mountedRef.current) {
      const mountTime = Date.now() - startTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${componentName} mounted in ${mountTime}ms`);
      }
      
      mountedRef.current = true;
      
      // Report to performance monitoring service in production
      if (process.env.NODE_ENV === 'production' && mountTime > 100) {
        // Example: Send to analytics
        // analytics.track('component_slow_mount', { component: componentName, time: mountTime });
      }
    }

    return () => {
      if (mountedRef.current) {
        const unmountTime = Date.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🗑️ ${componentName} unmounted`);
        }
      }
    };
  }, [componentName]);
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackClick = (element: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`👆 Click: ${element}`, metadata);
    }
    
    // In production, send to analytics
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('click', { element, ...metadata });
    }
  };

  const trackNavigation = (from: string, to: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧭 Navigation: ${from} → ${to}`);
    }
    
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('navigation', { from, to });
    }
  };

  return { trackClick, trackNavigation };
};

// Hook for monitoring API performance
export const useAPIPerformance = () => {
  const trackAPICall = (endpoint: string, duration: number, success: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      const status = success ? '✅' : '❌';
      console.log(`${status} API: ${endpoint} - ${duration}ms`);
    }
    
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('api_call', { endpoint, duration, success });
      
      // Alert on slow API calls
      if (duration > 2000) {
        console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
      }
    }
  };

  return { trackAPICall };
};

// Hook for memory usage monitoring
export const useMemoryMonitoring = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
          const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
          
          console.log(`🧠 Memory: ${componentName} - ${used}MB / ${total}MB`);
          
          // Warn if memory usage is high
          if (used > 100) {
            console.warn(`High memory usage in ${componentName}: ${used}MB`);
          }
        }
      };

      const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [componentName]);
};

// Hook for FPS monitoring
export const useFPSMonitoring = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let frames = 0;
      let lastTime = Date.now();
      
      const measureFPS = () => {
        frames++;
        const now = Date.now();
        
        if (now >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (now - lastTime));
          
          if (fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${fps}fps`);
          } else if (fps >= 60) {
            console.log(`🎯 Optimal FPS: ${fps}fps`);
          }
          
          frames = 0;
          lastTime = now;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
    }
  }, []);
};