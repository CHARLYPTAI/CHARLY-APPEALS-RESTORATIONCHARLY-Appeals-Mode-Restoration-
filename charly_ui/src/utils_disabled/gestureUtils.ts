/**
 * CHARLY 2.0 - Gesture Utilities
 * Utility functions for gesture handling
 */

// Cross-browser event normalizer
export const normalizeEvent = (event: TouchEvent | PointerEvent | MouseEvent) => {
  const touches = 'touches' in event ? Array.from(event.touches) : 
                  'pointerId' in event ? [event] : [event];
  
  return {
    type: event.type,
    touches: touches.map(touch => ({
      clientX: 'clientX' in touch ? touch.clientX : 0,
      clientY: 'clientY' in touch ? touch.clientY : 0,
      pageX: 'pageX' in touch ? touch.pageX : 0,
      pageY: 'pageY' in touch ? touch.pageY : 0,
      force: 'force' in touch ? touch.force : 0.5,
      radiusX: 'radiusX' in touch ? touch.radiusX : 10,
      radiusY: 'radiusY' in touch ? touch.radiusY : 10,
      identifier: 'identifier' in touch ? touch.identifier : 0
    })),
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation(),
    target: event.target,
    currentTarget: event.currentTarget,
    timeStamp: event.timeStamp
  };
};

// Performance measurement utility
export const measurePerformance = (name: string, callback: () => void) => {
  const startTime = performance.now();
  performance.mark(`${name}-start`);
  
  callback();
  
  const endTime = performance.now();
  performance.mark(`${name}-end`);
  performance.measure(`gesture-${name}`, `${name}-start`, `${name}-end`);
  
  return endTime - startTime;
};

// Gesture priority mapping
export const getGesturePriority = (gestureType: string): number => {
  switch (gestureType) {
    case 'tap':
    case 'touch':
      return 10; // Highest priority
    case 'swipe':
    case 'pan':
      return 8;
    case 'pinch':
    case 'zoom':
      return 7;
    case 'long-press':
      return 6;
    case 'double-tap':
      return 5;
    default:
      return 3; // Lowest priority
  }
};

// Browser capabilities detection
export const detectBrowserCapabilities = () => ({
  touchEvents: 'ontouchstart' in window,
  pointerEvents: 'onpointerdown' in window,
  gestureEvents: 'ongesturestart' in window,
  vibrationAPI: 'vibrate' in navigator,
  speechSynthesis: 'speechSynthesis' in window,
  speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
  performanceObserver: 'PerformanceObserver' in window,
  intersectionObserver: 'IntersectionObserver' in window,
  ResizeObserver: 'ResizeObserver' in window,
  requestIdleCallback: 'requestIdleCallback' in window,
  visualViewport: 'visualViewport' in window
});

// Haptic feedback patterns
export const hapticPatterns = {
  light: {
    vibration: [10],
    visual: { color: '#3B82F6', size: 20, duration: 200, type: 'pulse' as const },
    audio: { frequency: 800, duration: 50, type: 'sine' as const }
  },
  medium: {
    vibration: [20],
    visual: { color: '#10B981', size: 30, duration: 300, type: 'ripple' as const },
    audio: { frequency: 600, duration: 75, type: 'sine' as const }
  },
  heavy: {
    vibration: [30],
    visual: { color: '#F59E0B', size: 40, duration: 400, type: 'glow' as const },
    audio: { frequency: 400, duration: 100, type: 'sine' as const }
  },
  selection: {
    vibration: [5],
    visual: { color: '#8B5CF6', size: 15, duration: 150, type: 'flash' as const },
    audio: { frequency: 1000, duration: 25, type: 'sine' as const }
  }
};