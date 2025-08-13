import React, { memo } from 'react';
import OptimizedChartWrapper from './OptimizedChartWrapper';

// Higher-order component for chart optimization
export function withChartOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { 
    height?: number; 
    debounceDelay?: number;
    enableMemo?: boolean;
  } = {}
) {
  const { height = 300, debounceDelay = 150, enableMemo = true } = options;

  const OptimizedChart = (props: P) => {
    const MemoizedComponent = enableMemo ? memo(WrappedComponent) : WrappedComponent;

    return (
      <OptimizedChartWrapper 
        height={height}
        debounceDelay={debounceDelay}
      >
        <MemoizedComponent {...props} />
      </OptimizedChartWrapper>
    );
  };

  OptimizedChart.displayName = `withChartOptimization(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return OptimizedChart;
}