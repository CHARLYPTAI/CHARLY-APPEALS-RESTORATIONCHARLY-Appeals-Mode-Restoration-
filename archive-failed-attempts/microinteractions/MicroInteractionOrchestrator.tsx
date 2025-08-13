import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { SPRING_PRESETS } from './SpringPhysicsEngine';
import { useColorPalette } from '../color/ColorPaletteManager';
import { useHapticFeedback } from '../mobile/HapticFeedbackEngine';

interface MicroInteractionEvent {
  id: string;
  type: 'hover' | 'focus' | 'click' | 'load' | 'success' | 'error' | 'warning';
  element: string;
  timestamp: number;
  position?: { x: number; y: number };
  data?: any;
}

interface InteractionState {
  isHovering: boolean;
  isFocused: boolean;
  isLoading: boolean;
  hasError: boolean;
  hasSuccess: boolean;
  hasWarning: boolean;
  lastInteraction: MicroInteractionEvent | null;
}

interface MicroInteractionContextType {
  state: InteractionState;
  events: MicroInteractionEvent[];
  registerInteraction: (event: Omit<MicroInteractionEvent, 'id' | 'timestamp'>) => void;
  createAnimationSequence: (elementId: string, sequence: any[]) => Promise<void>;
  coordinateAnimations: (elementIds: string[], type: 'parallel' | 'sequence') => Promise<void>;
  getInteractionMetrics: () => {
    averageResponseTime: number;
    totalInteractions: number;
    errorRate: number;
    successRate: number;
  };
  clearHistory: () => void;
}

const MicroInteractionContext = createContext<MicroInteractionContextType | null>(null);

export const useMicroInteraction = () => {
  const context = useContext(MicroInteractionContext);
  if (!context) {
    throw new Error('useMicroInteraction must be used within a MicroInteractionProvider');
  }
  return context;
};

interface MicroInteractionProviderProps {
  children: React.ReactNode;
  maxHistorySize?: number;
  performanceMonitoring?: boolean;
}

