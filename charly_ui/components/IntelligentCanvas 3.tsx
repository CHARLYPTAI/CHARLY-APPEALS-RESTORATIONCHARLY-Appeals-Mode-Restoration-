import React, { Suspense, lazy, useMemo } from 'react';
import { canvasStore } from '../stores/canvasStore';
import { cn } from '../lib/utils';
import { PortfolioSkeleton } from './skeletons/PortfolioSkeleton';
import { AnalysisSkeleton } from './skeletons/AnalysisSkeleton';
import { IntelligenceSkeleton } from './skeletons/IntelligenceSkeleton';
import { AppealsSkeleton } from './skeletons/AppealsSkeleton';
import { ResultsSkeleton } from './skeletons/ResultsSkeleton';

const Portfolio = lazy(() => import('./Portfolio'));
const Analysis = lazy(() => import('./Analysis'));
const Intelligence = lazy(() => import('./Intelligence'));
const Appeals = lazy(() => import('./Appeals'));
const Results = lazy(() => import('./Results'));

export const IntelligentCanvas: React.FC = () => {
  const [currentMode, setCurrentMode] = React.useState(canvasStore.mode);

  React.useEffect(() => {
    const unsubscribe = canvasStore.subscribe((state) => {
      setCurrentMode(state.mode);
    });
    return unsubscribe;
  }, []);

  const renderMode = () => {
    switch (currentMode) {
      case 'portfolio':
        return <Portfolio />;
      case 'analysis':
        return <Analysis />;
      case 'intelligence':
        return <Intelligence />;
      case 'appeals':
        return <Appeals />;
      case 'results':
        return <Results />;
      default:
        return <Portfolio />;
    }
  };

  const renderSkeleton = useMemo(() => {
    switch (currentMode) {
      case 'portfolio':
        return <PortfolioSkeleton />;
      case 'analysis':
        return <AnalysisSkeleton />;
      case 'intelligence':
        return <IntelligenceSkeleton />;
      case 'appeals':
        return <AppealsSkeleton />;
      case 'results':
        return <ResultsSkeleton />;
      default:
        return <PortfolioSkeleton />;
    }
  }, [currentMode]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div 
          className={cn(
            "w-full max-w-7xl h-full",
            "bg-white dark:bg-gray-800",
            "rounded-2xl shadow-2xl",
            "border border-gray-200/50 dark:border-gray-700/50",
            "backdrop-blur-sm",
            "transition-all duration-300 ease-in-out",
            "transform"
          )}
        >
          <Suspense 
            fallback={
              <div className="w-full h-full overflow-auto rounded-2xl opacity-0 animate-fade-in">
                {renderSkeleton}
              </div>
            }
          >
            <div className="w-full h-full overflow-auto rounded-2xl animate-fade-in">
              {renderMode()}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};