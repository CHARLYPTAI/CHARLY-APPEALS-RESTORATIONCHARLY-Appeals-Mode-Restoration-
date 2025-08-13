/**
 * Cross-Browser Compatibility Provider Component
 * Apple CTO Task 25: Cross-browser compatibility testing and fixes
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { browserCompatibility } from '../utils/browserCompatibility';

interface CompatibilityContextType {
  isSupported: boolean;
  browserInfo: {
    name: string;
    version: string;
    engine: string;
    isSupported: boolean;
    requiredPolyfills: string[];
  };
  featureSupport: Record<string, boolean>;
  polyfillsLoaded: boolean;
  unsupportedFeatures: string[];
}

const CompatibilityContext = createContext<CompatibilityContextType | undefined>(undefined);

interface CrossBrowserCompatibilityProps {
  children: ReactNode;
}

export function CrossBrowserCompatibility({ children }: CrossBrowserCompatibilityProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState(browserCompatibility.getBrowserInfo());
  const [featureSupport, setFeatureSupport] = useState(browserCompatibility.getFeatureSupport());
  const [polyfillsLoaded, setPolyfillsLoaded] = useState(false);
  const [unsupportedFeatures, setUnsupportedFeatures] = useState<string[]>([]);

  useEffect(() => {
    const initializeCompatibility = async () => {
      try {
        // Load required polyfills
        await browserCompatibility.loadPolyfills();
        
        // Update state
        setIsSupported(browserCompatibility.isBrowserSupported());
        setBrowserInfo(browserCompatibility.getBrowserInfo());
        setFeatureSupport(browserCompatibility.getFeatureSupport());
        setUnsupportedFeatures(browserCompatibility.getUnsupportedFeatures());
        setPolyfillsLoaded(true);
        
        // Log compatibility report in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Browser Compatibility Report:', browserCompatibility.generateCompatibilityReport());
        }
      } catch (error) {
        console.error('Failed to initialize browser compatibility:', error);
      }
    };

    initializeCompatibility();
  }, []);

  const contextValue: CompatibilityContextType = {
    isSupported,
    browserInfo,
    featureSupport,
    polyfillsLoaded,
    unsupportedFeatures
  };

  return (
    <CompatibilityContext.Provider value={contextValue}>
      {children}
    </CompatibilityContext.Provider>
  );
}

export function useCompatibility() {
  const context = useContext(CompatibilityContext);
  if (context === undefined) {
    throw new Error('useCompatibility must be used within a CrossBrowserCompatibility provider');
  }
  return context;
}

// Utility hook for conditional rendering based on feature support
export function useFeatureSupport(feature: string): boolean {
  const { featureSupport } = useCompatibility();
  return featureSupport[feature] ?? false;
}

// Utility hook for browser-specific styling
export function useBrowserStyles() {
  const { browserInfo } = useCompatibility();
  
  return {
    isChrome: browserInfo.name === 'Chrome',
    isSafari: browserInfo.name === 'Safari',
    isFirefox: browserInfo.name === 'Firefox',
    isEdge: browserInfo.name === 'Edge',
    getBrowserClass: () => `browser-${browserInfo.name.toLowerCase()}`,
    getEngineClass: () => `engine-${browserInfo.engine.toLowerCase()}`,
  };
}

// Compatibility warning component
export function CompatibilityWarning() {
  const { isSupported, browserInfo, unsupportedFeatures } = useCompatibility();
  
  if (isSupported && unsupportedFeatures.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white p-4 text-sm">
      <div className="max-w-6xl mx-auto">
        {!isSupported && (
          <div className="font-semibold mb-2">
            ⚠️ Browser Compatibility Warning
          </div>
        )}
        
        <div className="space-y-1">
          {!isSupported && (
            <p>
              Your browser ({browserInfo.name} {browserInfo.version}) may not fully support all features.
              Please consider upgrading to a newer version.
            </p>
          )}
          
          {unsupportedFeatures.length > 0 && (
            <p>
              Missing features: {unsupportedFeatures.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}