/**
 * CHARLY 2.0 - Haptic Feedback Engine
 * Apple-quality haptic feedback simulation with visual and audio cues
 * Task 21: Revolutionary Gesture-Based Navigation
 */

import React, { createContext, useContext, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification' | 'warning' | 'error' | 'success';

interface HapticPattern {
  vibration: number[];
  visual: {
    color: string;
    size: number;
    duration: number;
    type: 'pulse' | 'ripple' | 'flash' | 'glow';
  };
  audio?: {
    frequency: number;
    duration: number;
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  };
}

interface HapticFeedbackContextType {
  triggerHaptic: (type: HapticType, intensity?: number, position?: { x: number; y: number }) => void;
  enableHaptics: boolean;
  setEnableHaptics: (enabled: boolean) => void;
  enableVisualFeedback: boolean;
  setEnableVisualFeedback: (enabled: boolean) => void;
  enableAudioFeedback: boolean;
  setEnableAudioFeedback: (enabled: boolean) => void;
  isHapticSupported: boolean;
}

const HapticFeedbackContext = createContext<HapticFeedbackContextType | null>(null);

export const useHapticFeedback = () => {
  const context = useContext(HapticFeedbackContext);
  if (!context) {
    throw new Error('useHapticFeedback must be used within a HapticFeedbackProvider');
  }
  return context;
};

interface HapticFeedbackProviderProps {
  children: React.ReactNode;
  enableHaptics?: boolean;
  enableVisualFeedback?: boolean;
  enableAudioFeedback?: boolean;
  className?: string;
}

export const HapticFeedbackProvider: React.FC<HapticFeedbackProviderProps> = ({
  children,
  enableHaptics = true,
  enableVisualFeedback = true,
  enableAudioFeedback = false,
  className = ''
}) => {
  const [hapticsEnabled, setHapticsEnabled] = useState(enableHaptics);
  const [visualFeedbackEnabled, setVisualFeedbackEnabled] = useState(enableVisualFeedback);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(enableAudioFeedback);
  const [feedbackElements, setFeedbackElements] = useState<Array<{
    id: string;
    type: HapticType;
    position: { x: number; y: number };
    timestamp: number;
  }>>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const feedbackIdRef = useRef(0);

  // Check if device supports haptic feedback
  const isHapticSupported = 'vibrate' in navigator;

  // Initialize audio context for audio feedback
  useEffect(() => {
    if (audioFeedbackEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }, [audioFeedbackEnabled]);

  // Haptic patterns for different feedback types
  const hapticPatterns = useMemo(() => ({
    light: {
      vibration: [10],
      visual: {
        color: '#3B82F6',
        size: 20,
        duration: 200,
        type: 'pulse'
      },
      audio: {
        frequency: 800,
        duration: 50,
        type: 'sine'
      }
    },
    medium: {
      vibration: [20],
      visual: {
        color: '#10B981',
        size: 30,
        duration: 300,
        type: 'ripple'
      },
      audio: {
        frequency: 600,
        duration: 75,
        type: 'sine'
      }
    },
    heavy: {
      vibration: [30],
      visual: {
        color: '#F59E0B',
        size: 40,
        duration: 400,
        type: 'glow'
      },
      audio: {
        frequency: 400,
        duration: 100,
        type: 'sine'
      }
    },
    selection: {
      vibration: [5],
      visual: {
        color: '#8B5CF6',
        size: 15,
        duration: 150,
        type: 'flash'
      },
      audio: {
        frequency: 1000,
        duration: 25,
        type: 'sine'
      }
    },
    impact: {
      vibration: [15, 10, 15],
      visual: {
        color: '#EF4444',
        size: 50,
        duration: 500,
        type: 'ripple'
      },
      audio: {
        frequency: 200,
        duration: 150,
        type: 'square'
      }
    },
    notification: {
      vibration: [10, 5, 10],
      visual: {
        color: '#06B6D4',
        size: 25,
        duration: 350,
        type: 'pulse'
      },
      audio: {
        frequency: 1200,
        duration: 100,
        type: 'sine'
      }
    },
    warning: {
      vibration: [20, 10, 20],
      visual: {
        color: '#F59E0B',
        size: 35,
        duration: 400,
        type: 'glow'
      },
      audio: {
        frequency: 500,
        duration: 200,
        type: 'triangle'
      }
    },
    error: {
      vibration: [30, 15, 30],
      visual: {
        color: '#EF4444',
        size: 45,
        duration: 600,
        type: 'flash'
      },
      audio: {
        frequency: 300,
        duration: 250,
        type: 'sawtooth'
      }
    },
    success: {
      vibration: [10, 5, 10, 5, 10],
      visual: {
        color: '#10B981',
        size: 30,
        duration: 500,
        type: 'ripple'
      },
      audio: {
        frequency: 800,
        duration: 300,
        type: 'sine'
      }
    }
  }), []);

  // Generate audio feedback
  const generateAudioFeedback = useCallback((pattern: HapticPattern, intensity: number) => {
    if (!audioFeedbackEnabled || !audioContextRef.current || !pattern.audio) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = pattern.audio.frequency;
      oscillator.type = pattern.audio.type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1 * intensity, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + pattern.audio.duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + pattern.audio.duration / 1000);
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  }, [audioFeedbackEnabled]);

  // Generate visual feedback
  const generateVisualFeedback = useCallback((
    type: HapticType,
    position: { x: number; y: number }
  ) => {
    if (!visualFeedbackEnabled) return;

    const id = `feedback-${++feedbackIdRef.current}`;
    const feedbackElement = {
      id,
      type,
      position,
      timestamp: Date.now()
    };

    setFeedbackElements(prev => [...prev, feedbackElement]);

    // Remove feedback element after animation
    setTimeout(() => {
      setFeedbackElements(prev => prev.filter(el => el.id !== id));
    }, hapticPatterns[type].visual.duration + 100);
  }, [visualFeedbackEnabled, hapticPatterns]);

  // Main haptic feedback trigger
  const triggerHaptic = useCallback((
    type: HapticType,
    intensity: number = 1,
    position?: { x: number; y: number }
  ) => {
    const pattern = hapticPatterns[type];
    const adjustedIntensity = Math.max(0.1, Math.min(1, intensity));

    // Physical vibration
    if (hapticsEnabled && isHapticSupported) {
      const vibrationPattern = pattern.vibration.map(duration => Math.round(duration * adjustedIntensity));
      navigator.vibrate(vibrationPattern);
    }

    // Visual feedback
    if (visualFeedbackEnabled && position) {
      generateVisualFeedback(type, position);
    }

    // Audio feedback
    if (audioFeedbackEnabled) {
      generateAudioFeedback(pattern, adjustedIntensity);
    }
  }, [hapticsEnabled, isHapticSupported, visualFeedbackEnabled, audioFeedbackEnabled, hapticPatterns, generateVisualFeedback, generateAudioFeedback]);

  // Context value
  const contextValue: HapticFeedbackContextType = {
    triggerHaptic,
    enableHaptics: hapticsEnabled,
    setEnableHaptics: setHapticsEnabled,
    enableVisualFeedback: visualFeedbackEnabled,
    setEnableVisualFeedback: setVisualFeedbackEnabled,
    enableAudioFeedback: audioFeedbackEnabled,
    setEnableAudioFeedback: setAudioFeedbackEnabled,
    isHapticSupported
  };

  // Visual feedback animation variants
  const getFeedbackVariants = (type: HapticType) => {
    const pattern = hapticPatterns[type];
    
    switch (pattern.visual.type) {
      case 'pulse':
        return {
          initial: { scale: 0, opacity: 0.8 },
          animate: { 
            scale: [0, 1.2, 0], 
            opacity: [0.8, 1, 0],
            transition: { duration: pattern.visual.duration / 1000 }
          }
        };
      case 'ripple':
        return {
          initial: { scale: 0, opacity: 0.6 },
          animate: { 
            scale: [0, 2, 3], 
            opacity: [0.6, 0.3, 0],
            transition: { duration: pattern.visual.duration / 1000 }
          }
        };
      case 'flash':
        return {
          initial: { scale: 1, opacity: 0 },
          animate: { 
            scale: [1, 1.5, 1], 
            opacity: [0, 1, 0],
            transition: { duration: pattern.visual.duration / 1000 }
          }
        };
      case 'glow':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { 
            scale: [0.8, 1.3, 0.8], 
            opacity: [0, 0.8, 0],
            transition: { duration: pattern.visual.duration / 1000 }
          }
        };
      default:
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: [0, 1, 0], 
            opacity: [0, 1, 0],
            transition: { duration: pattern.visual.duration / 1000 }
          }
        };
    }
  };

  return (
    <HapticFeedbackContext.Provider value={contextValue}>
      <div ref={containerRef} className={`relative ${className}`}>
        {children}
        
        {/* Visual feedback elements */}
        <AnimatePresence>
          {feedbackElements.map((element) => {
            const pattern = hapticPatterns[element.type];
            const variants = getFeedbackVariants(element.type);
            
            return (
              <motion.div
                key={element.id}
                className="absolute pointer-events-none z-50"
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  transform: 'translate(-50%, -50%)'
                }}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="initial"
              >
                <div
                  className="rounded-full"
                  style={{
                    width: pattern.visual.size,
                    height: pattern.visual.size,
                    backgroundColor: pattern.visual.color,
                    boxShadow: `0 0 ${pattern.visual.size}px ${pattern.visual.color}40`
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Haptic settings overlay */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            className="fixed bottom-4 left-4 z-40 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Haptics:</span>
                <span className={hapticsEnabled ? 'text-green-400' : 'text-red-400'}>
                  {hapticsEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Visual:</span>
                <span className={visualFeedbackEnabled ? 'text-green-400' : 'text-red-400'}>
                  {visualFeedbackEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Audio:</span>
                <span className={audioFeedbackEnabled ? 'text-green-400' : 'text-red-400'}>
                  {audioFeedbackEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Support:</span>
                <span className={isHapticSupported ? 'text-green-400' : 'text-yellow-400'}>
                  {isHapticSupported ? 'YES' : 'SIMULATED'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </HapticFeedbackContext.Provider>
  );
};

export default HapticFeedbackProvider;