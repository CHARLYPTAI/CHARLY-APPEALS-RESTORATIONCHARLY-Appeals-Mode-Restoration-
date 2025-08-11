/**
 * 🍎 CHARLY 2.0 - PERFORMANCE OPTIMIZER
 * 
 * Revolutionary performance optimization engine that makes CHARLY 2.0
 * lightning-fast through intelligent caching, prefetching, and rendering.
 */

// ============================================================================
// CACHE TYPES & INTERFACES
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number; // Time to live in milliseconds
  size: number; // Approximate size in bytes
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  maxSize: number;
  entryCount: number;
  hitRate: number;
}

export interface PrefetchRule {
  id: string;
  pattern: RegExp;
  predictor: (context: Record<string, unknown>) => string[];
  priority: number;
  maxItems: number;
  enabled: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

// ============================================================================
// INTELLIGENT CACHE MANAGER
// ============================================================================

export class IntelligentCacheManager<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats: CacheStats;
  private maxSize: number;
  private evictionStrategy: 'lru' | 'lfu' | 'priority' | 'adaptive';
  
  constructor(maxSizeMB: number = 50, strategy: 'adaptive' = 'adaptive') {
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    this.evictionStrategy = strategy;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      maxSize: this.maxSize,
      entryCount: 0,
      hitRate: 0
    };
    
    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }
  
  public set(
    key: string, 
    value: T, 
    options: Partial<CacheEntry<T>> = {}
  ): void {
    const size = this.estimateSize(value);
    
    // Check if we need to evict
    if (this.stats.totalSize + size > this.maxSize) {
      this.evict(size);
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl: options.ttl || 3600000, // Default 1 hour
      size,
      priority: options.priority || 'medium',
      tags: options.tags || []
    };
    
    // Remove old entry if exists
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.stats.totalSize -= oldEntry.size;
      this.stats.entryCount--;
    }
    
    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount++;
  }
  
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Update access stats
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value;
  }
  
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.entryCount--;
    
    return true;
  }
  
  public clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
  }
  
  public getByTags(tags: string[]): Array<CacheEntry<T>> {
    const results: Array<CacheEntry<T>> = [];
    
    for (const entry of this.cache.values()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        results.push(entry);
      }
    }
    
    return results;
  }
  
  public deleteByTags(tags: string[]): number {
    let deleted = 0;
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      if (this.delete(key)) deleted++;
    }
    
    return deleted;
  }
  
  private evict(requiredSpace: number): void {
    const entries = Array.from(this.cache.values());
    let freedSpace = 0;
    
    // Sort based on eviction strategy
    switch (this.evictionStrategy) {
      case 'lru':
        entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
        break;
        
      case 'lfu':
        entries.sort((a, b) => a.accessCount - b.accessCount);
        break;
        
      case 'priority': {
        const priorityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
        entries.sort((a, b) => 
          priorityWeight[a.priority] - priorityWeight[b.priority]
        );
        break;
      }
        
      case 'adaptive':
        // Adaptive strategy combines multiple factors
        entries.sort((a, b) => {
          const ageA = Date.now() - a.lastAccessed;
          const ageB = Date.now() - b.lastAccessed;
          const scoreA = a.accessCount / (ageA / 1000) * this.getPriorityWeight(a.priority);
          const scoreB = b.accessCount / (ageB / 1000) * this.getPriorityWeight(b.priority);
          return scoreA - scoreB;
        });
        break;
    }
    
    // Evict entries until we have enough space
    for (const entry of entries) {
      if (entry.priority === 'critical') continue; // Never evict critical
      
      this.delete(entry.key);
      freedSpace += entry.size;
      this.stats.evictions++;
      
      if (freedSpace >= requiredSpace) break;
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.delete(key);
    }
  }
  
  private estimateSize(value: unknown): number {
    if (typeof value === 'string') {
      return value.length * 2; // Unicode characters
    }
    
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024; // Default 1KB for complex objects
    }
  }
  
  private getPriorityWeight(priority: CacheEntry<T>['priority']): number {
    const weights = { low: 0.5, medium: 1, high: 2, critical: 10 };
    return weights[priority];
  }
  
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
  
  public getStats(): CacheStats {
    return { ...this.stats };
  }
}

