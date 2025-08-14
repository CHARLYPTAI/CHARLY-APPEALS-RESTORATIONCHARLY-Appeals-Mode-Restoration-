import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { useAdaptiveColor } from './AdaptiveColorEngine';

interface TransitionConfig {
  duration: number;
  easing: string;
  delay: number;
  stagger: number;
}

interface AnimationKeyframe {
  progress: number;
  properties: { [key: string]: string };
}

interface TransitionSequence {
  id: string;
  name: string;
  keyframes: AnimationKeyframe[];
  config: TransitionConfig;
  elements: string[];
}

interface ActiveTransition {
  id: string;
  startTime: number;
  endTime: number;
  fromColors: { [key: string]: string };
  toColors: { [key: string]: string };
  progress: number;
  config: TransitionConfig;
}

interface ColorTransitionOrchestratorContextType {
  activeTransitions: ActiveTransition[];
  isTransitioning: boolean;
  queueTransition: (fromColors: { [key: string]: string }, toColors: { [key: string]: string }, config?: Partial<TransitionConfig>) => void;
  createSequence: (name: string, keyframes: AnimationKeyframe[], config: TransitionConfig) => TransitionSequence;
  playSequence: (sequenceId: string) => void;
  pauseTransitions: () => void;
  resumeTransitions: () => void;
  clearTransitions: () => void;
  setGlobalConfig: (config: Partial<TransitionConfig>) => void;
  getTransitionProgress: (transitionId: string) => number;
  onTransitionComplete: (callback: (transitionId: string) => void) => void;
  enableBatchMode: boolean;
  setBatchMode: (enabled: boolean) => void;
}

const defaultConfig: TransitionConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  delay: 0,
  stagger: 50
};

const ColorTransitionOrchestratorContext = createContext<ColorTransitionOrchestratorContextType | undefined>(undefined);

