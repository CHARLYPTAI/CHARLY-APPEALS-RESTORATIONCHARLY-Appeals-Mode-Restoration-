// ============================================================================
// CHARLY PLATFORM - PERFORMANCE MONITORING SERVICE
// Apple CTO Enterprise Monitoring - Phase 3B
// ============================================================================

import React from 'react';
import { trackPerformance, trackUserAction, trackApiCall } from '../lib/sentry';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface APICallMetric {
  method: string;
  url: string;
  duration: number;
  status: number;
  timestamp: number;
}

interface UserInteractionMetric {
  action: string;
  component: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private apiCalls: APICallMetric[] = [];
  private userInteractions: UserInteractionMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializePerformanceObservers();
    this.setupPeriodicReporting();
  }

  // Initialize Web Performance APIs
  private initializePerformanceObservers() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entries) => {
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('lcp', entry.startTime, {
            element: entry.element?.tagName || 'unknown'
          });
        });
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entries) => {
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime, {
            eventType: entry.name
          });
        });
      });

      // Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        entries.forEach((entry: PerformanceEntry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        if (clsValue > 0) {
          this.recordMetric('cls', clsValue);
        }
      });

      // Long Tasks (for responsiveness)
      this.observeMetric('longtask', (entries) => {
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('long_task', entry.duration, {
            attribution: entry.attribution?.[0]?.name || 'unknown'
          });
        });
      });

      // Navigation timing
      this.observeMetric('navigation', (entries) => {
        entries.forEach((entry: PerformanceEntry) => {
          this.recordMetric('page_load_time', entry.loadEventEnd - entry.startTime);
          this.recordMetric('time_to_first_byte', entry.responseStart - entry.startTime);
          this.recordMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.startTime);
        });
      });

      // Resource timing
      this.observeMetric('resource', (entries) => {
        entries.forEach((entry: PerformanceEntry) => {
          const resourceType = this.getResourceType(entry.name);
          this.recordMetric(`resource_load_${resourceType}`, entry.duration, {
            name: entry.name,
            size: entry.transferSize?.toString() || '0'
          });
        });
      });
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as PerformanceNavigationTiming & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize);
        this.recordMetric('memory_total', memory.totalJSHeapSize);
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
      }, 30000); // Every 30 seconds
    }
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type} metrics:`, error);
    }
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'javascript';
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Record performance metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Send critical metrics to Sentry immediately
    if (['lcp', 'fid', 'cls', 'long_task'].includes(name)) {
      trackPerformance(`metric_${name}`, () => {
        // This creates a Sentry span for the metric
      });
    }
  }

  // Track API calls
  trackAPICall(method: string, url: string, duration: number, status: number) {
    const apiCall: APICallMetric = {
      method,
      url,
      duration,
      status,
      timestamp: Date.now()
    };
    
    this.apiCalls.push(apiCall);
    trackApiCall(method, url, status, duration);
    
    // Record as performance metric
    this.recordMetric('api_response_time', duration, {
      method,
      status: status.toString(),
      endpoint: this.extractEndpoint(url)
    });
  }

  // Track user interactions
  trackUserInteraction(action: string, component: string, metadata?: Record<string, unknown>) {
    const interaction: UserInteractionMetric = {
      action,
      component,
      timestamp: Date.now(),
      metadata
    };
    
    this.userInteractions.push(interaction);
    trackUserAction(`${component}: ${action}`, metadata);
  }

  // Track React component render times
  trackComponentRender(componentName: string, renderTime: number) {
    this.recordMetric('component_render_time', renderTime, {
      component: componentName
    });
  }

  // Track bundle loading performance
  trackBundleLoad(bundleName: string, loadTime: number, size: number) {
    this.recordMetric('bundle_load_time', loadTime, {
      bundle: bundleName,
      size: size.toString()
    });
  }

  // Get current performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);
    const recentAPICalls = this.apiCalls.filter(c => c.timestamp > last5Minutes);
    const recentInteractions = this.userInteractions.filter(i => i.timestamp > last5Minutes);
    
    return {
      metrics: {
        total: recentMetrics.length,
        byType: this.groupBy(recentMetrics, 'name'),
        averages: this.calculateAverages(recentMetrics)
      },
      apiCalls: {
        total: recentAPICalls.length,
        averageResponseTime: this.average(recentAPICalls.map(c => c.duration)),
        errorRate: recentAPICalls.filter(c => c.status >= 400).length / recentAPICalls.length
      },
      userInteractions: {
        total: recentInteractions.length,
        byComponent: this.groupBy(recentInteractions, 'component')
      }
    };
  }

  // Setup periodic reporting to backend
  private setupPeriodicReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, 60000); // Every minute
  }

  private async reportMetrics() {
    const summary = this.getPerformanceSummary();
    
    try {
      // Send to backend for aggregation
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          summary,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
      
      // Clear old metrics to prevent memory leaks
      this.cleanupOldMetrics();
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }

  private cleanupOldMetrics() {
    const cutoff = Date.now() - 10 * 60 * 1000; // Keep last 10 minutes
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.apiCalls = this.apiCalls.filter(c => c.timestamp > cutoff);
    this.userInteractions = this.userInteractions.filter(i => i.timestamp > cutoff);
  }

  // Utility methods
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').slice(0, 3).join('/'); // Get first 2 path segments
    } catch {
      return url;
    }
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const groupKey = String(item[key]);
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverages(metrics: PerformanceMetric[]): Record<string, number> {
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).reduce((acc, [name, values]) => {
      acc[name] = this.average(values);
      return acc;
    }, {} as Record<string, number>);
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  // Cleanup when component unmounts
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitoringService();

// React hook for easy component integration
export function usePerformanceMonitoring(componentName: string) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.trackComponentRender(componentName, renderTime);
  }, [componentName, startTime]);

  return {
    trackInteraction: (action: string, metadata?: Record<string, unknown>) => {
      performanceMonitor.trackUserInteraction(action, componentName, metadata);
    },
    trackMetric: (name: string, value: number, tags?: Record<string, string>) => {
      performanceMonitor.recordMetric(name, value, tags);
    }
  };
}

export default performanceMonitor;