import React, { useEffect, useState, useRef } from 'react';
import { IntelligentCanvas } from './IntelligentCanvas';
import { canvasStore } from '../stores/canvasStore';
import { cn } from '../lib/utils';

export const CanvasOrchestrator: React.FC = () => {
  const [currentMode, setCurrentMode] = useState(canvasStore.mode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayMode, setDisplayMode] = useState(canvasStore.mode);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const unsubscribe = canvasStore.subscribe((state) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (state.mode !== currentMode) {
          setIsTransitioning(true);
          
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
          }

          transitionTimeoutRef.current = setTimeout(() => {
            setDisplayMode(state.mode);
            setCurrentMode(state.mode);
            
            requestAnimationFrame(() => {
              setIsTransitioning(false);
            });
          }, 150);
        }
      }, 50);
    });

    return () => {
      unsubscribe();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [currentMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out",
          isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        )}
      >
        <IntelligentCanvas key={displayMode} />
      </div>
    </div>
  );
};