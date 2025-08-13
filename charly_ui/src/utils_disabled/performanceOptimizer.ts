/**
 * Performance Optimization and Monitoring System
 * Apple CTO Task 25: Performance optimization and bundle analysis
 */

interface PerformanceMetrics {
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  resources: {
    totalSize: number;
    resourceCount: number;
    cacheHitRatio: number;
  };
  bundle: {
    mainBundleSize: number;
    chunkCount: number;
    asyncChunkCount: number;
  };
}

interface PerformanceThresholds {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  bundleSize: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private thresholds: PerformanceThresholds = {
    firstContentfulPaint: 1500,
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1,
    timeToInteractive: 3500,
    bundleSize: 500000 // 500KB
  };

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    // Initialize performance observers
    this.setupNavigationObserver();
    this.setupPaintObserver();
    this.setupLayoutShiftObserver();
    this.setupFirstInputObserver();
    this.setupResourceObserver();
    this.setupMemoryMonitoring();
  }

  private setupNavigationObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.updateMetrics({
              timing: {
                navigationStart: navEntry.navigationStart,
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
                loadComplete: navEntry.loadEventEnd - navEntry.navigationStart,
                firstContentfulPaint: 0,
                largestContentfulPaint: 0,
                firstInputDelay: 0,
                cumulativeLayoutShift: 0,
                timeToInteractive: 0
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }
  }

  private setupPaintObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetrics({
              timing: {
                ...this.metrics.timing,
                firstContentfulPaint: entry.startTime
              }
            });
          } else if (entry.name === 'largest-contentful-paint') {
            this.updateMetrics({
              timing: {
                ...this.metrics.timing,
                largestContentfulPaint: entry.startTime
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.set('paint', observer);
    } catch (error) {
      console.warn('Paint observer not supported:', error);
    }
  }

  private setupLayoutShiftObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetrics({
              timing: {
                ...this.metrics.timing,
                cumulativeLayoutShift: clsValue
              }
            });
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    } catch (error) {
      console.warn('Layout shift observer not supported:', error);
    }
  }

  private setupFirstInputObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.updateMetrics({
            timing: {
              ...this.metrics.timing,
              firstInputDelay: entry.processingStart - entry.startTime
            }
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('first-input', observer);
    } catch (error) {
      console.warn('First input observer not supported:', error);
    }
  }

  private setupResourceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = 0;
        let resourceCount = 0;
        let cacheHits = 0;

        entries.forEach((entry: any) => {
          resourceCount++;
          if (entry.transferSize) {
            totalSize += entry.transferSize;
          }
          if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            cacheHits++;
          }
        });

        this.updateMetrics({
          resources: {
            totalSize,
            resourceCount,
            cacheHitRatio: resourceCount > 0 ? cacheHits / resourceCount : 0
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }
  }

  private setupMemoryMonitoring(): void {
    if (!('performance' in window) || !('memory' in performance)) return;

    const updateMemoryMetrics = () => {
      const memory = (performance as any).memory;
      if (memory) {
        this.updateMetrics({
          memory: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        });
      }
    };

    // Update memory metrics periodically
    updateMemoryMetrics();
    setInterval(updateMemoryMetrics, 30000); // Every 30 seconds
  }

  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...newMetrics,
      timing: {
        ...this.metrics.timing,
        ...newMetrics.timing
      },
      memory: {
        ...this.metrics.memory,
        ...newMetrics.memory
      },
      resources: {
        ...this.metrics.resources,
        ...newMetrics.resources
      },
      bundle: {
        ...this.metrics.bundle,
        ...newMetrics.bundle
      }
    };
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return this.metrics;
  }

  public getPerformanceScore(): number {
    const timing = this.metrics.timing;
    if (!timing) return 0;

    let score = 100;
    const weights = {
      fcp: 15,
      lcp: 25,
      fid: 15,
      cls: 25,
      tti: 20
    };

    // First Contentful Paint
    if (timing.firstContentfulPaint > 0) {
      const fcpScore = Math.max(0, 100 - (timing.firstContentfulPaint / this.thresholds.firstContentfulPaint) * 100);
      score -= (100 - fcpScore) * (weights.fcp / 100);
    }

    // Largest Contentful Paint
    if (timing.largestContentfulPaint > 0) {
      const lcpScore = Math.max(0, 100 - (timing.largestContentfulPaint / this.thresholds.largestContentfulPaint) * 100);
      score -= (100 - lcpScore) * (weights.lcp / 100);
    }

    // First Input Delay
    if (timing.firstInputDelay > 0) {
      const fidScore = Math.max(0, 100 - (timing.firstInputDelay / this.thresholds.firstInputDelay) * 100);
      score -= (100 - fidScore) * (weights.fid / 100);
    }

    // Cumulative Layout Shift
    if (timing.cumulativeLayoutShift > 0) {
      const clsScore = Math.max(0, 100 - (timing.cumulativeLayoutShift / this.thresholds.cumulativeLayoutShift) * 100);
      score -= (100 - clsScore) * (weights.cls / 100);
    }

    // Time to Interactive
    if (timing.timeToInteractive > 0) {
      const ttiScore = Math.max(0, 100 - (timing.timeToInteractive / this.thresholds.timeToInteractive) * 100);
      score -= (100 - ttiScore) * (weights.tti / 100);
    }

    return Math.max(0, Math.min(100, score));
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const timing = this.metrics.timing;
    const memory = this.metrics.memory;
    const resources = this.metrics.resources;

    if (timing?.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
      recommendations.push('Optimize First Contentful Paint by reducing critical resource load times');
    }

    if (timing?.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
      recommendations.push('Improve Largest Contentful Paint by optimizing largest page elements');
    }

    if (timing?.firstInputDelay > this.thresholds.firstInputDelay) {
      recommendations.push('Reduce First Input Delay by minimizing main thread blocking');
    }

    if (timing?.cumulativeLayoutShift > this.thresholds.cumulativeLayoutShift) {
      recommendations.push('Improve Cumulative Layout Shift by reserving space for dynamic content');
    }

    if (timing?.timeToInteractive > this.thresholds.timeToInteractive) {
      recommendations.push('Optimize Time to Interactive by reducing JavaScript execution time');
    }

    if (memory?.usedJSHeapSize && memory.usedJSHeapSize > 50000000) { // 50MB
      recommendations.push('Consider memory optimization - high JavaScript heap usage detected');
    }

    if (resources?.cacheHitRatio && resources.cacheHitRatio < 0.7) {
      recommendations.push('Improve cache hit ratio by optimizing cache headers');
    }

    return recommendations;
  }

  public generatePerformanceReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      score: this.getPerformanceScore(),
      recommendations: this.getRecommendations(),
      thresholds: this.thresholds
    };

    return JSON.stringify(report, null, 2);
  }

  public optimizeForMobile(): void {
    // Implement mobile-specific optimizations
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Setup lazy loading
        this.setupLazyLoading();
        
        // Optimize images
        this.optimizeImages();
      });
    }
  }

  private preloadCriticalResources(): void {
    // Preload critical CSS and JS
    const criticalResources = [
      '/assets/critical.css',
      '/assets/critical.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      document.head.appendChild(link);
    });
  }

  private setupLazyLoading(): void {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  private optimizeImages(): void {
    // Convert images to WebP format when supported
    const images = document.querySelectorAll('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx && 'createImageBitmap' in window) {
      images.forEach(img => {
        if (img.src && !img.src.includes('.webp')) {
          // This is a placeholder for WebP conversion logic
          // In a real implementation, you would convert images server-side
          console.log('Consider converting image to WebP:', img.src);
        }
      });
    }
  }

  public cleanup(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize mobile optimizations
if (typeof window !== 'undefined') {
  performanceOptimizer.optimizeForMobile();
}