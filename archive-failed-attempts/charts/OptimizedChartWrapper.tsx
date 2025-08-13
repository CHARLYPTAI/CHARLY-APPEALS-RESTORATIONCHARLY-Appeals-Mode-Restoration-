import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

interface OptimizedChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  width?: string;
  debounceDelay?: number;
  enableVirtualization?: boolean;
  className?: string;
}

// Debounced resize hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

export const OptimizedChartWrapper = memo<OptimizedChartWrapperProps>(({
  children,
  height = 300,
  width = "100%",
  debounceDelay = 150,
  enableVirtualization = true,
  className = "",
}) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const containerRefObject = useMemo(() => ({ current: containerRef as Element }), [containerRef]);
  const isVisible = useIntersectionObserver(
    containerRefObject,
    { rootMargin: '50px' }
  );

  // Debounce container size changes
  useDebounce(containerSize, debounceDelay);

  // Measure container size
  const measureContainer = useCallback(() => {
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    }
  }, [containerRef]);

  // Set up resize observer
  useEffect(() => {
    if (!containerRef) return;

    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(containerRef);

    // Initial measurement
    measureContainer();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, measureContainer]);

  // Memoized responsive container
  const responsiveContainer = useMemo(() => {
    if (!enableVirtualization || !isVisible) {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded" style={{ height }}>
          <div className="text-gray-500 text-sm">Chart loading...</div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width={width} height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    );
  }, [children, height, width, isVisible, enableVirtualization]);

  return (
    <div 
      ref={setContainerRef}
      className={`chart-container ${className}`}
      style={{ minHeight: height }}
    >
      {responsiveContainer}
    </div>
  );
});

OptimizedChartWrapper.displayName = 'OptimizedChartWrapper';

// HOC moved to separate file to fix Fast Refresh warnings
// Import from './withChartOptimization' instead

export default OptimizedChartWrapper;