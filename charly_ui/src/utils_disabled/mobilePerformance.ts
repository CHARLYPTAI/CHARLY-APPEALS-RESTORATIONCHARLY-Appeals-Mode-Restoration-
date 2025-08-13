/**
 * CHARLY 2.0 - Mobile Performance Optimization
 * Advanced performance utilities for mobile devices
 */

import React from 'react';

// Utility functions
const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeout: NodeJS.Timeout;
  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debouncedFn.cancel = () => clearTimeout(timeout);
  return debouncedFn;
};

const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let inThrottle: boolean;
  let timeout: NodeJS.Timeout;
  const throttledFn = (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      timeout = setTimeout(() => inThrottle = false, limit);
    }
  };
  throttledFn.cancel = () => {
    clearTimeout(timeout);
    inThrottle = false;
  };
  return throttledFn;
};

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  networkLatency: number;
  batteryLevel?: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableVirtualization: boolean;
  enableGPUAcceleration: boolean;
  maxConcurrentRequests: number;
  preloadCriticalResources: boolean;
  adaptiveQuality: boolean;
}

class MobilePerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private observers: Map<string, IntersectionObserver> = new Map();
  private requestQueue: Array<() => Promise<unknown>> = [];
  private activeRequests = 0;
  private frameCount = 0;
  private lastFrameTime = performance.now();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableVirtualization: true,
      enableGPUAcceleration: true,
      maxConcurrentRequests: 3,
      preloadCriticalResources: true,
      adaptiveQuality: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.setupPerformanceMonitoring();
    this.optimizeInitialLoad();
  }

  private initializeMetrics(): PerformanceMetrics {
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection || 
      (navigator as unknown as { mozConnection?: { effectiveType?: string } }).mozConnection || 
      (navigator as unknown as { webkitConnection?: { effectiveType?: string } }).webkitConnection;
    const battery = (navigator as unknown as { getBattery?: () => Promise<{ level?: number }> }).getBattery?.();

    return {
      fps: 60,
      memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0,
      renderTime: 0,
      bundleSize: 0,
      networkLatency: 0,
      batteryLevel: battery?.level,
      deviceType: this.detectDeviceType(),
      connectionType: connection?.effectiveType || 'unknown'
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private setupPerformanceMonitoring(): void {
    // FPS monitoring
    this.monitorFPS();
    
    // Memory monitoring
    this.monitorMemory();
    
    // Network monitoring
    this.monitorNetwork();
    
    // Battery monitoring
    this.monitorBattery();
  }

  private monitorFPS(): void {
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();
      
      if (now - this.lastFrameTime >= 1000) {
        this.metrics.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
        
        // Adjust performance based on FPS
        if (this.metrics.fps < 30) {
          this.enablePowerSavingMode();
        } else if (this.metrics.fps > 55) {
          this.enableHighPerformanceMode();
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private monitorMemory(): void {
    const updateMemory = () => {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      if (memory?.usedJSHeapSize) {
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Trigger garbage collection warning if memory usage is high
        if (this.metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
          this.optimizeMemoryUsage();
        }
      }
    };

    setInterval(updateMemory, 5000);
  }

  private monitorNetwork(): void {
    const connection = (navigator as unknown as { 
      connection?: { effectiveType?: string; addEventListener?: (event: string, handler: () => void) => void }; 
      mozConnection?: { effectiveType?: string; addEventListener?: (event: string, handler: () => void) => void }; 
      webkitConnection?: { effectiveType?: string; addEventListener?: (event: string, handler: () => void) => void }; 
    }).connection || 
    (navigator as unknown as { mozConnection?: { effectiveType?: string; addEventListener?: (event: string, handler: () => void) => void } }).mozConnection || 
    (navigator as unknown as { webkitConnection?: { effectiveType?: string; addEventListener?: (event: string, handler: () => void) => void } }).webkitConnection;
    
    if (connection) {
      const updateConnection = () => {
        this.metrics.connectionType = connection.effectiveType || 'unknown';
        this.adaptToNetworkConditions();
      };

      connection.addEventListener('change', updateConnection);
      updateConnection();
    }
  }

  private monitorBattery(): void {
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ 
        level: number; 
        charging: boolean; 
        addEventListener: (event: string, handler: () => void) => void 
      }> }).getBattery().then((battery) => {
        const updateBattery = () => {
          this.metrics.batteryLevel = battery.level;
          
          // Enable power saving mode when battery is low
          if (battery.level < 0.2 || battery.charging === false) {
            this.enablePowerSavingMode();
          }
        };

        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        updateBattery();
      });
    }
  }

  private optimizeInitialLoad(): void {
    // Preload critical resources
    if (this.config.preloadCriticalResources) {
      this.preloadCriticalAssets();
    }

    // Setup lazy loading
    if (this.config.enableLazyLoading) {
      this.setupLazyLoading();
    }

    // Enable GPU acceleration
    if (this.config.enableGPUAcceleration) {
      this.enableGPUAcceleration();
    }
  }

  private preloadCriticalAssets(): void {
    const criticalAssets = [
      '/fonts/inter-var.woff2',
      '/icons/icon-192x192.png',
      '/api/user/profile',
      '/api/dashboard/summary'
    ];

    criticalAssets.forEach(asset => {
      if (asset.startsWith('/api/')) {
        // Preload API data
        this.queueRequest(() => fetch(asset, { 
          method: 'GET',
          headers: { 'X-Preload': 'true' }
        }));
      } else {
        // Preload assets
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = asset;
        link.as = asset.includes('.woff') ? 'font' : 'image';
        if (link.as === 'font') link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  }

  private setupLazyLoading(): void {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    this.observers.set('images', imageObserver);

    // Observe existing lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  private enableGPUAcceleration(): void {
    const style = document.createElement('style');
    style.textContent = `
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
      }
      
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }

  public queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (this.activeRequests >= this.config.maxConcurrentRequests) {
          this.requestQueue.push(execute);
          return;
        }

        this.activeRequests++;
        
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          
          // Process next request in queue
          if (this.requestQueue.length > 0) {
            const next = this.requestQueue.shift();
            if (next) setTimeout(next, 0);
          }
        }
      };

      execute();
    });
  }

  public optimizeImage(src: string, quality: number = 80): string {
    if (!this.config.enableImageOptimization) return src;

    // Add query parameters for image optimization
    const url = new URL(src, window.location.origin);
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', 'webp');
    
    // Adjust quality based on connection and device
    if (this.metrics.connectionType === 'slow-2g' || this.metrics.connectionType === '2g') {
      url.searchParams.set('q', '50');
    } else if (this.metrics.deviceType === 'mobile') {
      url.searchParams.set('q', '70');
    }

    return url.toString();
  }

  public calculateVirtualizedList<T>(
    items: T[],
    scrollTop: number,
    itemHeight: number = 60,
    containerHeight: number = 400
  ): {
    visibleItems: Array<{ item: T; index: number }>;
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    if (!this.config.enableVirtualization || items.length < 50) {
      return {
        visibleItems: items.map((item, index) => ({ item, index })),
        startIndex: 0,
        endIndex: items.length - 1,
        totalHeight: items.length * itemHeight,
        offsetY: 0
      };
    }

    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 2, items.length - 1);
    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));

    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }

  private enablePowerSavingMode(): void {
    console.log('[Performance] Enabling power saving mode');
    
    // Reduce animation frame rate
    this.config.enableGPUAcceleration = false;
    
    // Lower image quality
    this.config.adaptiveQuality = true;
    
    // Reduce concurrent requests
    this.config.maxConcurrentRequests = 2;
    
    // Disable non-essential features
    document.body.classList.add('power-saving-mode');
  }

  private enableHighPerformanceMode(): void {
    console.log('[Performance] Enabling high performance mode');
    
    // Enable all optimizations
    this.config.enableGPUAcceleration = true;
    this.config.maxConcurrentRequests = 5;
    
    document.body.classList.remove('power-saving-mode');
    document.body.classList.add('high-performance-mode');
  }

  private optimizeMemoryUsage(): void {
    console.log('[Performance] Optimizing memory usage');
    
    // Clear image caches
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getBoundingClientRect().top || img.getBoundingClientRect().top > window.innerHeight + 200) {
        img.src = '';
      }
    });

    // Suggest garbage collection
    if ('gc' in window) {
      (window as unknown as { gc: () => void }).gc();
    }
  }

  private adaptToNetworkConditions(): void {
    switch (this.metrics.connectionType) {
      case 'slow-2g':
      case '2g':
        this.config.maxConcurrentRequests = 1;
        break;
      case '3g':
        this.config.maxConcurrentRequests = 2;
        break;
      case '4g':
      case '5g':
      case 'wifi':
        this.config.maxConcurrentRequests = 5;
        break;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.requestQueue.length = 0;
  }
}

// React hooks for performance optimization
export const usePerformanceOptimizer = (config?: Partial<OptimizationConfig>) => {
  const [optimizer] = React.useState(() => new MobilePerformanceOptimizer(config));
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(optimizer.getMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(optimizer.getMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
      optimizer.destroy();
    };
  }, [optimizer]);

  return {
    optimizer,
    metrics,
    queueRequest: optimizer.queueRequest.bind(optimizer),
    optimizeImage: optimizer.optimizeImage.bind(optimizer),
    calculateVirtualizedList: optimizer.calculateVirtualizedList.bind(optimizer)
  };
};

// Debounced scroll handler for performance
export const useDebouncedScroll = (callback: () => void, delay: number = 100) => {
  const debouncedCallback = React.useMemo(() => debounce(callback, delay), [callback, delay]);

  React.useEffect(() => {
    window.addEventListener('scroll', debouncedCallback);
    return () => {
      window.removeEventListener('scroll', debouncedCallback);
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
};

// Throttled resize handler
export const useThrottledResize = (callback: () => void, delay: number = 200) => {
  const throttledCallback = React.useMemo(() => throttle(callback, delay), [callback, delay]);

  React.useEffect(() => {
    window.addEventListener('resize', throttledCallback);
    return () => {
      window.removeEventListener('resize', throttledCallback);
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        callback(entry.isIntersecting);
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, callback, options]);
};

export default MobilePerformanceOptimizer;