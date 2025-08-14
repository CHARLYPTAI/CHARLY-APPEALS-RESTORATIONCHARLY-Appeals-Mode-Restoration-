/**
 * 🍎 APPLE POLISH - Ultra-lightweight animation library (<8KB)
 * 
 * Features:
 * - CSS-first animations with GPU acceleration
 * - Device-aware performance scaling
 * - Zero dependencies
 * - TypeScript support
 * - Sub-8KB bundle size
 */

// Device detection for performance scaling
const getDeviceCapabilities = () => {
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
  const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  return {
    isLowEnd: memory <= 2 || hardwareConcurrency <= 2,
    isSlowNetwork: connection && connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType),
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
};

// Animation configuration
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  iterationCount?: number | 'infinite';
}

// CSS animation keyframes registry
const keyframeRegistry = new Map<string, string>();

// Register CSS keyframes dynamically
const registerKeyframes = (name: string, keyframes: string) => {
  if (keyframeRegistry.has(name)) return;
  
  const style = document.createElement('style');
  style.textContent = `@keyframes ${name} { ${keyframes} }`;
  document.head.appendChild(style);
  keyframeRegistry.set(name, keyframes);
};

// Core animation primitives
export const ApplePolish = {
  // Fade animations
  fadeIn: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-fade-in', `
      from { opacity: 0; }
      to { opacity: 1; }
    `);
    
    return animate(element, 'apple-fade-in', {
      duration: 300,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ...config
    });
  },

  fadeOut: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-fade-out', `
      from { opacity: 1; }
      to { opacity: 0; }
    `);
    
    return animate(element, 'apple-fade-out', {
      duration: 200,
      easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      ...config
    });
  },

  // Slide animations with GPU acceleration
  slideInUp: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-slide-in-up', `
      from { 
        transform: translate3d(0, 100%, 0);
        opacity: 0;
      }
      to { 
        transform: translate3d(0, 0, 0);
        opacity: 1;
      }
    `);
    
    return animate(element, 'apple-slide-in-up', {
      duration: 400,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ...config
    });
  },

  slideOutDown: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-slide-out-down', `
      from { 
        transform: translate3d(0, 0, 0);
        opacity: 1;
      }
      to { 
        transform: translate3d(0, 100%, 0);
        opacity: 0;
      }
    `);
    
    return animate(element, 'apple-slide-out-down', {
      duration: 300,
      easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      ...config
    });
  },

  // Scale animations
  scaleIn: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-scale-in', `
      from { 
        transform: translate3d(-50%, -50%, 0) scale3d(0.8, 0.8, 1);
        opacity: 0;
      }
      to { 
        transform: translate3d(-50%, -50%, 0) scale3d(1, 1, 1);
        opacity: 1;
      }
    `);
    
    return animate(element, 'apple-scale-in', {
      duration: 350,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      ...config
    });
  },

  // Apple-style spring animation
  spring: (element: HTMLElement, config: AnimationConfig = {}) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-spring', `
      0% { transform: scale3d(1, 1, 1); }
      10% { transform: scale3d(0.9, 0.9, 1); }
      20% { transform: scale3d(1.1, 1.1, 1); }
      30% { transform: scale3d(0.95, 0.95, 1); }
      40% { transform: scale3d(1.05, 1.05, 1); }
      50% { transform: scale3d(0.98, 0.98, 1); }
      60% { transform: scale3d(1.02, 1.02, 1); }
      70% { transform: scale3d(0.99, 0.99, 1); }
      80% { transform: scale3d(1.01, 1.01, 1); }
      90% { transform: scale3d(0.995, 0.995, 1); }
      100% { transform: scale3d(1, 1, 1); }
    `);
    
    return animate(element, 'apple-spring', {
      duration: 600,
      easing: 'linear',
      ...config
    });
  },

  // Utility: Remove all animations
  stopAll: (element: HTMLElement) => {
    element.style.animation = 'none';
    element.style.transform = '';
    element.style.opacity = '';
  }
};

// Core animation engine
const animate = (
  element: HTMLElement, 
  animationName: string, 
  config: AnimationConfig
): Promise<void> => {
  return new Promise((resolve) => {
    const {
      duration = 300,
      easing = 'ease',
      delay = 0,
      fillMode = 'forwards',
      direction = 'normal',
      iterationCount = 1
    } = config;

    // Apply animation
    element.style.animation = `${animationName} ${duration}ms ${easing} ${delay}ms ${iterationCount} ${direction} ${fillMode}`;
    
    // Clean up after animation
    const cleanup = () => {
      element.removeEventListener('animationend', cleanup);
      element.removeEventListener('animationcancel', cleanup);
      resolve();
    };
    
    element.addEventListener('animationend', cleanup);
    element.addEventListener('animationcancel', cleanup);
    
    // Fallback timeout
    setTimeout(cleanup, duration + delay + 100);
  });
};

// React hook for animations
export const useApplePolish = () => {
  const capabilities = getDeviceCapabilities();
  
  return {
    ...ApplePolish,
    capabilities,
    canAnimate: !capabilities.prefersReducedMotion && !capabilities.isLowEnd
  };
};

// Gesture-based animations for mobile
export const GestureAnimations = {
  swipeLeft: (element: HTMLElement) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-swipe-left', `
      to { transform: translate3d(-100%, 0, 0); opacity: 0; }
    `);
    
    return animate(element, 'apple-swipe-left', {
      duration: 250,
      easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
    });
  },
  
  swipeRight: (element: HTMLElement) => {
    const capabilities = getDeviceCapabilities();
    if (capabilities.prefersReducedMotion || capabilities.isLowEnd) return Promise.resolve();
    
    registerKeyframes('apple-swipe-right', `
      to { transform: translate3d(100%, 0, 0); opacity: 0; }
    `);
    
    return animate(element, 'apple-swipe-right', {
      duration: 250,
      easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)'
    });
  }
};

export default ApplePolish;