/**
 * CHARLY 2.0 - Progressive Web App Utilities
 * Advanced PWA features including install prompts, offline detection, and app updates
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface AppUpdateInfo {
  hasUpdate: boolean;
  version?: string;
  notes?: string;
  critical?: boolean;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private updateAvailable = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.initializePWA();
  }

  private initializePWA(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.emit('installable', true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.emit('installed', true);
    });

    // Check if app is already installed/standalone
    if (this.isStandalone()) {
      this.emit('standalone', true);
    }

    // Register service worker
    this.registerServiceWorker();

    // Set up update checking
    this.checkForUpdates();
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        this.serviceWorkerRegistration = registration;

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.emit('updateAvailable', {
                  hasUpdate: true,
                  version: '2.0.1',
                  notes: 'Performance improvements and bug fixes',
                  critical: false
                });
              }
            });
          }
        });

        // Check for immediate updates
        registration.update();

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.emit('installAccepted', choiceResult);
        return true;
      } else {
        this.emit('installDismissed', choiceResult);
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  public getInstallState(): PWAInstallState {
    return {
      canInstall: !!this.deferredPrompt,
      isInstalled: this.isInstalled(),
      isStandalone: this.isStandalone(),
      platform: this.getPlatform()
    };
  }

  public isInstalled(): boolean {
    // Check if app is installed (various methods)
    return (
      this.isStandalone() ||
      navigator.standalone === true || // iOS Safari
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    );
  }

  public isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }

  public getPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public async checkForUpdates(): Promise<AppUpdateInfo> {
    if (!this.serviceWorkerRegistration) {
      return { hasUpdate: false };
    }

    try {
      await this.serviceWorkerRegistration.update();
      
      return {
        hasUpdate: this.updateAvailable,
        version: this.updateAvailable ? '2.0.1' : undefined,
        notes: this.updateAvailable ? 'Performance improvements and bug fixes' : undefined,
        critical: false
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false };
    }
  }

  public async applyUpdate(): Promise<boolean> {
    if (!this.serviceWorkerRegistration || !this.updateAvailable) {
      return false;
    }

    try {
      // Skip waiting and activate new service worker
      if (this.serviceWorkerRegistration.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for controlling change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error applying update:', error);
      return false;
    }
  }

  public async shareContent(shareData: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
    
    // Fallback to clipboard
    if (shareData.url && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        return true;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
      }
    }
    
    return false;
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        this.emit('persistentStorageGranted', granted);
        return granted;
      } catch (error) {
        console.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  public async getStorageUsage(): Promise<{ used: number; quota: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - used;
        
        return { used, quota, available };
      } catch (error) {
        console.error('Error getting storage usage:', error);
      }
    }
    
    return { used: 0, quota: 0, available: 0 };
  }

  public enableNotifications(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        this.emit('notificationPermission', permission);
      });
    }
  }

  public async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      try {
        if (this.serviceWorkerRegistration) {
          await this.serviceWorkerRegistration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [200, 100, 200],
            ...options
          });
        } else {
          new Notification(title, {
            icon: '/icons/icon-192x192.png',
            ...options
          });
        }
        return true;
      } catch (error) {
        console.error('Error showing notification:', error);
        return false;
      }
    }
    
    return false;
  }

  public addToHomeScreen(): void {
    const platform = this.getPlatform();
    
    if (platform === 'ios') {
      this.showIOSInstallInstructions();
    } else if (this.deferredPrompt) {
      this.showInstallPrompt();
    } else {
      this.showGenericInstallInstructions();
    }
  }

  private showIOSInstallInstructions(): void {
    this.emit('showInstallInstructions', {
      platform: 'ios',
      steps: [
        'Tap the Share button in Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install the app'
      ]
    });
  }

  private showGenericInstallInstructions(): void {
    this.emit('showInstallInstructions', {
      platform: 'generic',
      steps: [
        'Open browser menu (⋮)',
        'Look for "Install app" or "Add to Home Screen"',
        'Follow the prompts to install'
      ]
    });
  }

  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// Utility functions
export const detectPWADisplayMode = (): string => {
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
  
  for (const mode of displayModes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      return mode;
    }
  }
  
  return 'browser';
};

export const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
};

export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getDeviceInfo = () => ({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  cookieEnabled: navigator.cookieEnabled,
  onLine: navigator.onLine,
  language: navigator.language,
  languages: navigator.languages,
  hardwareConcurrency: navigator.hardwareConcurrency,
  maxTouchPoints: navigator.maxTouchPoints,
  vendor: navigator.vendor,
  standalone: (navigator as unknown as { standalone?: boolean }).standalone,
  displayMode: detectPWADisplayMode(),
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  }
});

export const registerPWAEventListeners = (callbacks: {
  onInstallable?: () => void;
  onInstalled?: () => void;
  onUpdateAvailable?: (info: AppUpdateInfo) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}): (() => void) => {
  if (callbacks.onInstallable) {
    pwaManager.on('installable', callbacks.onInstallable);
  }
  
  if (callbacks.onInstalled) {
    pwaManager.on('installed', callbacks.onInstalled);
  }
  
  if (callbacks.onUpdateAvailable) {
    pwaManager.on('updateAvailable', callbacks.onUpdateAvailable);
  }
  
  const handleOffline = () => callbacks.onOffline?.();
  const handleOnline = () => callbacks.onOnline?.();
  
  if (callbacks.onOffline) {
    window.addEventListener('offline', handleOffline);
  }
  
  if (callbacks.onOnline) {
    window.addEventListener('online', handleOnline);
  }

  // Return cleanup function
  return () => {
    if (callbacks.onInstallable) {
      pwaManager.off('installable', callbacks.onInstallable);
    }
    if (callbacks.onInstalled) {
      pwaManager.off('installed', callbacks.onInstalled);
    }
    if (callbacks.onUpdateAvailable) {
      pwaManager.off('updateAvailable', callbacks.onUpdateAvailable);
    }
    if (callbacks.onOffline) {
      window.removeEventListener('offline', handleOffline);
    }
    if (callbacks.onOnline) {
      window.removeEventListener('online', handleOnline);
    }
  };
};

// Simple registration function for easy setup
export const registerPWA = (callbacks?: {
  onInstallable?: () => void;
  onInstalled?: () => void;
  onUpdateAvailable?: (info: AppUpdateInfo) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}): (() => void) => {
  // PWA manager initializes automatically in constructor
  
  // Set up default callbacks if none provided
  const defaultCallbacks = {
    onInstallable: () => {
      console.log('[PWA] App is installable');
    },
    onInstalled: () => {
      console.log('[PWA] App installed successfully');
    },
    onUpdateAvailable: (info: AppUpdateInfo) => {
      console.log('[PWA] Update available:', info);
    },
    onOffline: () => {
      console.log('[PWA] App is offline');
    },
    onOnline: () => {
      console.log('[PWA] App is online');
    },
    ...callbacks
  };
  
  return registerPWAEventListeners(defaultCallbacks);
};

export default pwaManager;