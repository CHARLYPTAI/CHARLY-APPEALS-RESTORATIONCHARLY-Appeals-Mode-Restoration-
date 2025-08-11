/**
 * 🍎 CHARLY 2.0 - SERVICE WORKER
 * 
 * Advanced service worker with intelligent caching, offline support,
 * and background sync capabilities.
 */

const CACHE_VERSION = 'charly-v2-1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/logo.svg'
];

// API endpoints to cache with network-first strategy
const API_PATTERNS = [
  /\/api\/properties/,
  /\/api\/jurisdictions/,
  /\/api\/templates/,
  /\/api\/user\/profile/
];

// Assets to never cache
const EXCLUDE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/payments/,
  /hot-update/,
  /sockjs-node/
];

// ============================================================================
// INSTALL EVENT - CACHE STATIC ASSETS
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT - CLEANUP OLD CACHES
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('charly-') && 
                     !cacheName.startsWith(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// ============================================================================
// FETCH EVENT - INTELLIGENT CACHING STRATEGIES
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip excluded patterns
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }
  
  // Determine strategy based on request type
  if (request.destination === 'document' || url.pathname === '/') {
    // HTML - Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    // API - Network first with cache fallback and background update
    event.respondWith(networkFirstWithBackgroundUpdate(request));
  } else if (request.destination === 'image' || 
             request.destination === 'font' ||
             /\.(js|css)$/.test(url.pathname)) {
    // Static assets - Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Everything else - Network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    fetchAndCache(request, STATIC_CACHE);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function networkFirstWithBackgroundUpdate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before consuming
      const responseToCache = response.clone();
      
      // Update cache in background
      cache.put(request, responseToCache);
      
      // If we have a cached version, check if data changed
      if (cached) {
        compareAndNotifyUpdate(cached, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    if (cached) {
      // Add warning header to indicate stale data
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', cached.headers.get('date') || '');
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail - this is background update
  }
}

async function compareAndNotifyUpdate(oldResponse, newResponse) {
  try {
    const oldData = await oldResponse.json();
    const newData = await newResponse.json();
    
    if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
      // Notify all clients about data update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DATA_UPDATED',
          url: oldResponse.url,
          timestamp: Date.now()
        });
      });
    }
  } catch (error) {
    // Silent fail - comparison is best effort
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-appeals') {
    event.waitUntil(syncAppeals());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAppeals() {
  try {
    // Get pending appeals from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_appeals', 'readonly');
    const store = tx.objectStore('pending_appeals');
    const appeals = await store.getAll();
    
    // Submit each appeal
    for (const appeal of appeals) {
      try {
        const response = await fetch('/api/appeals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appeal)
        });
        
        if (response.ok) {
          // Remove from pending
          const deleteTx = db.transaction('pending_appeals', 'readwrite');
          await deleteTx.objectStore('pending_appeals').delete(appeal.id);
          
          // Notify client
          notifyClients({
            type: 'SYNC_SUCCESS',
            data: { appealId: appeal.id }
          });
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync appeal:', appeal.id);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    // Get analytics data from IndexedDB
    const db = await openDB();
    const tx = db.transaction('analytics', 'readonly');
    const store = tx.objectStore('analytics');
    const events = await store.getAll();
    
    if (events.length > 0) {
      // Batch submit analytics
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
      
      // Clear submitted events
      const clearTx = db.transaction('analytics', 'readwrite');
      await clearTx.objectStore('analytics').clear();
    }
  } catch (error) {
    console.error('[Service Worker] Analytics sync failed:', error);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'CHARLY Notification', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'You have a new update',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'charly-notification',
    data: data,
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CHARLY', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if needed
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('charly-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_appeals')) {
        db.createObjectStore('pending_appeals', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { autoIncrement: true });
      }
    };
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

// Prune caches periodically
setInterval(async () => {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Remove old entries (older than 7 days)
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date && new Date(date).getTime() < cutoff) {
          await cache.delete(request);
        }
      }
    }
  }
}, 24 * 60 * 60 * 1000); // Daily

console.log('[Service Worker] Loaded successfully');