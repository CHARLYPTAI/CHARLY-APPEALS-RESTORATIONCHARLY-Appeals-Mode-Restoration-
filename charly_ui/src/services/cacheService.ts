interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
}

export class CacheService {
  private cache = new Map<string, CacheItem<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.defaultTTL;
    
    // Remove expired items and maintain size limit
    this.cleanup();
    
    if (this.cache.size >= this.maxSize) {
      // Remove oldest item
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
      usage: (this.cache.size / this.maxSize) * 100,
    };
  }
}

// Singleton instance for global use
export const globalCache = new CacheService({
  ttl: 10 * 60 * 1000, // 10 minutes for global cache
  maxSize: 200,
});

// Specialized cache instances
export const reportCache = new CacheService({
  ttl: 30 * 60 * 1000, // 30 minutes for reports
  maxSize: 50,
});

export const kpiCache = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for KPI data
  maxSize: 25,
});

// Cache key generators
export const CacheKeys = {
  report: (propertyId: string, analysisType: string) => `report:${propertyId}:${analysisType}`,
  kpi: (userId: string, timeframe: string) => `kpi:${userId}:${timeframe}`,
  marketData: (jurisdiction: string, propertyType: string) => `market:${jurisdiction}:${propertyType}`,
  compliance: (reportId: string) => `compliance:${reportId}`,
  comparable: (propertyId: string, radius: number) => `comparable:${propertyId}:${radius}km`,
} as const;