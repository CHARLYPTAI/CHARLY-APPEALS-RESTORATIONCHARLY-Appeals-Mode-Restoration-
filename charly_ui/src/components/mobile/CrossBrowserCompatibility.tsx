/**
 * CHARLY 2.0 - Cross-Browser Compatibility
 * Ensures gesture functionality works across all browsers
 * Task 21: Revolutionary Gesture-Based Navigation - Browser Support
 */

import React, { useEffect, useState, useRef } from 'react';

interface BrowserSupport {
  touchEvents: boolean;
  pointerEvents: boolean;
  gestureEvents: boolean;
  vibrationAPI: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  webAudio: boolean;
  performanceObserver: boolean;
  intersectionObserver: boolean;
  ResizeObserver: boolean;
  requestIdleCallback: boolean;
  visualViewport: boolean;
}

interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  isMobile: boolean;
  isTouch: boolean;
  support: BrowserSupport;
}

interface CrossBrowserCompatibilityProps {
  children: React.ReactNode;
  showCompatibilityWarnings?: boolean;
}

export const CrossBrowserCompatibility: React.FC<CrossBrowserCompatibilityProps> = ({
  children,
  showCompatibilityWarnings = false
}) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const polyfillsLoadedRef = useRef(false);

  // Detect browser capabilities
  useEffect(() => {
    const detectBrowser = (): BrowserInfo => {
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      
      // Browser detection
      let name = 'Unknown';
      let version = 'Unknown';
      
      if (ua.includes('Chrome')) {
        name = 'Chrome';
        version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        name = 'Safari';
        version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.includes('Firefox')) {
        name = 'Firefox';
        version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.includes('Edge')) {
        name = 'Edge';
        version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.includes('MSIE') || ua.includes('Trident')) {
        name = 'Internet Explorer';
        version = ua.match(/(?:MSIE |rv:)(\d+)/)?.[1] || 'Unknown';
      }

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Feature detection
      const support: BrowserSupport = {
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
      };

      return {
        name,
        version,
        platform,
        isMobile,
        isTouch,
        support
      };
    };

    const info = detectBrowser();
    setBrowserInfo(info);

    // Check minimum requirements
    const requiredFeatures = [
      'touchEvents',
      'intersectionObserver'
    ];
    
    const hasRequiredFeatures = requiredFeatures.every(feature => 
      info.support[feature as keyof BrowserSupport]
    );
    
    setIsSupported(hasRequiredFeatures);

    // Log browser info for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Browser Detection:', info);
    }
  }, []);

  // Load polyfills for missing features
  useEffect(() => {
    if (!browserInfo || polyfillsLoadedRef.current) return;

    const loadPolyfills = async () => {
      const polyfills = [];

      // Intersection Observer polyfill
      if (!browserInfo.support.intersectionObserver) {
        polyfills.push(
          import('intersection-observer').then(() => {
            console.log('Intersection Observer polyfill loaded');
          })
        );
      }

      // ResizeObserver polyfill
      if (!browserInfo.support.ResizeObserver) {
        polyfills.push(
          import('resize-observer-polyfill').then((module) => {
            (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = module.default;
            console.log('ResizeObserver polyfill loaded');
          })
        );
      }

      // Request idle callback polyfill
      if (!browserInfo.support.requestIdleCallback) {
        (window as unknown as { requestIdleCallback: typeof requestIdleCallback }).requestIdleCallback = (callback: () => void) => {
          return setTimeout(callback, 1);
        };
        (window as unknown as { cancelIdleCallback: typeof cancelIdleCallback }).cancelIdleCallback = (id: number) => {
          clearTimeout(id);
        };
      }

      // Visual viewport polyfill (basic implementation)
      if (!browserInfo.support.visualViewport) {
        (window as unknown as { visualViewport: typeof visualViewport }).visualViewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          scale: 1,
          offsetLeft: 0,
          offsetTop: 0,
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      }

      try {
        await Promise.all(polyfills);
        polyfillsLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load polyfills:', error);
      }
    };

    loadPolyfills();
  }, [browserInfo]);

  // Add browser-specific CSS classes
  useEffect(() => {
    if (!browserInfo) return;

    const classes = [
      `browser-${browserInfo.name.toLowerCase()}`,
      `browser-version-${browserInfo.version}`,
      `platform-${browserInfo.platform.toLowerCase()}`,
      browserInfo.isMobile ? 'mobile' : 'desktop',
      browserInfo.isTouch ? 'touch' : 'no-touch'
    ];

    classes.forEach(className => {
      document.body.classList.add(className);
    });

    return () => {
      classes.forEach(className => {
        document.body.classList.remove(className);
      });
    };
  }, [browserInfo]);

  // Handle iOS specific issues
  useEffect(() => {
    if (!browserInfo?.isMobile) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Fix iOS viewport issues
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);

      // Fix iOS touch event issues
      document.addEventListener('touchstart', () => {}, { passive: false });
      
      // Fix iOS scroll momentum
      document.body.style.webkitOverflowScrolling = 'touch';

      return () => {
        window.removeEventListener('resize', setViewportHeight);
      };
    }
  }, [browserInfo]);

  // Handle Android specific issues
  useEffect(() => {
    if (!browserInfo?.isMobile) return;

    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isAndroid) {
      // Fix Android viewport issues
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }

      // Fix Android touch delay
      let touchStartTime = 0;
      const handleTouchStart = () => {
        touchStartTime = Date.now();
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        const touchEndTime = Date.now();
        if (touchEndTime - touchStartTime < 150) {
          // Fast tap - ensure it's processed quickly
          e.preventDefault();
          const touch = e.changedTouches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          if (element) {
            element.click();
          }
        }
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [browserInfo]);

  // Browser-specific event handling
  useEffect(() => {
    if (!browserInfo) return;

    // Firefox specific fixes
    if (browserInfo.name === 'Firefox') {
      // Fix Firefox touch event issues
      const style = document.createElement('style');
      style.textContent = `
        * {
          touch-action: manipulation;
        }
        .firefox-touch-fix {
          -moz-user-select: none;
          user-select: none;
        }
      `;
      document.head.appendChild(style);

      document.body.classList.add('firefox-touch-fix');

      return () => {
        document.head.removeChild(style);
        document.body.classList.remove('firefox-touch-fix');
      };
    }

    // Safari specific fixes
    if (browserInfo.name === 'Safari') {
      // Fix Safari touch event performance
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
        }
        .safari-touch-fix {
          -webkit-overflow-scrolling: touch;
        }
      `;
      document.head.appendChild(style);

      document.body.classList.add('safari-touch-fix');

      return () => {
        document.head.removeChild(style);
        document.body.classList.remove('safari-touch-fix');
      };
    }

    // Edge specific fixes
    if (browserInfo.name === 'Edge') {
      // Fix Edge touch event compatibility
      const style = document.createElement('style');
      style.textContent = `
        * {
          -ms-touch-action: manipulation;
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [browserInfo]);

  // Show compatibility warning if needed
  const CompatibilityWarning = () => {
    if (!showCompatibilityWarnings || !browserInfo || isSupported) return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-4 text-center">
        <div className="font-medium">
          Limited Browser Support Detected
        </div>
        <div className="text-sm">
          {browserInfo.name} {browserInfo.version} may not support all gesture features.
          For the best experience, please use a modern browser.
        </div>
      </div>
    );
  };

  if (!browserInfo) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <CompatibilityWarning />
      {children}
    </>
  );
};

export default CrossBrowserCompatibility;