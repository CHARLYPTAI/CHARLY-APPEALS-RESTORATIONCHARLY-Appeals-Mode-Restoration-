import React, { Suspense, lazy } from 'react';
import { canvasStore } from '../stores/canvasStore';
import { cn } from '../lib/utils';

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
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full" />
                  <div className="text-sm text-gray-500">Loading...</div>
                </div>
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