// ============================================================================
// INTELLIGENT PREFETCHER
// ============================================================================

export class IntelligentPrefetcher {
  private rules: Map<string, PrefetchRule> = new Map();
  private prefetchQueue: Set<string> = new Set();
  private isProcessing = false;
  private cache: IntelligentCacheManager;
  
  constructor(cache: IntelligentCacheManager) {
    this.cache = cache;
    this.initializeDefaultRules();
  }
  
  private initializeDefaultRules(): void {
    // Property analysis prefetch rule
    this.addRule({
      id: 'property_analysis',
      pattern: /property\/(\d+)/,
      predictor: (context) => {
        // Prefetch related data when viewing a property
        const propertyId = context.propertyId;
        return [
          `comparables_${propertyId}`,
          `market_analysis_${propertyId}`,
          `tax_history_${propertyId}`,
          `appeal_templates_${context.jurisdiction}`
        ];
      },
      priority: 0.9,
      maxItems: 5,
      enabled: true
    });
    
    // Search results prefetch rule
    this.addRule({
      id: 'search_results',
      pattern: /search\?query=(.+)/,
      predictor: (context) => {
        // Prefetch likely next pages and filters
        const query = context.query;
        return [
          `search_page_2_${query}`,
          `search_filters_${query}`,
          `search_suggestions_${query}`
        ];
      },
      priority: 0.7,
      maxItems: 3,
      enabled: true
    });
    
    // Workflow prefetch rule
    this.addRule({
      id: 'workflow_next',
      pattern: /workflow\/(.+)/,
      predictor: (context) => {
        // Prefetch next likely workflow steps
        const workflowMap = {
          'discovery': ['analysis_tools', 'property_templates'],
          'analysis': ['appeal_forms', 'evidence_templates'],
          'preparation': ['filing_requirements', 'jurisdiction_rules'],
          'filing': ['tracking_tools', 'deadline_calendar']
        };
        
        return workflowMap[context.stage] || [];
      },
      priority: 0.8,
      maxItems: 4,
      enabled: true
    });
  }
  
  public addRule(rule: PrefetchRule): void {
    this.rules.set(rule.id, rule);
  }
  
  public removeRule(id: string): void {
    this.rules.delete(id);
  }
  
  public async prefetch(url: string, context: Record<string, unknown>): Promise<void> {
    // Find matching rules
    const matchingRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.pattern.test(url))
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of matchingRules) {
      const predictions = rule.predictor(context);
      const itemsToFetch = predictions.slice(0, rule.maxItems);
      
      for (const item of itemsToFetch) {
        this.prefetchQueue.add(item);
      }
    }
    
    // Process queue
    if (!this.isProcessing) {
      this.processPrefetchQueue();
    }
  }
  
  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchQueue.size === 0) return;
    
    this.isProcessing = true;
    
    // Use requestIdleCallback for non-blocking prefetch
    const processNext = () => {
      if (this.prefetchQueue.size === 0) {
        this.isProcessing = false;
        return;
      }
      
      requestIdleCallback(async (deadline) => {
        while (deadline.timeRemaining() > 0 && this.prefetchQueue.size > 0) {
          const item = this.prefetchQueue.values().next().value;
          this.prefetchQueue.delete(item);
          
          // Check if already cached
          if (!this.cache.has(item)) {
            try {
              // Simulate fetch - in real implementation, call actual API
              const data = await this.fetchData(item);
              this.cache.set(item, data, {
                priority: 'low', // Prefetched data has lower priority
                tags: ['prefetch']
              });
            } catch (error) {
              console.warn(`Prefetch failed for ${item}:`, error);
            }
          }
        }
        
        processNext();
      });
    };
    
    processNext();
  }
  
  private async fetchData(key: string): Promise<unknown> {
    // Simulate API call - replace with actual implementation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ key, data: `Prefetched data for ${key}` });
      }, 100);
    });
  }
  
  public clearQueue(): void {
    this.prefetchQueue.clear();
  }
  
  public getQueueSize(): number {
    return this.prefetchQueue.size;
  }
}