export const ColorTransitionOrchestratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateColor, performanceMetrics } = useAdaptiveColor();
  const [activeTransitions, setActiveTransitions] = useState<ActiveTransition[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<TransitionConfig>(defaultConfig);
  const [sequences, setSequences] = useState<Map<string, TransitionSequence>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [enableBatchMode, setEnableBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<Array<{ fromColors: { [key: string]: string }, toColors: { [key: string]: string }, config: TransitionConfig }>>([]);

  const animationFrameRef = useRef<number>();
  const transitionCallbacksRef = useRef<Set<(transitionId: string) => void>>(new Set());

  // Color interpolation
  const interpolateColor = useCallback((from: string, to: string, progress: number): string => {
    const fromRgb = hexToRgb(from);
    const toRgb = hexToRgb(to);
    
    const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * progress);
    const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * progress);
    const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * progress);
    
    return rgbToHex(r, g, b);
  }, []);

  // Easing functions
  const applyEasing = useCallback((progress: number, easing: string): number => {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'cubic-bezier(0.4, 0, 0.2, 1)':
        // Material Design standard easing
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }, []);

  // Helper functions
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Animation loop
  const animate = useCallback(() => {
    if (isPaused || activeTransitions.length === 0) {
      setIsTransitioning(false);
      return;
    }

    const now = performance.now();
    const updatedTransitions: ActiveTransition[] = [];
    const completedTransitions: string[] = [];

    activeTransitions.forEach(transition => {
      const elapsed = now - transition.startTime;
      const rawProgress = Math.min(elapsed / transition.config.duration, 1);
      const easedProgress = applyEasing(rawProgress, transition.config.easing);

      if (rawProgress >= 1) {
        // Transition complete
        completedTransitions.push(transition.id);
        
        // Apply final colors
        Object.entries(transition.toColors).forEach(([key, color]) => {
          updateColor(key, color);
        });
      } else {
        // Transition in progress
        const updatedTransition = { ...transition, progress: easedProgress };
        updatedTransitions.push(updatedTransition);

        // Apply interpolated colors
        Object.entries(transition.fromColors).forEach(([key, fromColor]) => {
          const toColor = transition.toColors[key];
          if (toColor) {
            const interpolatedColor = interpolateColor(fromColor, toColor, easedProgress);
            updateColor(key, interpolatedColor);
          }
        });
      }
    });

    // Update active transitions
    setActiveTransitions(updatedTransitions);

    // Notify completion callbacks
    completedTransitions.forEach(transitionId => {
      transitionCallbacksRef.current.forEach(callback => callback(transitionId));
    });

    // Continue animation if there are active transitions
    if (updatedTransitions.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
      setIsTransitioning(true);
    } else {
      setIsTransitioning(false);
      processBatchQueue();
    }
  }, [activeTransitions, isPaused, applyEasing, interpolateColor, updateColor]);

  // Process batch queue
  const processBatchQueue = useCallback(() => {
    if (enableBatchMode && batchQueue.length > 0) {
      const batch = batchQueue.shift();
      if (batch) {
        setBatchQueue(prev => prev.slice(1));
        queueTransition(batch.fromColors, batch.toColors, batch.config);
      }
    }
  }, [enableBatchMode, batchQueue]);

  // Queue a new transition
  const queueTransition = useCallback((
    fromColors: { [key: string]: string },
    toColors: { [key: string]: string },
    config: Partial<TransitionConfig> = {}
  ) => {
    const transitionConfig: TransitionConfig = { ...globalConfig, ...config };
    
    // If batch mode is enabled and we're already transitioning, queue it
    if (enableBatchMode && isTransitioning) {
      setBatchQueue(prev => [...prev, { fromColors, toColors, config: transitionConfig }]);
      return;
    }

    const now = performance.now();
    const transitionId = `transition-${now}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTransition: ActiveTransition = {
      id: transitionId,
      startTime: now + transitionConfig.delay,
      endTime: now + transitionConfig.delay + transitionConfig.duration,
      fromColors,
      toColors,
      progress: 0,
      config: transitionConfig
    };

    setActiveTransitions(prev => [...prev, newTransition]);
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [globalConfig, enableBatchMode, isTransitioning, animate]);

  // Create a transition sequence
  const createSequence = useCallback((
    name: string,
    keyframes: AnimationKeyframe[],
    config: TransitionConfig
  ): TransitionSequence => {
    const sequenceId = `sequence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const sequence: TransitionSequence = {
      id: sequenceId,
      name,
      keyframes,
      config,
      elements: []
    };

    setSequences(prev => new Map(prev).set(sequenceId, sequence));
    return sequence;
  }, []);

  // Play a sequence
  const playSequence = useCallback((sequenceId: string) => {
    const sequence = sequences.get(sequenceId);
    if (!sequence) return;

    let currentKeyframeIndex = 0;
    const playNextKeyframe = () => {
      if (currentKeyframeIndex >= sequence.keyframes.length - 1) return;

      const currentKeyframe = sequence.keyframes[currentKeyframeIndex];
      const nextKeyframe = sequence.keyframes[currentKeyframeIndex + 1];

      const fromColors = currentKeyframe.properties;
      const toColors = nextKeyframe.properties;

      queueTransition(fromColors, toColors, {
        duration: sequence.config.duration * (nextKeyframe.progress - currentKeyframe.progress),
        easing: sequence.config.easing,
        delay: sequence.config.stagger * currentKeyframeIndex,
        stagger: sequence.config.stagger
      });

      currentKeyframeIndex++;
      setTimeout(playNextKeyframe, sequence.config.duration * (nextKeyframe.progress - currentKeyframe.progress));
    };

    playNextKeyframe();
  }, [sequences, queueTransition]);

  // Pause all transitions
  const pauseTransitions = useCallback(() => {
    setIsPaused(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Resume all transitions
  const resumeTransitions = useCallback(() => {
    setIsPaused(false);
    if (activeTransitions.length > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [activeTransitions, animate]);

  // Clear all transitions
  const clearTransitions = useCallback(() => {
    setActiveTransitions([]);
    setBatchQueue([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    setIsTransitioning(false);
  }, []);

  // Get transition progress
  const getTransitionProgress = useCallback((transitionId: string): number => {
    const transition = activeTransitions.find(t => t.id === transitionId);
    return transition ? transition.progress : 0;
  }, [activeTransitions]);

  // Register transition completion callback
  const onTransitionComplete = useCallback((callback: (transitionId: string) => void) => {
    transitionCallbacksRef.current.add(callback);
  }, []);

  // Performance optimization: adjust config based on performance metrics
  useEffect(() => {
    if (performanceMetrics.transitionTime > 100) {
      // Slow performance - reduce quality
      setGlobalConfig(prev => ({
        ...prev,
        duration: Math.max(100, prev.duration - 50),
        stagger: Math.max(10, prev.stagger - 10)
      }));
    } else if (performanceMetrics.transitionTime < 50 && performanceMetrics.frameRate > 55) {
      // Good performance - can increase quality
      setGlobalConfig(prev => ({
        ...prev,
        duration: Math.min(500, prev.duration + 25),
        stagger: Math.min(100, prev.stagger + 5)
      }));
    }
  }, [performanceMetrics.transitionTime, performanceMetrics.frameRate]);

  // Start animation loop when transitions are added
  useEffect(() => {
    if (activeTransitions.length > 0 && !isPaused && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [activeTransitions, isPaused, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Apply CSS custom properties for transitions
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--transition-duration', `${globalConfig.duration}ms`);
    root.style.setProperty('--transition-easing', globalConfig.easing);
    root.style.setProperty('--transition-delay', `${globalConfig.delay}ms`);
    root.style.setProperty('--transition-stagger', `${globalConfig.stagger}ms`);
  }, [globalConfig]);

  const value: ColorTransitionOrchestratorContextType = {
    activeTransitions,
    isTransitioning,
    queueTransition,
    createSequence,
    playSequence,
    pauseTransitions,
    resumeTransitions,
    clearTransitions,
    setGlobalConfig,
    getTransitionProgress,
    onTransitionComplete,
    enableBatchMode,
    setBatchMode: setEnableBatchMode
  };

  return (
    <ColorTransitionOrchestratorContext.Provider value={value}>
      {children}
    </ColorTransitionOrchestratorContext.Provider>
  );
};

export const useColorTransitionOrchestrator = () => {
  const context = useContext(ColorTransitionOrchestratorContext);
  if (!context) {
    throw new Error('useColorTransitionOrchestrator must be used within a ColorTransitionOrchestratorProvider');
  }
  return context;
};

// Preset sequences for common transitions
export const useCreatePresetSequences = () => {
  const { createSequence } = useColorTransitionOrchestrator();

  const fadeInSequence = createSequence('fadeIn', [
    { progress: 0, properties: { primary: '#00000000' } },
    { progress: 1, properties: { primary: '#007AFF' } }
  ], { duration: 300, easing: 'ease-out', delay: 0, stagger: 0 });

  const pulseSequence = createSequence('pulse', [
    { progress: 0, properties: { primary: '#007AFF' } },
    { progress: 0.5, properties: { primary: '#0A84FF' } },
    { progress: 1, properties: { primary: '#007AFF' } }
  ], { duration: 1000, easing: 'ease-in-out', delay: 0, stagger: 0 });

  const rainbowSequence = createSequence('rainbow', [
    { progress: 0, properties: { primary: '#FF0000' } },
    { progress: 0.2, properties: { primary: '#FF8800' } },
    { progress: 0.4, properties: { primary: '#FFFF00' } },
    { progress: 0.6, properties: { primary: '#00FF00' } },
    { progress: 0.8, properties: { primary: '#0088FF' } },
    { progress: 1, properties: { primary: '#8800FF' } }
  ], { duration: 2000, easing: 'linear', delay: 0, stagger: 100 });

  return { fadeInSequence, pulseSequence, rainbowSequence };
};

export default ColorTransitionOrchestratorProvider;