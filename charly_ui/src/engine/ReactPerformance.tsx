/**
 * 🍎 CHARLY 2.0 - REACT PERFORMANCE OPTIMIZATIONS
 * 
 * Advanced React performance utilities including memoization,
 * virtualization, and render optimization strategies.
 */

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  ComponentType,
  ReactElement
} from 'react';
import { performanceOptimizer } from './PerformanceOptimizer';

// ============================================================================
// VIRTUALIZATION HOOK
// ============================================================================

interface VirtualizationOptions {
  itemHeight: number | ((index: number) => number);
  overscan?: number;
  estimatedItemHeight?: number;
  getItemKey?: (index: number) => string;
}

interface VirtualizedItem {
  index: number;
  offset: number;
  height: number;
  key: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVirtualization<T>(
  items: T[],
  containerHeight: number,
  options: VirtualizationOptions
) {
  const {
    itemHeight,
    overscan = 3,
    estimatedItemHeight = 50,
    getItemKey = (index) => String(index)
  } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number>();
  
  const itemHeightCache = useRef<Map<number, number>>(new Map());
  
  // Calculate item heights and positions
  const { virtualItems, totalHeight } = useMemo(() => {
    const heights: number[] = [];
    const offsets: number[] = [];
    let totalHeight = 0;
    
    for (let i = 0; i < items.length; i++) {
      const height = typeof itemHeight === 'function'
        ? itemHeightCache.current.get(i) || itemHeight(i) || estimatedItemHeight
        : itemHeight;
      
      heights[i] = height;
      offsets[i] = totalHeight;
      totalHeight += height;
      
      if (typeof itemHeight === 'function') {
        itemHeightCache.current.set(i, height);
      }
    }
    
    // Determine visible range
    const startIndex = Math.max(
      0,
      offsets.findIndex(offset => offset + heights[offsets.indexOf(offset)] > scrollTop) - overscan
    );
    
    const endIndex = Math.min(
      items.length - 1,
      offsets.findIndex(offset => offset > scrollTop + containerHeight) + overscan
    );
    
    const virtualItems: VirtualizedItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        offset: offsets[i],
        height: heights[i],
        key: getItemKey(i)
      });
    }
    
    return { virtualItems, totalHeight };
  }, [items.length, scrollTop, containerHeight, itemHeight, overscan, getItemKey, estimatedItemHeight]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setIsScrolling(true);
    
    // Debounce scroll end
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  const measureItem = useCallback((index: number, height: number) => {
    const cachedHeight = itemHeightCache.current.get(index);
    if (cachedHeight !== height) {
      itemHeightCache.current.set(index, height);
      // Force re-render to update positions
      setScrollTop(prev => prev);
    }
  }, []);
  
  return {
    virtualItems,
    totalHeight,
    scrollTop,
    isScrolling,
    handleScroll,
    measureItem
  };
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactElement;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualList = memo(<T,>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    virtualItems,
    totalHeight,
    handleScroll: handleVirtualScroll,
    isScrolling
  } = useVirtualization(items, height, {
    itemHeight,
    overscan
  });
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleVirtualScroll(e);
    onScroll?.(e.currentTarget.scrollTop);
  }, [handleVirtualScroll, onScroll]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, offset, height, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: offset,
              left: 0,
              right: 0,
              height
            }}
          >
            {renderItem(items[index], index, { height })}
          </div>
        ))}
        
        {isScrolling && (
          <div className="absolute top-0 right-0 p-2 bg-blue-500 text-white text-xs rounded-bl">
            Scrolling...
          </div>
        )}
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => ReactElement;

VirtualList.displayName = 'VirtualList';

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

