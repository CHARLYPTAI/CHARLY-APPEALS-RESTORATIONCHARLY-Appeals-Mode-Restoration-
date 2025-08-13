/**
 * Browser Compatibility Detection and Polyfill System
 * Apple CTO Task 25: Cross-browser compatibility testing and fixes
 */

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
  requiredPolyfills: string[];
}

interface FeatureSupport {
  [key: string]: boolean;
}

export class BrowserCompatibilityManager {
  private static instance: BrowserCompatibilityManager;
  private browserInfo: BrowserInfo;
  private featureSupport: FeatureSupport;
  private polyfillsLoaded: Set<string> = new Set();

  private constructor() {
    this.browserInfo = this.detectBrowser();
    this.featureSupport = this.checkFeatureSupport();
  }

  public static getInstance(): BrowserCompatibilityManager {
    if (!BrowserCompatibilityManager.instance) {
      BrowserCompatibilityManager.instance = new BrowserCompatibilityManager();
    }
    return BrowserCompatibilityManager.instance;
  }

  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const requiredPolyfills: string[] = [];

    // Chrome/Chromium detection
    if (/Chrome\/(\d+)/.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '0';
      const versionNumber = parseInt(version, 10);
      
      return {
        name: 'Chrome',
        version,
        engine: 'Blink',
        isSupported: versionNumber >= 90,
        requiredPolyfills: versionNumber < 90 ? ['intersection-observer', 'resize-observer'] : []
      };
    }

    // Safari detection
    if (/Safari\/(\d+)/.test(userAgent) && !/Chrome/.test(userAgent)) {
      const version = userAgent.match(/Version\/(\d+)/)?.[1] || '0';
      const versionNumber = parseInt(version, 10);
      
      if (versionNumber < 14) {
        requiredPolyfills.push('intersection-observer', 'resize-observer');
      }
      
      return {
        name: 'Safari',
        version,
        engine: 'WebKit',
        isSupported: versionNumber >= 14,
        requiredPolyfills
      };
    }

    // Firefox detection
    if (/Firefox\/(\d+)/.test(userAgent)) {
      const version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '0';
      const versionNumber = parseInt(version, 10);
      
      return {
        name: 'Firefox',
        version,
        engine: 'Gecko',
        isSupported: versionNumber >= 88,
        requiredPolyfills: versionNumber < 88 ? ['intersection-observer', 'resize-observer'] : []
      };
    }

    // Edge detection
    if (/Edg\/(\d+)/.test(userAgent)) {
      const version = userAgent.match(/Edg\/(\d+)/)?.[1] || '0';
      const versionNumber = parseInt(version, 10);
      
      return {
        name: 'Edge',
        version,
        engine: 'Blink',
        isSupported: versionNumber >= 90,
        requiredPolyfills: versionNumber < 90 ? ['intersection-observer', 'resize-observer'] : []
      };
    }

    // Unknown browser
    return {
      name: 'Unknown',
      version: '0',
      engine: 'Unknown',
      isSupported: false,
      requiredPolyfills: ['intersection-observer', 'resize-observer']
    };
  }

  private checkFeatureSupport(): FeatureSupport {
    return {
      // CSS Features
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('--custom', 'property'),
      cssClamp: CSS.supports('width', 'clamp(1rem, 2vw, 3rem)'),
      cssContainerQueries: CSS.supports('container-type', 'inline-size'),
      
      // JavaScript Features
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webGL2: !!document.createElement('canvas').getContext('webgl2'),
      
      // Web APIs
      serviceWorker: 'serviceWorker' in navigator,
      webWorker: 'Worker' in window,
      sharedArrayBuffer: 'SharedArrayBuffer' in window,
      
      // Touch and Input
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      
      // Performance APIs
      performanceObserver: 'PerformanceObserver' in window,
      navigationTiming: 'performance' in window && 'navigation' in performance,
      
      // Color and Display
      colorGamut: window.matchMedia('(color-gamut: p3)').matches,
      highDynamicRange: window.matchMedia('(dynamic-range: high)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      
      // Security
      trustedTypes: 'trustedTypes' in window,
      
      // Modern JavaScript
      dynamicImport: 'noModule' in HTMLScriptElement.prototype,
      modules: 'noModule' in HTMLScriptElement.prototype,
    };
  }

  public async loadPolyfills(): Promise<void> {
    const polyfillsToLoad = this.browserInfo.requiredPolyfills;
    
    for (const polyfill of polyfillsToLoad) {
      if (!this.polyfillsLoaded.has(polyfill)) {
        await this.loadPolyfill(polyfill);
        this.polyfillsLoaded.add(polyfill);
      }
    }
  }

  private async loadPolyfill(polyfill: string): Promise<void> {
    switch (polyfill) {
      case 'intersection-observer':
        if (!this.featureSupport.intersectionObserver) {
          await import('intersection-observer');
        }
        break;
        
      case 'resize-observer':
        if (!this.featureSupport.resizeObserver) {
          await import('resize-observer-polyfill');
        }
        break;
        
      default:
        console.warn(`Unknown polyfill requested: ${polyfill}`);
    }
  }

  public getBrowserInfo(): BrowserInfo {
    return this.browserInfo;
  }

  public getFeatureSupport(): FeatureSupport {
    return this.featureSupport;
  }

  public isBrowserSupported(): boolean {
    return this.browserInfo.isSupported;
  }

  public getUnsupportedFeatures(): string[] {
    return Object.entries(this.featureSupport)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature);
  }

  public addVendorPrefixes(property: string, value: string): Record<string, string> {
    const prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
    const result: Record<string, string> = {};
    
    // Properties that need vendor prefixes
    const needsPrefixes = [
      'transform',
      'transition',
      'animation',
      'user-select',
      'appearance',
      'backdrop-filter',
      'clip-path'
    ];
    
    if (needsPrefixes.includes(property)) {
      prefixes.forEach(prefix => {
        result[`${prefix}${property}`] = value;
      });
    } else {
      result[property] = value;
    }
    
    return result;
  }

  public generateCompatibilityReport(): string {
    const report = {
      browser: this.browserInfo,
      features: this.featureSupport,
      polyfillsLoaded: Array.from(this.polyfillsLoaded),
      unsupportedFeatures: this.getUnsupportedFeatures(),
      recommendations: this.getRecommendations()
    };
    
    return JSON.stringify(report, null, 2);
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.browserInfo.isSupported) {
      recommendations.push(`Please upgrade ${this.browserInfo.name} to a supported version`);
    }
    
    if (!this.featureSupport.intersectionObserver) {
      recommendations.push('Consider using polyfill for Intersection Observer');
    }
    
    if (!this.featureSupport.resizeObserver) {
      recommendations.push('Consider using polyfill for Resize Observer');
    }
    
    if (!this.featureSupport.cssGrid) {
      recommendations.push('CSS Grid not supported - fallback to flexbox');
    }
    
    if (!this.featureSupport.cssCustomProperties) {
      recommendations.push('CSS Custom Properties not supported - use static values');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const browserCompatibility = BrowserCompatibilityManager.getInstance();

// Auto-initialize polyfills on import
browserCompatibility.loadPolyfills().catch(console.error);