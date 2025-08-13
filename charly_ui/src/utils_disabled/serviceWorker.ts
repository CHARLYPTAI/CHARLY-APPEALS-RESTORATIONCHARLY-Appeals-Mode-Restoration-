// Service Worker registration and management for Supernova 2B

interface ServiceWorkerAPI {
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  clearCache: (cacheName?: string) => Promise<void>;
  cacheReport: (reportData: Record<string, unknown>) => Promise<void>;
  getCacheStats: () => Promise<Record<string, unknown>>;
  isSupported: () => boolean;
}

class ServiceWorkerManager implements ServiceWorkerAPI {
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateAvailable = false;

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('[SW] Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.isUpdateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      return this.registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[SW] Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('[SW] Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      
      // Skip waiting and reload
      if (this.registration.waiting) {
        this.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('[SW] Service Worker update failed:', error);
      throw error;
    }
  }

  async clearCache(cacheName?: string): Promise<void> {
    this.postMessage({ 
      type: 'CLEAR_CACHE', 
      payload: { cacheName } 
    });
  }

  async cacheReport(reportData: Record<string, unknown>): Promise<void> {
    this.postMessage({
      type: 'CACHE_REPORT',
      payload: reportData
    });
  }

  async getCacheStats(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve(event.data.stats);
        } else {
          reject(new Error('Unexpected response'));
        }
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATS' },
          { transfer: [channel.port2] }
        );
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Cache stats request timeout'));
      }, 5000);
    });
  }

  private postMessage(message: Record<string, unknown>, ports?: MessagePort[]): void {
    if (navigator.serviceWorker.controller) {
      if (ports) {
        navigator.serviceWorker.controller.postMessage(message, { transfer: ports });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
      }
    }
  }

  private handleMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'UPDATE_AVAILABLE':
        this.notifyUpdateAvailable();
        break;
      case 'CACHE_UPDATED':
        console.log('[SW] Cache updated:', payload);
        break;
      default:
        console.log('[SW] Unknown message:', type, payload);
    }
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { 
        updateAvailable: true,
        message: 'A new version of CHARLY Supernova 2B is available!'
      }
    }));
  }

  getUpdateStatus(): boolean {
    return this.isUpdateAvailable;
  }
}

// Singleton instance
export const serviceWorker = new ServiceWorkerManager();

import { useState, useEffect, useCallback } from 'react';

// React hook for Service Worker integration
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheStats, setCacheStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Register service worker
    serviceWorker.register().then((registration) => {
      setIsRegistered(!!registration);
    });

    // Listen for update notifications
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const updateApp = useCallback(async () => {
    try {
      await serviceWorker.update();
      setUpdateAvailable(false);
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  }, []);

  const clearCache = useCallback(async (cacheName?: string) => {
    try {
      await serviceWorker.clearCache(cacheName);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const refreshCacheStats = useCallback(async () => {
    try {
      const stats = await serviceWorker.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  }, []);

  return {
    isRegistered,
    updateAvailable,
    cacheStats,
    updateApp,
    clearCache,
    refreshCacheStats,
    isSupported: serviceWorker.isSupported(),
  };
}

// Helper function to check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

// Helper function to prompt user to install PWA
export function promptInstall(): Promise<boolean> {
  return new Promise((resolve) => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    interface BeforeInstallPromptEvent extends Event {
      prompt(): Promise<void>;
      userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    });

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        resolve(choiceResult.outcome === 'accepted');
        deferredPrompt = null;
      });
    } else {
      resolve(false);
    }
  });
}