interface MemoCompareProps {
  compare?: <T>(prevProps: T, nextProps: T) => boolean;
  debug?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export function withMemoization<P extends object>(
  Component: ComponentType<P>,
  options: MemoCompareProps = {}
): ComponentType<P> {
  const { compare, debug = false } = options;
  
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    if (compare) {
      const isEqual = compare(prevProps, nextProps);
      
      if (debug && !isEqual) {
        console.log(`[Memo Debug] ${Component.displayName || Component.name} re-rendering`, {
          prevProps,
          nextProps,
          changes: getChangedProps(prevProps, nextProps)
        });
      }
      
      return isEqual;
    }
    
    // Default shallow comparison
    return shallowEqual(prevProps, nextProps);
  });
  
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`;
  
  return MemoizedComponent;
}

function shallowEqual(obj1: Record<string, unknown>, obj2: Record<string, unknown>): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

function getChangedProps(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  
  for (const key of allKeys) {
    if (prev[key] !== next[key]) {
      changed.push(key);
    }
  }
  
  return changed;
}

// ============================================================================
// LAZY LOADING WITH SUSPENSE
// ============================================================================

interface LazyComponentOptions {
  fallback?: ReactElement;
  preload?: boolean;
  chunkName?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export function lazyWithPreload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<void>;
} {
  const { preload = false, chunkName } = options;
  
  let componentPromise: Promise<{ default: T }> | null = null;
  
  const load = () => {
    if (!componentPromise) {
      componentPromise = factory();
      
      // Cache in performance optimizer
      if (chunkName) {
        performanceOptimizer.cache.set(`chunk_${chunkName}`, componentPromise, {
          priority: 'high',
          ttl: 3600000 // 1 hour
        });
      }
    }
    
    return componentPromise;
  };
  
  const Component = React.lazy(load);
  
  // Auto-preload if requested
  if (preload) {
    load();
  }
  
  return {
    Component,
    preload: load
  };
}

// ============================================================================
// RENDER OPTIMIZATION HOOKS
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useOptimizedState<T>(
  initialState: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  
  // Update ref on state change
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  const setOptimizedState = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(stateRef.current)
      : value;
    
    // Only update if changed
    if (!Object.is(newValue, stateRef.current)) {
      setState(newValue);
    }
  }, []);
  
  return [state, setOptimizedState];
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDeferredValue<T>(value: T, delay: number = 200): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<number>();
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setDeferredValue(value);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  return deferredValue;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      
      // Track visibility for analytics
      if (entry.isIntersecting) {
        performanceOptimizer.monitor.recordMetric('element_visible', 1, 'count', {
          element: element.tagName,
          id: element.id
        });
      }
    }, options);
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options]);
  
  return isIntersecting;
}

// ============================================================================
// PERFORMANCE MONITORING COMPONENTS
// ============================================================================

interface PerformanceBoundaryProps {
  children: React.ReactNode;
  name: string;
  threshold?: number;
  onSlowRender?: (duration: number) => void;
}

export const PerformanceBoundary: React.FC<PerformanceBoundaryProps> = ({
  children,
  name,
  threshold = 16, // One frame at 60fps
  onSlowRender
}) => {
  const renderStartRef = useRef<number>();
  
  useEffect(() => {
    const renderEnd = performance.now();
    const renderStart = renderStartRef.current || renderEnd;
    const duration = renderEnd - renderStart;
    
    performanceOptimizer.monitor.recordMetric(`render_${name}`, duration, 'ms');
    
    if (duration > threshold) {
      console.warn(`Slow render detected in ${name}: ${duration.toFixed(2)}ms`);
      onSlowRender?.(duration);
    }
  });
  
  renderStartRef.current = performance.now();
  
  return <>{children}</>;
};

// ============================================================================
// BATCH UPDATE UTILITY
// ============================================================================

class BatchUpdater {
  private pendingUpdates: Map<string, () => void> = new Map();
  private isScheduled = false;
  
  public schedule(id: string, update: () => void): void {
    this.pendingUpdates.set(id, update);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  
  private flush(): void {
    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();
    this.isScheduled = false;
    
    // Execute all updates in a single batch
    updates.forEach(update => update());
  }
  
  public cancel(id: string): void {
    this.pendingUpdates.delete(id);
  }
  
  public cancelAll(): void {
    this.pendingUpdates.clear();
    this.isScheduled = false;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const batchUpdater = new BatchUpdater();

// ============================================================================
// OPTIMIZED CONTEXT PROVIDER
// ============================================================================

interface OptimizedProviderProps<T> {
  value: T;
  children: React.ReactNode;
  splitContexts?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export function createOptimizedContext<T extends Record<string, unknown>>(
  name: string
): {
  Provider: React.FC<OptimizedProviderProps<T>>;
  useContext: <K extends keyof T>(key: K) => T[K];
  useContextSelector: <K extends keyof T, R>(key: K, selector: (value: T[K]) => R) => R;
} {
  const contexts = new Map<string, React.Context<unknown>>();
  const MainContext = React.createContext<T | null>(null);
  
  const Provider: React.FC<OptimizedProviderProps<T>> = ({
    value,
    children,
    splitContexts = true
  }) => {
    if (!splitContexts) {
      return <MainContext.Provider value={value}>{children}</MainContext.Provider>;
    }
    
    // Split into individual contexts for fine-grained updates
    let content = children;
    
    Object.entries(value).forEach(([key, val]) => {
      let context = contexts.get(key);
      if (!context) {
        context = React.createContext(val);
        contexts.set(key, context);
      }
      
      content = <context.Provider value={val}>{content}</context.Provider>;
    });
    
    return <MainContext.Provider value={value}>{content}</MainContext.Provider>;
  };
  
  const useContext = <K extends keyof T>(key: K): T[K] => {
    const context = contexts.get(String(key));
    const mainValue = React.useContext(MainContext);
    
    // Always call both hooks unconditionally
    const specificContextValue = React.useContext(context as React.Context<T[K]> || React.createContext(undefined as T[K]));
    const contextValue = context ? specificContextValue : undefined;
    
    if (contextValue !== undefined) {
      return contextValue;
    }
    
    if (!mainValue) {
      throw new Error(`useContext(${String(key)}) must be used within ${name}Provider`);
    }
    
    return mainValue[key];
  };
  
  const useContextSelector = <K extends keyof T, R>(
    key: K,
    selector: (value: T[K]) => R
  ): R => {
    const value = useContext(key);
    return useMemo(() => selector(value), [value, selector]);
  };
  
  return { Provider, useContext, useContextSelector };
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const ReactPerformance = {
  VirtualList,
  withMemoization,
  lazyWithPreload,
  useVirtualization,
  useOptimizedState,
  useDeferredValue,
  useIntersectionObserver,
  PerformanceBoundary,
  batchUpdater,
  createOptimizedContext
};