// ============================================================================
// RENDER PERFORMANCE OPTIMIZER
// ============================================================================

export class RenderOptimizer {
  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafCallbacks: Map<string, number> = new Map();
  private deferredUpdates: Map<string, () => void> = new Map();
  
  constructor() {
    this.initializeObservers();
  }
  
  private initializeObservers(): void {
    // Intersection observer for lazy loading
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const lazyLoad = element.dataset.lazyLoad;
            if (lazyLoad) {
              this.loadComponent(element, lazyLoad);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before visible
      }
    );
    
    // Resize observer for responsive optimizations
    this.resizeObserver = new ResizeObserver(
      this.debounce((entries) => {
        entries.forEach(entry => {
          const element = entry.target as HTMLElement;
          const callback = element.dataset.resizeCallback;
          if (callback && window[callback]) {
            window[callback](entry.contentRect);
          }
        });
      }, 100)
    );
  }
  
  public observeLazyLoad(element: HTMLElement): void {
    this.intersectionObserver?.observe(element);
  }
  
  public observeResize(element: HTMLElement): void {
    this.resizeObserver?.observe(element);
  }
  
  public unobserveLazyLoad(element: HTMLElement): void {
    this.intersectionObserver?.unobserve(element);
  }
  
  public unobserveResize(element: HTMLElement): void {
    this.resizeObserver?.unobserve(element);
  }
  
  private async loadComponent(element: HTMLElement, componentPath: string): Promise<void> {
    try {
      element.innerHTML = '<div class="loading">Loading...</div>';
      
      // Dynamic import simulation - replace with actual implementation
      const module = await import(componentPath);
      const Component = module.default;
      
      // Render component
      if (Component) {
        element.innerHTML = '';
        // React render or other framework render
      }
    } catch (error) {
      console.error(`Failed to load component ${componentPath}:`, error);
      element.innerHTML = '<div class="error">Failed to load</div>';
    }
  }
  
  public scheduleUpdate(id: string, callback: () => void, priority: 'low' | 'normal' | 'high' = 'normal'): void {
    // Cancel existing scheduled update
    this.cancelUpdate(id);
    
    switch (priority) {
      case 'high':
        // Immediate execution
        callback();
        break;
        
      case 'normal':
        // Next frame
        this.rafCallbacks.set(id, requestAnimationFrame(() => {
          callback();
          this.rafCallbacks.delete(id);
        }));
        break;
        
      case 'low':
        // Idle callback
        requestIdleCallback(() => {
          callback();
          this.deferredUpdates.delete(id);
        });
        break;
    }
  }
  
  public cancelUpdate(id: string): void {
    const rafId = this.rafCallbacks.get(id);
    if (rafId) {
      cancelAnimationFrame(rafId);
      this.rafCallbacks.delete(id);
    }
    
    this.deferredUpdates.delete(id);
  }
  
  public batchUpdates(updates: Array<() => void>): void {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
  
  private debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        func(...args);
      }, wait);
    };
  }
  
  public measurePerformance<T>(
    name: string,
    operation: () => T
  ): T {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;
    
    performance.mark(startMark);
    const result = operation();
    performance.mark(endMark);
    
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
    }
    
    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return result;
  }
  
  public destroy(): void {
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    
    this.rafCallbacks.forEach(id => cancelAnimationFrame(id));
    this.rafCallbacks.clear();
    this.deferredUpdates.clear();
  }
}

// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private maxMetrics = 1000;
  
  constructor() {
    this.initializeObservers();
  }
  
  private initializeObservers(): void {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('page_load', entry.duration, 'ms', {
              type: 'navigation',
              transferSize: (entry as PerformanceNavigationTiming).transferSize
            });
          }
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
      
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordMetric('resource_load', entry.duration, 'ms', {
              name: entry.name,
              type: (entry as PerformanceResourceTiming).initiatorType
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
      
      // Observe long tasks
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        const taskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long_task', entry.duration, 'ms', {
              startTime: entry.startTime
            });
          }
        });
        
        taskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(taskObserver);
      }
    }
  }
  
  public recordMetric(
    name: string,
    value: number,
    unit: string,
    context?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };
    
    this.metrics.push(metric);
    
    // Limit stored metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  public getMetrics(name?: string, timeRange?: { start: number; end: number }): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    
    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return filtered;
  }
  
  public getAverageMetric(name: string, timeWindowMs: number = 60000): number | null {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(m => 
      m.name === name && m.timestamp > cutoff
    );
    
    if (relevantMetrics.length === 0) return null;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }
  
  public getPercentile(name: string, percentile: number, timeWindowMs: number = 60000): number | null {
    const cutoff = Date.now() - timeWindowMs;
    const values = this.metrics
      .filter(m => m.name === name && m.timestamp > cutoff)
      .map(m => m.value)
      .sort((a, b) => a - b);
    
    if (values.length === 0) return null;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }
  
  public generateReport(): {
    summary: Record<string, unknown>;
    recommendations: string[];
  } {
    const pageLoadAvg = this.getAverageMetric('page_load');
    const longTaskCount = this.getMetrics('long_task', {
      start: Date.now() - 300000, // Last 5 minutes
      end: Date.now()
    }).length;
    
    const summary = {
      averagePageLoad: pageLoadAvg,
      longTasksLast5Min: longTaskCount,
      totalMetrics: this.metrics.length
    };
    
    const recommendations: string[] = [];
    
    if (pageLoadAvg && pageLoadAvg > 3000) {
      recommendations.push('Page load time exceeds 3s - consider code splitting');
    }
    
    if (longTaskCount > 5) {
      recommendations.push('Multiple long tasks detected - review heavy computations');
    }
    
    return { summary, recommendations };
  }
  
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// ============================================================================
// MAIN PERFORMANCE OPTIMIZER
// ============================================================================

export class PerformanceOptimizer {
  public cache: IntelligentCacheManager;
  public prefetcher: IntelligentPrefetcher;
  public renderOptimizer: RenderOptimizer;
  public monitor: PerformanceMonitor;
  
  private static instance: PerformanceOptimizer;
  
  private constructor() {
    this.cache = new IntelligentCacheManager(100); // 100MB cache
    this.prefetcher = new IntelligentPrefetcher(this.cache);
    this.renderOptimizer = new RenderOptimizer();
    this.monitor = new PerformanceMonitor();
    
    // Start monitoring
    this.startMonitoring();
  }
  
  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  private startMonitoring(): void {
    // Monitor cache performance
    setInterval(() => {
      const stats = this.cache.getStats();
      this.monitor.recordMetric('cache_hit_rate', stats.hitRate * 100, '%');
      this.monitor.recordMetric('cache_size', stats.totalSize / 1024 / 1024, 'MB');
    }, 10000); // Every 10 seconds
    
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        this.monitor.recordMetric('heap_used', memory.usedJSHeapSize / 1024 / 1024, 'MB');
        this.monitor.recordMetric('heap_limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB');
      }, 30000); // Every 30 seconds
    }
  }
  
  public optimizeBundle(): void {
    // Dynamic imports for code splitting
    const routes = {
      '/dashboard': () => import('../pages/DashboardV2'),
      '/portfolio': () => import('../pages/PortfolioV2'),
      '/analysis': () => import('../pages/PropertyAnalysisV2'),
      '/appeals': () => import('../pages/AppealsV2'),
      '/market': () => import('../pages/MarketIntelligenceV2')
    };
    
    // Preload critical routes
    Object.values(routes).forEach(() => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      document.head.appendChild(link);
    });
  }
  
  public destroy(): void {
    this.renderOptimizer.destroy();
    this.monitor.destroy();
    this.cache.clear();
    this.prefetcher.clearQueue();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();