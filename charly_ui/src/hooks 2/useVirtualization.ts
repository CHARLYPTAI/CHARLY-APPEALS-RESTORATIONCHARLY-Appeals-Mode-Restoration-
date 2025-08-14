import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  threshold?: number; // Intersection observer threshold
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  isVisible: boolean;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

    return { startIndex, endIndex, visibleStart, visibleEnd };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const virtual: VirtualItem[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      virtual.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        isVisible: i >= visibleRange.visibleStart && i <= visibleRange.visibleEnd,
      });
    }

    return virtual;
  }, [visibleRange, itemHeight]);

  // Get visible items data
  const visibleItems = useMemo(() => {
    return virtualItems.map(virtual => ({
      ...virtual,
      data: items[virtual.index],
    }));
  }, [virtualItems, items]);

  // Handle scroll events
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Set up scroll listener
  useEffect(() => {
    if (!containerRef) return;

    containerRef.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      containerRef.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    containerRef: setContainerRef,
    visibleItems,
    totalHeight,
    offsetY,
    isScrolling: false, // Could be enhanced with scroll state detection
    scrollTo: (index: number) => {
      if (containerRef) {
        containerRef.scrollTop = index * itemHeight;
      }
    },
    scrollToItem: (item: T) => {
      const index = items.indexOf(item);
      if (index !== -1 && containerRef) {
        containerRef.scrollTop = index * itemHeight;
      }
    },
  };
}

// Hook for progressive data loading
interface ProgressiveLoadingOptions {
  pageSize: number;
  threshold?: number;
  loadingDelay?: number;
}

export function useProgressiveLoading<T>(
  dataSource: (page: number, pageSize: number) => Promise<T[]>,
  options: ProgressiveLoadingOptions
) {
  const { pageSize, threshold = 0.8, loadingDelay = 300 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load next page
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add artificial delay to prevent rapid loading
      await new Promise(resolve => setTimeout(resolve, loadingDelay));
      
      const newData = await dataSource(currentPage, pageSize);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setCurrentPage(prev => prev + 1);
        
        // Check if we received less than requested (indicates end)
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [dataSource, currentPage, pageSize, isLoading, hasMore, loadingDelay]);

  // Auto-load based on scroll position
  const handleLoadMore = useCallback((scrollPercentage: number) => {
    if (scrollPercentage >= threshold && !isLoading && hasMore) {
      loadMore();
    }
  }, [threshold, isLoading, hasMore, loadMore]);

  // Reset data
  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (data.length === 0 && !isLoading) {
      loadMore();
    }
  }, [data.length, isLoading, loadMore]);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    handleLoadMore,
    reset,
  };
}

// Hook for infinite scrolling with virtualization
export function useInfiniteVirtualization<T>(
  dataSource: (page: number, pageSize: number) => Promise<T[]>,
  virtualizationOptions: VirtualizationOptions,
  loadingOptions: ProgressiveLoadingOptions
) {
  const {
    data,
    isLoading,
    hasMore,
    error,
    handleLoadMore,
    reset,
  } = useProgressiveLoading(dataSource, loadingOptions);

  const {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    scrollTo,
    scrollToItem,
  } = useVirtualization(data, virtualizationOptions);

  // Enhanced container ref that also handles loading trigger
  const enhancedContainerRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      containerRef(element);
      
      // Set up intersection observer for loading trigger
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
              handleLoadMore(scrollPercentage);
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe the bottom of the container
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.position = 'absolute';
      sentinel.style.bottom = '100px'; // Trigger 100px before bottom
      element.appendChild(sentinel);
      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        if (element.contains(sentinel)) {
          element.removeChild(sentinel);
        }
      };
    }
  }, [containerRef, handleLoadMore]);

  return {
    containerRef: enhancedContainerRef,
    visibleItems,
    totalHeight,
    offsetY,
    isLoading,
    hasMore,
    error,
    scrollTo,
    scrollToItem,
    reset,
  };
}