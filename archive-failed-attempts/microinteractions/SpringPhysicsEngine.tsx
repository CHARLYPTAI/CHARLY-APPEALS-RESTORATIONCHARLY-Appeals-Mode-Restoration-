import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { useAdaptiveColor } from '../color/AdaptiveColorEngine';
import { useColorAccessibility } from '../color/ColorAccessibilityProvider';

interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
  precision: number;
}

interface SpringAnimation {
  id: string;
  element: HTMLElement;
  property: string;
  from: number;
  to: number;
  current: number;
  velocity: number;
  config: SpringConfig;
  startTime: number;
  onComplete?: () => void;
}

interface MicroInteractionContextType {
  animateSpring: (
    element: HTMLElement,
    property: string,
    to: number,
    config?: Partial<SpringConfig>,
    onComplete?: () => void
  ) => void;
  animateButtonPress: (element: HTMLElement, intensity?: 'light' | 'medium' | 'heavy') => void;
  animateLoading: (element: HTMLElement, type: 'spinner' | 'pulse' | 'breathe') => void;
  animateFocusGlow: (element: HTMLElement, color?: string) => void;
  animateSuccess: (element: HTMLElement) => void;
  animateError: (element: HTMLElement) => void;
  animateHover: (element: HTMLElement, type: 'lift' | 'glow' | 'scale') => void;
  cancelAnimation: (element: HTMLElement) => void;
  isAnimating: (element: HTMLElement) => boolean;
  getPerformanceMetrics: () => {
    activeAnimations: number;
    frameRate: number;
    memoryUsage: number;
  };
}

// Apple-calibrated spring presets
const SPRING_PRESETS = {
  gentle: { tension: 120, friction: 14, mass: 1, precision: 0.01 },
  responsive: { tension: 180, friction: 12, mass: 1, precision: 0.01 },
  bouncy: { tension: 200, friction: 10, mass: 1, precision: 0.01 },
  snappy: { tension: 280, friction: 18, mass: 1, precision: 0.01 },
  wobbly: { tension: 160, friction: 8, mass: 1, precision: 0.01 }
} as const;

const MicroInteractionContext = createContext<MicroInteractionContextType | undefined>(undefined);