export const MicroInteractionProvider: React.FC<MicroInteractionProviderProps> = ({
  children,
  maxHistorySize = 100,
  performanceMonitoring = true
}) => {
  const [state, setState] = useState<InteractionState>({
    isHovering: false,
    isFocused: false,
    isLoading: false,
    hasError: false,
    hasSuccess: false,
    hasWarning: false,
    lastInteraction: null
  });

  const [events, setEvents] = useState<MicroInteractionEvent[]>([]);
  const animationControlsRef = useRef<Map<string, ReturnType<typeof useAnimation>>>(new Map());
  const performanceRef = useRef<{
    startTime: number;
    endTime: number;
    interactions: number;
  }>({
    startTime: Date.now(),
    endTime: Date.now(),
    interactions: 0
  });

  const { triggerHaptic } = useHapticFeedback();
  const { currentPalette } = useColorPalette();

  const registerInteraction = useCallback((event: Omit<MicroInteractionEvent, 'id' | 'timestamp'>) => {
    const newEvent: MicroInteractionEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    // Update global state
    setState(prev => {
      const newState = { ...prev, lastInteraction: newEvent };
      
      switch (event.type) {
        case 'hover':
          newState.isHovering = true;
          break;
        case 'focus':
          newState.isFocused = true;
          break;
        case 'load':
          newState.isLoading = true;
          break;
        case 'success':
          newState.hasSuccess = true;
          newState.isLoading = false;
          triggerHaptic('success');
          break;
        case 'error':
          newState.hasError = true;
          newState.isLoading = false;
          triggerHaptic('error');
          break;
        case 'warning':
          newState.hasWarning = true;
          triggerHaptic('warning');
          break;
        case 'click':
          triggerHaptic('medium');
          break;
      }

      return newState;
    });

    // Add to events history
    setEvents(prev => {
      const newEvents = [...prev, newEvent];
      // Limit history size
      if (newEvents.length > maxHistorySize) {
        newEvents.shift();
      }
      return newEvents;
    });

    // Update performance metrics
    if (performanceMonitoring) {
      performanceRef.current.interactions++;
      performanceRef.current.endTime = Date.now();
    }
  }, [maxHistorySize, performanceMonitoring, triggerHaptic]);

  const createAnimationSequence = useCallback(async (elementId: string, sequence: any[]) => {
    const controls = animationControlsRef.current.get(elementId);
    if (!controls) return;

    for (const animation of sequence) {
      await controls.start(animation);
    }
  }, []);

  const coordinateAnimations = useCallback(async (elementIds: string[], type: 'parallel' | 'sequence') => {
    const controls = elementIds.map(id => animationControlsRef.current.get(id)).filter(Boolean);
    
    if (controls.length === 0) return;

    if (type === 'parallel') {
      await Promise.all(controls.map(control => control?.start?.('animate')));
    } else {
      for (const control of controls) {
        await control?.start?.('animate');
      }
    }
  }, []);

  const getInteractionMetrics = useCallback(() => {
    const totalTime = performanceRef.current.endTime - performanceRef.current.startTime;
    const averageResponseTime = totalTime / Math.max(performanceRef.current.interactions, 1);
    
    const errorEvents = events.filter(e => e.type === 'error');
    const successEvents = events.filter(e => e.type === 'success');
    const totalEvents = events.length;

    return {
      averageResponseTime,
      totalInteractions: performanceRef.current.interactions,
      errorRate: totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0,
      successRate: totalEvents > 0 ? (successEvents.length / totalEvents) * 100 : 0
    };
  }, [events]);

  const clearHistory = useCallback(() => {
    setEvents([]);
    performanceRef.current = {
      startTime: Date.now(),
      endTime: Date.now(),
      interactions: 0
    };
  }, []);

  const contextValue: MicroInteractionContextType = {
    state,
    events,
    registerInteraction,
    createAnimationSequence,
    coordinateAnimations,
    getInteractionMetrics,
    clearHistory
  };

  return (
    <MicroInteractionContext.Provider value={contextValue}>
      {children}
    </MicroInteractionContext.Provider>
  );
};

// Higher-order component for automatic interaction tracking
export const withMicroInteraction = <T extends {}>(
  Component: React.ComponentType<T>,
  elementId: string
) => {
  return React.forwardRef<any, T>((props, ref) => {
    const { registerInteraction } = useMicroInteraction();
    const controls = useAnimation();
    
    useEffect(() => {
      // Register animation controls
      const animationControlsRef = useRef<Map<string, ReturnType<typeof useAnimation>>>(new Map());
      animationControlsRef.current.set(elementId, controls);
      
      return () => {
        animationControlsRef.current.delete(elementId);
      };
    }, [controls]);

    const handleInteraction = useCallback((type: MicroInteractionEvent['type'], data?: any) => {
      registerInteraction({
        type,
        element: elementId,
        data
      });
    }, [registerInteraction]);

    const enhancedProps = {
      ...props,
      onMouseEnter: (e: React.MouseEvent) => {
        handleInteraction('hover', { x: e.clientX, y: e.clientY });
        (props as any).onMouseEnter?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        handleInteraction('focus');
        (props as any).onFocus?.(e);
      },
      onClick: (e: React.MouseEvent) => {
        handleInteraction('click', { x: e.clientX, y: e.clientY });
        (props as any).onClick?.(e);
      },
      ref
    };

    return <Component {...enhancedProps} />;
  });
};

