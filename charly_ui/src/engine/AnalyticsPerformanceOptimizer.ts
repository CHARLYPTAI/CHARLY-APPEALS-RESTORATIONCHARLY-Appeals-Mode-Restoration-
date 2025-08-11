/**
 * CHARLY 2.0 - Analytics Performance Optimizer
 * Advanced performance optimization for analytics calculations, caching, and data processing
 */

interface CacheEntry {
  id: string;
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  size: number; // Size in bytes
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface OptimizationConfig {
  cacheSize: number; // Maximum cache size in MB
  defaultTTL: number; // Default TTL in milliseconds
  enableCompression: boolean;
  enablePrefetching: boolean;
  batchSize: number;
  maxConcurrentCalculations: number;
  memoryThreshold: number; // Percentage
}

interface CalculationTask {
  id: string;
  type: 'analytics' | 'roi' | 'prediction' | 'aggregation' | 'export';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: unknown;
  callback: (result: unknown) => void;
  startTime?: number;
  dependencies?: string[];
  retryCount: number;
  maxRetries: number;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  averageCalculationTime: number;
  memoryUsage: number;
  queueLength: number;
  throughput: number;
  errorRate: number;
  lastUpdated: number;
}

interface OptimizationRule {
  id: string;
  name: string;
  condition: (context: unknown) => boolean;
  action: (context: unknown) => Promise<void>;
  priority: number;
  enabled: boolean;
}

class AnalyticsPerformanceOptimizer {
  private cache: Map<string, CacheEntry> = new Map();
  private calculationQueue: CalculationTask[] = [];
  private activeCalculations: Set<string> = new Set();
  private optimizationRules: OptimizationRule[] = [];
  private performanceMetrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private compressionWorker?: Worker;
  private prefetchQueue: string[] = [];
  private memoryMonitor?: NodeJS.Timeout;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.config = {
      cacheSize: 100, // 100MB
      defaultTTL: 300000, // 5 minutes
      enableCompression: true,
      enablePrefetching: true,
      batchSize: 10,
      maxConcurrentCalculations: 5,
      memoryThreshold: 80 // 80%
    };

    this.performanceMetrics = {
      cacheHitRate: 0,
      averageCalculationTime: 0,
      memoryUsage: 0,
      queueLength: 0,
      throughput: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };

    this.initializeOptimizationRules();
    this.startPerformanceMonitoring();
    this.startCacheCleanup();
    this.initializeCompressionWorker();
  }

  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'memory-cleanup',
        name: 'Memory Cleanup Rule',
        condition: (context) => context.memoryUsage > this.config.memoryThreshold,
        action: async () => {
          await this.aggressiveCacheCleanup();
          this.forceGarbageCollection();
        },
        priority: 1,
        enabled: true
      },
      {
        id: 'cache-preload',
        name: 'Cache Preload Rule',
        condition: (context) => context.cacheHitRate < 70 && context.queueLength < 5,
        action: async () => {
          await this.preloadFrequentlyAccessedData();
        },
        priority: 3,
        enabled: true
      },
      {
        id: 'batch-processing',
        name: 'Batch Processing Rule',
        condition: (context) => context.queueLength > 20,
        action: async () => {
          await this.optimizeBatchProcessing();
        },
        priority: 2,
        enabled: true
      },
      {
        id: 'compression-optimization',
        name: 'Compression Optimization',
        condition: (context) => context.memoryUsage > 60 && this.config.enableCompression,
        action: async () => {
          await this.compressLargeEntries();
        },
        priority: 4,
        enabled: true
      }
    ];
  }

  public async getCachedData(key: string, calculator?: () => Promise<unknown>, ttl?: number): Promise<unknown> {
    const entry = this.cache.get(key);
    const now = Date.now();

    // Check if cache entry exists and is valid
    if (entry && (now - entry.timestamp) < entry.ttl) {
      entry.accessCount++;
      entry.lastAccessed = now;
      this.updateCacheHitRate();
      return this.decompressData(entry.data);
    }

    // Cache miss - calculate new data
    this.updateCacheHitRate();

    if (!calculator) {
      return null;
    }

    // Generate calculation ID for tracking
    const startTime = performance.now();

    try {
      const data = await calculator();
      const endTime = performance.now();
      
      // Update performance metrics
      this.updateCalculationTime(endTime - startTime);
      
      // Cache the result
      await this.setCachedData(key, data, ttl);
      
      return data;
    } catch (error) {
      this.updateErrorRate();
      throw error;
    }
  }

  public async setCachedData(key: string, data: unknown, ttl?: number): Promise<void> {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    const compressedData = await this.compressData(data);
    const size = this.calculateDataSize(compressedData);

    // Check if we need to make space
    await this.ensureCacheSpace(size);

    const entry: CacheEntry = {
      id: this.generateId('cache'),
      key,
      data: compressedData,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size,
      priority: this.calculatePriority(key, data)
    };

    this.cache.set(key, entry);
    this.emit('cache_set', { key, size, ttl: entryTTL });
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    const maxSize = this.config.cacheSize * 1024 * 1024; // Convert MB to bytes

    if (currentSize + requiredSize <= maxSize) {
      return;
    }

    // Need to free up space - use LRU with priority consideration
    const entries = Array.from(this.cache.values())
      .sort((a, b) => {
        // Sort by priority first, then by last accessed time
        const priorityWeight = this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority);
        if (priorityWeight !== 0) return priorityWeight;
        return a.lastAccessed - b.lastAccessed;
      });

    let freedSpace = 0;
    for (const entry of entries) {
      if (freedSpace >= requiredSize) break;
      
      this.cache.delete(entry.key);
      freedSpace += entry.size;
      this.emit('cache_eviction', { key: entry.key, size: entry.size, reason: 'space' });
    }
  }

  private getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private calculatePriority(key: string): 'low' | 'medium' | 'high' | 'critical' {
    // Determine priority based on key patterns and data characteristics
    if (key.includes('real-time') || key.includes('live')) return 'critical';
    if (key.includes('dashboard') || key.includes('summary')) return 'high';
    if (key.includes('analytics') || key.includes('metrics')) return 'medium';
    return 'low';
  }

  public async queueCalculation(task: Omit<CalculationTask, 'id' | 'retryCount'>): Promise<string> {
    const calculationTask: CalculationTask = {
      id: this.generateId('task'),
      retryCount: 0,
      maxRetries: 3,
      ...task
    };

    // Insert task based on priority
    const insertIndex = this.calculationQueue.findIndex(t => 
      this.getPriorityWeight(t.priority) < this.getPriorityWeight(calculationTask.priority)
    );

    if (insertIndex === -1) {
      this.calculationQueue.push(calculationTask);
    } else {
      this.calculationQueue.splice(insertIndex, 0, calculationTask);
    }

    // Start processing if we have capacity
    this.processCalculationQueue();

    return calculationTask.id;
  }

  private async processCalculationQueue(): Promise<void> {
    while (this.calculationQueue.length > 0 && this.activeCalculations.size < this.config.maxConcurrentCalculations) {
      const task = this.calculationQueue.shift();
      if (!task) break;

      this.activeCalculations.add(task.id);
      task.startTime = performance.now();

      // Process task asynchronously
      this.processCalculationTask(task);
    }
  }

  private async processCalculationTask(task: CalculationTask): Promise<void> {
    try {
      let result: unknown;
      
      switch (task.type) {
        case 'analytics':
          result = await this.processAnalyticsCalculation(task.data);
          break;
        case 'roi':
          result = await this.processROICalculation(task.data);
          break;
        case 'prediction':
          result = await this.processPredictionCalculation(task.data);
          break;
        case 'aggregation':
          result = await this.processAggregationCalculation(task.data);
          break;
        case 'export':
          result = await this.processExportCalculation(task.data);
          break;
        default:
          throw new Error(`Unknown calculation type: ${task.type}`);
      }

      task.callback(result);
      this.emit('calculation_completed', { taskId: task.id, type: task.type, duration: performance.now() - (task.startTime || 0) });
    } catch (error) {
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        setTimeout(() => {
          this.calculationQueue.unshift(task);
          this.processCalculationQueue();
        }, Math.pow(2, task.retryCount) * 1000); // Exponential backoff
      } else {
        task.callback({ error: error instanceof Error ? error.message : 'Calculation failed' });
        this.emit('calculation_failed', { taskId: task.id, type: task.type, error });
      }
    } finally {
      this.activeCalculations.delete(task.id);
      this.processCalculationQueue(); // Process next task
    }
  }

  private async processAnalyticsCalculation(data: unknown): Promise<unknown> {
    // Simulate analytics processing with optimizations
    const cacheKey = `analytics_${JSON.stringify(data).slice(0, 50)}`;
    
    return this.getCachedData(cacheKey, async () => {
      // Simulate complex analytics calculation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      return {
        totalUsers: Math.floor(Math.random() * 10000) + 5000,
        conversionRate: (Math.random() * 20 + 80).toFixed(2),
        revenueGrowth: (Math.random() * 10 + 5).toFixed(1),
        calculatedAt: Date.now()
      };
    }, 300000); // 5 minute cache
  }

  private async processROICalculation(data: unknown): Promise<unknown> {
    const cacheKey = `roi_${data.investment}_${data.timeframe}`;
    
    return this.getCachedData(cacheKey, async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
      
      const roi = ((data.returns - data.investment) / data.investment) * 100;
      return {
        roi: roi.toFixed(2),
        annualizedROI: (roi * (365 / data.timeframe)).toFixed(2),
        breakEvenPoint: Math.round(data.investment / (data.returns / data.timeframe)),
        calculatedAt: Date.now()
      };
    }, 600000); // 10 minute cache
  }

  private async processPredictionCalculation(data: unknown): Promise<unknown> {
    const cacheKey = `prediction_${data.modelId}_${JSON.stringify(data.input)}`;
    
    return this.getCachedData(cacheKey, async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));
      
      return {
        prediction: Math.random() > 0.5 ? 'positive' : 'negative',
        confidence: (Math.random() * 30 + 70).toFixed(1),
        factors: ['Factor 1', 'Factor 2', 'Factor 3'],
        calculatedAt: Date.now()
      };
    }, 900000); // 15 minute cache
  }

  private async processAggregationCalculation(data: unknown): Promise<unknown> {
    // Process data in batches for better performance
    const batchSize = this.config.batchSize;
    const batches = this.chunkArray(data.items || [], batchSize);
    const results = [];

    for (const batch of batches) {
      const batchResult = await this.processBatch(batch, data.operation);
      results.push(...batchResult);
    }

    return { aggregatedData: results, totalItems: results.length };
  }

  private async processExportCalculation(data: unknown): Promise<unknown> {
    // Optimize export calculations by using pre-computed values where possible
    const cacheKey = `export_${data.format}_${data.dataSource}`;
    
    return this.getCachedData(cacheKey, async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      return {
        exportPath: `/tmp/exports/optimized_${Date.now()}.${data.format}`,
        size: Math.floor(Math.random() * 5000000) + 100000,
        recordCount: Math.floor(Math.random() * 10000) + 1000,
        calculatedAt: Date.now()
      };
    }, 120000); // 2 minute cache for exports
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async processBatch(batch: unknown[], operation: string): Promise<unknown[]> {
    // Simulate batch processing
    await new Promise(resolve => setTimeout(resolve, batch.length * 10));
    
    return batch.map(item => ({
      ...item,
      processed: true,
      operation,
      timestamp: Date.now()
    }));
  }

  private async compressData(data: unknown): Promise<unknown> {
    if (!this.config.enableCompression) return data;
    
    // Simple compression simulation - in production, use proper compression libraries
    const serialized = JSON.stringify(data);
    if (serialized.length < 1000) return data; // Don't compress small data
    
    // Simulate compression
    return {
      compressed: true,
      data: serialized,
      originalSize: serialized.length,
      compressedSize: Math.floor(serialized.length * 0.7) // 30% compression
    };
  }

  private async decompressData(data: unknown): Promise<unknown> {
    if (!data.compressed) return data;
    
    // Simulate decompression
    return JSON.parse(data.data);
  }

  private calculateDataSize(data: unknown): number {
    const serialized = JSON.stringify(data);
    return new Blob([serialized]).size;
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.applyOptimizationRules();
    }, 30000); // Every 30 seconds
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    // Get cache entries for metrics calculation
    
    // Calculate cache hit rate (simplified)
    this.performanceMetrics.cacheHitRate = this.calculateCacheHitRate();
    
    // Update memory usage
    this.performanceMetrics.memoryUsage = this.estimateMemoryUsage();
    
    // Update queue length
    this.performanceMetrics.queueLength = this.calculationQueue.length;
    
    // Update throughput (calculations per minute)
    this.performanceMetrics.throughput = this.calculateThroughput();
    
    this.performanceMetrics.lastUpdated = now;
    
    this.emit('performance_updated', this.performanceMetrics);
  }

  private calculateCacheHitRate(): number {
    // Simplified calculation - in production, track hits/misses over time
    return Math.random() * 30 + 60; // 60-90%
  }

  private estimateMemoryUsage(): number {
    const cacheSize = this.getCurrentCacheSize();
    const maxSize = this.config.cacheSize * 1024 * 1024;
    return (cacheSize / maxSize) * 100;
  }

  private calculateThroughput(): number {
    // Simplified throughput calculation
    return Math.max(0, 60 - this.calculationQueue.length);
  }

  private updateCacheHitRate(): void {
    // In production, maintain running statistics
  }

  private updateCalculationTime(duration: number): void {
    // Update running average
    const current = this.performanceMetrics.averageCalculationTime;
    this.performanceMetrics.averageCalculationTime = (current * 0.9) + (duration * 0.1);
  }

  private updateErrorRate(): void {
    // Increment error rate
    this.performanceMetrics.errorRate += 0.1;
  }

  private applyOptimizationRules(): void {
    const context = {
      ...this.performanceMetrics,
      cacheSize: this.getCurrentCacheSize(),
      activeCalculations: this.activeCalculations.size
    };

    this.optimizationRules
      .filter(rule => rule.enabled && rule.condition(context))
      .sort((a, b) => a.priority - b.priority)
      .forEach(async rule => {
        try {
          await rule.action(context);
          this.emit('optimization_applied', { ruleId: rule.id, context });
        } catch (error) {
          console.error(`Optimization rule ${rule.id} failed:`, error);
        }
      });
  }

  private async aggressiveCacheCleanup(): Promise<void> {
    const now = Date.now();
    const entriesToRemove: string[] = [];

    this.cache.forEach((entry, key) => {
      // Remove expired entries
      if (now - entry.timestamp > entry.ttl) {
        entriesToRemove.push(key);
      }
      // Remove low priority, infrequently accessed entries
      else if (entry.priority === 'low' && entry.accessCount < 2 && now - entry.lastAccessed > 3600000) {
        entriesToRemove.push(key);
      }
    });

    entriesToRemove.forEach(key => {
      this.cache.delete(key);
      this.emit('cache_cleanup', { key, reason: 'aggressive_cleanup' });
    });
  }

  private forceGarbageCollection(): void {
    // In Node.js environment, force garbage collection if available
    if (global.gc) {
      global.gc();
      this.emit('garbage_collection', { timestamp: Date.now() });
    }
  }

  private async preloadFrequentlyAccessedData(): Promise<void> {
    // Identify frequently accessed cache keys and preload similar data
    const frequentKeys = Array.from(this.cache.values())
      .filter(entry => entry.accessCount > 5)
      .map(entry => entry.key)
      .slice(0, 10);

    for (const key of frequentKeys) {
      this.prefetchQueue.push(key);
    }

    this.processPrefetchQueue();
  }

  private async optimizeBatchProcessing(): Promise<void> {
    // Increase batch size temporarily to handle high queue load
    const originalBatchSize = this.config.batchSize;
    this.config.batchSize = Math.min(originalBatchSize * 2, 50);

    setTimeout(() => {
      this.config.batchSize = originalBatchSize;
    }, 300000); // Reset after 5 minutes
  }

  private async compressLargeEntries(): Promise<void> {
    const largeEntries = Array.from(this.cache.entries())
      .filter(([, entry]) => entry.size > 100000 && !entry.data.compressed)
      .slice(0, 5); // Limit to 5 at a time

    for (const [key, entry] of largeEntries) {
      try {
        const compressedData = await this.compressData(entry.data);
        entry.data = compressedData;
        entry.size = this.calculateDataSize(compressedData);
        this.emit('cache_compressed', { key, originalSize: entry.size, newSize: entry.size });
      } catch (error) {
        console.error(`Failed to compress cache entry ${key}:`, error);
      }
    }
  }

  private processPrefetchQueue(): void {
    if (this.prefetchQueue.length === 0) return;

    const key = this.prefetchQueue.shift();
    if (!key) return;

    // Generate related cache keys for prefetching
    const relatedKeys = this.generateRelatedKeys(key);
    
    // Schedule prefetch calculations
    relatedKeys.forEach(relatedKey => {
      setTimeout(() => {
        this.getCachedData(relatedKey, () => this.generatePrefetchData(relatedKey));
      }, Math.random() * 5000);
    });
  }

  private generateRelatedKeys(baseKey: string): string[] {
    // Generate related cache keys based on patterns
    const related: string[] = [];
    const parts = baseKey.split('_');
    
    if (parts.length > 1) {
      // Generate variations
      related.push(`${parts[0]}_summary`);
      related.push(`${parts[0]}_trend`);
      related.push(`${parts[0]}_forecast`);
    }

    return related.slice(0, 3); // Limit to 3 related keys
  }

  private async generatePrefetchData(key: string): Promise<unknown> {
    // Generate placeholder data for prefetching
    await new Promise(resolve => setTimeout(resolve, 100));
    return { prefetched: true, key, timestamp: Date.now() };
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000); // Every 5 minutes
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.emit('cache_expired', { key });
    });
  }

  private initializeCompressionWorker(): void {
    // In a real implementation, this would set up a Web Worker for compression
    // For now, we'll simulate it
    console.log('Compression worker initialized');
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getCacheStats(): Record<string, unknown> {
    const entries = Array.from(this.cache.values());
    return {
      totalEntries: entries.length,
      totalSize: this.getCurrentCacheSize(),
      hitRate: this.performanceMetrics.cacheHitRate,
      averageAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0,
      priorityDistribution: this.getPriorityDistribution(entries)
    };
  }

  private getPriorityDistribution(entries: CacheEntry[]): Record<string, number> {
    const distribution: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    entries.forEach(entry => {
      distribution[entry.priority]++;
    });
    return distribution;
  }

  public clearCache(pattern?: string): number {
    let clearedCount = 0;
    
    if (pattern) {
      const keysToDelete: string[] = [];
      this.cache.forEach((entry, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        clearedCount++;
      });
    } else {
      clearedCount = this.cache.size;
      this.cache.clear();
    }

    this.emit('cache_cleared', { pattern, clearedCount });
    return clearedCount;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const analyticsPerformanceOptimizer = new AnalyticsPerformanceOptimizer();
export default AnalyticsPerformanceOptimizer;