export const MicroInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentPalette, performanceMetrics } = useAdaptiveColor();
  const { reducedMotionMode } = useColorAccessibility();
  
  const [activeAnimations, setActiveAnimations] = useState<Map<string, SpringAnimation>>(new Map());
  const [frameRate, setFrameRate] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const framesRef = useRef<number>(0);

  // Spring physics calculation
  const calculateSpringForce = useCallback((animation: SpringAnimation, deltaTime: number) => {
    const { current, to, velocity, config } = animation;
    const { tension, friction, mass } = config;
    
    // Hooke's law: F = -kx (spring force)
    const springForce = -tension * (current - to);
    
    // Friction force: F = -bv
    const frictionForce = -friction * velocity;
    
    // Net force and acceleration
    const netForce = springForce + frictionForce;
    const acceleration = netForce / mass;
    
    // Update velocity and position using Euler integration
    const newVelocity = velocity + acceleration * deltaTime;
    const newPosition = current + newVelocity * deltaTime;
    
    return { position: newPosition, velocity: newVelocity };
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const deltaTime = Math.min((timestamp - startTimeRef.current) / 1000, 0.016); // Cap at 60fps
    startTimeRef.current = timestamp;
    
    framesRef.current++;
    
    // Calculate frame rate every second
    if (timestamp % 1000 < 16) {
      setFrameRate(Math.round(framesRef.current * 1000 / 1000));
      framesRef.current = 0;
    }
    
    const updatedAnimations = new Map(activeAnimations);
    const completedAnimations: string[] = [];
    
    updatedAnimations.forEach((animation, id) => {
      if (reducedMotionMode) {
        // Skip to end for reduced motion
        animation.current = animation.to;
        animation.velocity = 0;
      } else {
        const { position, velocity } = calculateSpringForce(animation, deltaTime);
        animation.current = position;
        animation.velocity = velocity;
      }
      
      // Apply the animation to the element
      const { element, property, current } = animation;
      
      switch (property) {
        case 'scale':
          element.style.transform = `scale(${current})`;
          break;
        case 'translateY':
          element.style.transform = `translateY(${current}px)`;
          break;
        case 'opacity':
          element.style.opacity = current.toString();
          break;
        case 'rotation':
          element.style.transform = `rotate(${current}deg)`;
          break;
        case 'borderRadius':
          element.style.borderRadius = `${current}px`;
          break;
        case 'boxShadow':
          element.style.boxShadow = `0 ${current}px ${current * 2}px rgba(0,0,0,0.1)`;
          break;
        case 'backgroundColor':
          // Handle color interpolation
          break;
        default:
          (element.style as any)[property] = `${current}px`;
      }
      
      // Check if animation is complete
      const isComplete = Math.abs(animation.to - animation.current) < animation.config.precision &&
                        Math.abs(animation.velocity) < animation.config.precision;
      
      if (isComplete || reducedMotionMode) {
        completedAnimations.push(id);
        animation.onComplete?.();
      }
    });
    
    // Remove completed animations
    completedAnimations.forEach(id => {
      updatedAnimations.delete(id);
    });
    
    setActiveAnimations(updatedAnimations);
    
    // Continue animation loop if there are active animations
    if (updatedAnimations.size > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [activeAnimations, calculateSpringForce, reducedMotionMode]);

  // Start animation loop
  useEffect(() => {
    if (activeAnimations.size > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [activeAnimations, animate]);

  // Core spring animation function
  const animateSpring = useCallback((
    element: HTMLElement,
    property: string,
    to: number,
    config: Partial<SpringConfig> = {},
    onComplete?: () => void
  ) => {
    const springConfig = { ...SPRING_PRESETS.responsive, ...config };
    const elementId = element.getAttribute('data-animation-id') || 
                     element.getAttribute('id') || 
                     Math.random().toString(36).substr(2, 9);
    
    if (!element.getAttribute('data-animation-id')) {
      element.setAttribute('data-animation-id', elementId);
    }
    
    // Get current value
    let currentValue = 0;
    const computedStyle = window.getComputedStyle(element);
    
    switch (property) {
      case 'scale':
        const transform = computedStyle.transform;
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        currentValue = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        break;
      case 'translateY':
        const translateMatch = computedStyle.transform.match(/translateY\(([^)]+)px\)/);
        currentValue = translateMatch ? parseFloat(translateMatch[1]) : 0;
        break;
      case 'opacity':
        currentValue = parseFloat(computedStyle.opacity) || 1;
        break;
      case 'rotation':
        const rotateMatch = computedStyle.transform.match(/rotate\(([^)]+)deg\)/);
        currentValue = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
        break;
      default:
        currentValue = parseFloat(computedStyle.getPropertyValue(property)) || 0;
    }
    
    const animation: SpringAnimation = {
      id: `${elementId}-${property}`,
      element,
      property,
      from: currentValue,
      to,
      current: currentValue,
      velocity: 0,
      config: springConfig,
      startTime: performance.now(),
      onComplete
    };
    
    setActiveAnimations(prev => new Map(prev).set(animation.id, animation));
  }, []);

  // Button press animation with haptic feedback
  const animateButtonPress = useCallback((
    element: HTMLElement, 
    intensity: 'light' | 'medium' | 'heavy' = 'medium'
  ) => {
    const scaleValues = {
      light: 0.98,
      medium: 0.95,
      heavy: 0.92
    };
    
    const configs = {
      light: SPRING_PRESETS.gentle,
      medium: SPRING_PRESETS.responsive,
      heavy: SPRING_PRESETS.bouncy
    };
    
    // Add press effect
    element.style.transition = 'none';
    animateSpring(element, 'scale', scaleValues[intensity], configs[intensity], () => {
      // Return to normal
      setTimeout(() => {
        animateSpring(element, 'scale', 1, configs[intensity]);
      }, 50);
    });
    
    // Add subtle glow
    const glowColor = currentPalette.primary + '40'; // 25% opacity
    element.style.boxShadow = `0 0 20px ${glowColor}`;
    
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 200);
    
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      const vibrationPattern = {
        light: [5],
        medium: [10],
        heavy: [15]
      };
      navigator.vibrate(vibrationPattern[intensity]);
    }
  }, [animateSpring, currentPalette.primary]);

  // Loading state animations
  const animateLoading = useCallback((
    element: HTMLElement,
    type: 'spinner' | 'pulse' | 'breathe'
  ) => {
    const loadingId = `loading-${element.getAttribute('data-animation-id') || Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case 'spinner':
        let rotation = 0;
        const spinAnimation = () => {
          rotation += 360;
          animateSpring(element, 'rotation', rotation, SPRING_PRESETS.gentle, () => {
            if (element.getAttribute('data-loading') === 'true') {
              spinAnimation();
            }
          });
        };
        element.setAttribute('data-loading', 'true');
        spinAnimation();
        break;
        
      case 'pulse':
        const pulseAnimation = () => {
          animateSpring(element, 'scale', 1.1, SPRING_PRESETS.gentle, () => {
            animateSpring(element, 'scale', 1, SPRING_PRESETS.gentle, () => {
              if (element.getAttribute('data-loading') === 'true') {
                pulseAnimation();
              }
            });
          });
        };
        element.setAttribute('data-loading', 'true');
        pulseAnimation();
        break;
        
      case 'breathe':
        const breatheAnimation = () => {
          animateSpring(element, 'opacity', 0.5, SPRING_PRESETS.gentle, () => {
            animateSpring(element, 'opacity', 1, SPRING_PRESETS.gentle, () => {
              if (element.getAttribute('data-loading') === 'true') {
                breatheAnimation();
              }
            });
          });
        };
        element.setAttribute('data-loading', 'true');
        breatheAnimation();
        break;
    }
  }, [animateSpring]);

  // Focus glow animation
  const animateFocusGlow = useCallback((element: HTMLElement, color?: string) => {
    const glowColor = color || currentPalette.primary;
    
    // Create glow effect
    element.style.outline = 'none';
    element.style.transition = 'box-shadow 0.2s ease-out';
    element.style.boxShadow = `0 0 0 3px ${glowColor}40, 0 0 20px ${glowColor}20`;
    
    // Animate glow intensity
    animateSpring(element, 'scale', 1.02, SPRING_PRESETS.gentle);
    
    // Remove glow on blur
    const removeGlow = () => {
      element.style.boxShadow = '';
      animateSpring(element, 'scale', 1, SPRING_PRESETS.gentle);
      element.removeEventListener('blur', removeGlow);
    };
    
    element.addEventListener('blur', removeGlow);
  }, [animateSpring, currentPalette.primary]);

  // Success animation
  const animateSuccess = useCallback((element: HTMLElement) => {
    const successColor = currentPalette.semantic.success;
    
    // Scale up with green glow
    animateSpring(element, 'scale', 1.1, SPRING_PRESETS.bouncy, () => {
      // Return to normal
      animateSpring(element, 'scale', 1, SPRING_PRESETS.gentle);
    });
    
    // Add success glow
    element.style.boxShadow = `0 0 30px ${successColor}60`;
    element.style.borderColor = successColor;
    
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.borderColor = '';
    }, 1000);
  }, [animateSpring, currentPalette.semantic.success]);

  // Error animation
  const animateError = useCallback((element: HTMLElement) => {
    const errorColor = currentPalette.semantic.error;
    
    // Shake animation
    const shakeSequence = [0, -10, 10, -8, 8, -5, 5, 0];
    let shakeIndex = 0;
    
    const shakeStep = () => {
      if (shakeIndex < shakeSequence.length) {
        animateSpring(element, 'translateY', shakeSequence[shakeIndex], SPRING_PRESETS.snappy, () => {
          shakeIndex++;
          shakeStep();
        });
      }
    };
    
    shakeStep();
    
    // Add error glow
    element.style.boxShadow = `0 0 30px ${errorColor}60`;
    element.style.borderColor = errorColor;
    
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.borderColor = '';
    }, 1000);
  }, [animateSpring, currentPalette.semantic.error]);

  // Hover animations
  const animateHover = useCallback((element: HTMLElement, type: 'lift' | 'glow' | 'scale') => {
    switch (type) {
      case 'lift':
        animateSpring(element, 'translateY', -5, SPRING_PRESETS.responsive);
        element.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        break;
        
      case 'glow':
        element.style.boxShadow = `0 0 20px ${currentPalette.primary}40`;
        break;
        
      case 'scale':
        animateSpring(element, 'scale', 1.05, SPRING_PRESETS.responsive);
        break;
    }
    
    // Remove hover effect
    const removeHover = () => {
      switch (type) {
        case 'lift':
          animateSpring(element, 'translateY', 0, SPRING_PRESETS.responsive);
          element.style.boxShadow = '';
          break;
          
        case 'glow':
          element.style.boxShadow = '';
          break;
          
        case 'scale':
          animateSpring(element, 'scale', 1, SPRING_PRESETS.responsive);
          break;
      }
      element.removeEventListener('mouseleave', removeHover);
    };
    
    element.addEventListener('mouseleave', removeHover);
  }, [animateSpring, currentPalette.primary]);

  // Cancel animation
  const cancelAnimation = useCallback((element: HTMLElement) => {
    const elementId = element.getAttribute('data-animation-id');
    if (elementId) {
      setActiveAnimations(prev => {
        const updated = new Map(prev);
        // Remove all animations for this element
        Array.from(updated.keys()).forEach(key => {
          if (key.startsWith(elementId)) {
            updated.delete(key);
          }
        });
        return updated;
      });
    }
    
    // Stop loading animations
    element.removeAttribute('data-loading');
  }, []);

  // Check if element is animating
  const isAnimating = useCallback((element: HTMLElement): boolean => {
    const elementId = element.getAttribute('data-animation-id');
    if (!elementId) return false;
    
    return Array.from(activeAnimations.keys()).some(key => key.startsWith(elementId));
  }, [activeAnimations]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const memory = (performance as any).memory;
    return {
      activeAnimations: activeAnimations.size,
      frameRate,
      memoryUsage: memory ? memory.usedJSHeapSize / 1048576 : 0
    };
  }, [activeAnimations.size, frameRate]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryUsage(memory.usedJSHeapSize / 1048576);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value: MicroInteractionContextType = {
    animateSpring,
    animateButtonPress,
    animateLoading,
    animateFocusGlow,
    animateSuccess,
    animateError,
    animateHover,
    cancelAnimation,
    isAnimating,
    getPerformanceMetrics
  };

  return (
    <MicroInteractionContext.Provider value={value}>
      {children}
    </MicroInteractionContext.Provider>
  );
};

export const useMicroInteractions = () => {
  const context = useContext(MicroInteractionContext);
  if (!context) {
    throw new Error('useMicroInteractions must be used within a MicroInteractionProvider');
  }
  return context;
};

export { SPRING_PRESETS };
export default MicroInteractionProvider;