// Context-aware interaction components
export const InteractionBoundary: React.FC<{
  children: React.ReactNode;
  onInteractionChange?: (state: InteractionState) => void;
  className?: string;
}> = ({ children, onInteractionChange, className = '' }) => {
  const { state } = useMicroInteraction();
  const { currentPalette } = useColorPalette();
  const springConfig = SPRING_PRESETS.gentle;

  useEffect(() => {
    onInteractionChange?.(state);
  }, [state, onInteractionChange]);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        backgroundColor: state.isHovering ? currentPalette.primary + '05' : 'transparent',
        borderColor: state.isFocused ? currentPalette.primary : 'transparent',
        borderWidth: state.isFocused ? '2px' : '0px'
      }}
      animate={{
        scale: state.isHovering ? 1.01 : 1,
        transition: springConfig
      }}
    >
      {children}
    </motion.div>
  );
};

export const InteractionIndicator: React.FC<{
  showMetrics?: boolean;
  className?: string;
}> = ({ showMetrics = false, className = '' }) => {
  const { state, getInteractionMetrics } = useMicroInteraction();
  const { currentPalette } = useColorPalette();
  const [metrics, setMetrics] = useState(getInteractionMetrics());

  useEffect(() => {
    if (showMetrics) {
      const interval = setInterval(() => {
        setMetrics(getInteractionMetrics());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showMetrics, getInteractionMetrics]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* State indicators */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: state.isHovering ? currentPalette.primary : currentPalette.textSecondary + '40'
            }}
          />
          <span style={{ color: currentPalette.textSecondary }}>Hover</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: state.isFocused ? currentPalette.primary : currentPalette.textSecondary + '40'
            }}
          />
          <span style={{ color: currentPalette.textSecondary }}>Focus</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: state.isLoading ? currentPalette.warning : currentPalette.textSecondary + '40'
            }}
          />
          <span style={{ color: currentPalette.textSecondary }}>Loading</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: state.hasSuccess ? currentPalette.success : currentPalette.textSecondary + '40'
            }}
          />
          <span style={{ color: currentPalette.textSecondary }}>Success</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: state.hasError ? currentPalette.error : currentPalette.textSecondary + '40'
            }}
          />
          <span style={{ color: currentPalette.textSecondary }}>Error</span>
        </div>
      </div>

      {/* Performance metrics */}
      {showMetrics && (
        <div className="text-xs space-y-1" style={{ color: currentPalette.textSecondary }}>
          <div className="flex justify-between">
            <span>Interactions:</span>
            <span>{metrics.totalInteractions}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Response:</span>
            <span>{metrics.averageResponseTime.toFixed(2)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Success Rate:</span>
            <span>{metrics.successRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Error Rate:</span>
            <span>{metrics.errorRate.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Performance monitoring hook
export const useInteractionPerformance = () => {
  const { getInteractionMetrics } = useMicroInteraction();
  const [metrics, setMetrics] = useState(getInteractionMetrics());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getInteractionMetrics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getInteractionMetrics]);

  return metrics;
};

// Interaction debugger component (development only)
export const InteractionDebugger: React.FC<{
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ visible = false, position = 'bottom-right' }) => {
  const { state, events, clearHistory } = useMicroInteraction();
  const { currentPalette } = useColorPalette();

  if (!visible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <motion.div
      className={`fixed z-50 ${positionClasses[position]} max-w-xs`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        backgroundColor: currentPalette.surface + 'E0',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '16px',
        border: `1px solid ${currentPalette.border}`,
        boxShadow: `0 10px 25px -5px ${currentPalette.shadow}40`
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: currentPalette.text }}>
          Interaction Debug
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: currentPalette.error + '20',
            color: currentPalette.error
          }}
        >
          Clear
        </button>
      </div>

      <InteractionIndicator showMetrics={true} />

      <div className="mt-3 pt-3 border-t" style={{ borderColor: currentPalette.border }}>
        <h4 className="text-xs font-medium mb-2" style={{ color: currentPalette.text }}>
          Recent Events ({events.length})
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {events.slice(-5).map(event => (
            <div key={event.id} className="text-xs flex justify-between">
              <span style={{ color: currentPalette.textSecondary }}>
                {event.element}
              </span>
              <span style={{ color: currentPalette.primary }}>
                {event.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MicroInteractionProvider;