/**
 * CHARLY 2.0 - Advanced Service Worker
 * Offline-first caching strategy with intelligent prefetching and background sync
 */

const CACHE_VERSION = 'charly-v2-2025-01-18';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Cache duration settings (in seconds)
const CACHE_DURATIONS = {
  static: 60 * 60 * 24 * 30, // 30 days
  dynamic: 60 * 60 * 24 * 7,  // 7 days
  api: 60 * 60 * 2,           // 2 hours
  images: 60 * 60 * 24 * 14   // 14 days
};

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/properties',
  '/api/analytics',
  '/api/user/profile',
  '/api/dashboard/summary'
];

// Files that should always be fetched from network
const NETWORK_ONLY = [
  '/api/auth',
  '/api/upload',
  '/api/sync'
];

// Background sync tags
const SYNC_TAGS = {
  PROPERTY_UPDATE: 'property-update',
  ANALYTICS_SYNC: 'analytics-sync',
  OFFLINE_ACTIONS: 'offline-actions'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CHARLY 2.0 Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(() => {
        console.log('[SW] API cache initialized');
      }),
      caches.open(DYNAMIC_CACHE).then(() => {
        console.log('[SW] Dynamic cache initialized');
      }),
      caches.open(IMAGE_CACHE).then(() => {
        console.log('[SW] Image cache initialized');
      })
    ])
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating CHARLY 2.0 Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (!url.origin.includes(self.location.origin) && !url.pathname.startsWith('/api/')) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - Cache First
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default - Network First
  event.respondWith(handleDefaultRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this is a network-only endpoint
  if (NETWORK_ONLY.some(endpoint => url.pathname.startsWith(endpoint))) {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for cacheable endpoints
      if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check cache age
      const cacheDate = cachedResponse.headers.get('sw-cache-date');
      if (cacheDate) {
        const ageInSeconds = (Date.now() - new Date(cacheDate).getTime()) / 1000;
        if (ageInSeconds > CACHE_DURATIONS.api) {
          console.log('[SW] Cache expired for:', request.url);
        } else {
          return cachedResponse;
        }
      } else {
        return cachedResponse;
      }
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached data available',
        timestamp: new Date().toISOString(),
        url: request.url
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Determine appropriate cache based on file type
      let cacheName = STATIC_CACHE;
      const url = new URL(request.url);
      
      if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        cacheName = IMAGE_CACHE;
      }
      
      const cache = await caches.open(cacheName);
      
      // Add cache timestamp
      const responseToCache = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-date': new Date().toISOString()
        }
      });
      
      cache.put(request, responseToCache.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    
    // Try to serve offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Default request handler with stale-while-revalidate
async function handleDefaultRequest(request) {
  const url = new URL(request.url);
  
  // For HTML pages, use stale-while-revalidate
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    return handleStaleWhileRevalidate(request);
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache dynamic content
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for default request:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function handleStaleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(error => {
    console.log('[SW] Network update failed:', error);
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update in background
    fetchPromise;
    return cachedResponse;
  }
  
  // No cache, wait for network
  return fetchPromise;
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;
      
    case 'CACHE_REPORT':
      cacheReport(payload);
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', stats });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Clear specific cache
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  console.log('[SW] Cache cleared:', cacheName || 'all');
}

// Cache report data
async function cacheReport(reportData) {
  try {
    const cache = await caches.open(API_CACHE);
    const response = new Response(JSON.stringify(reportData), {
      headers: { 
        'Content-Type': 'application/json',
        'sw-cache-date': new Date().toISOString()
      }
    });
    await cache.put('/api/cached-report', response);
    console.log('[SW] Report cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache report:', error);
  }
}

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return stats;
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.PROPERTY_UPDATE:
      event.waitUntil(syncPropertyUpdates());
      break;
      
    case SYNC_TAGS.ANALYTICS_SYNC:
      event.waitUntil(syncAnalyticsData());
      break;
      
    case SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions());
      break;
      
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Sync property updates
async function syncPropertyUpdates() {
  try {
    const cache = await caches.open(API_CACHE);
    const pendingUpdates = await cache.match('/api/pending-property-updates');
    
    if (pendingUpdates) {
      const updates = await pendingUpdates.json();
      
      for (const update of updates.data) {
        try {
          await fetch('/api/properties/' + update.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update.changes)
          });
          console.log('[SW] Property update synced:', update.id);
        } catch (error) {
          console.error('[SW] Failed to sync property update:', error);
        }
      }
      
      // Clear pending updates
      await cache.delete('/api/pending-property-updates');
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync analytics data
async function syncAnalyticsData() {
  try {
    const cache = await caches.open(API_CACHE);
    const pendingAnalytics = await cache.match('/api/pending-analytics');
    
    if (pendingAnalytics) {
      const analytics = await pendingAnalytics.json();
      
      try {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analytics.data)
        });
        console.log('[SW] Analytics data synced');
        
        // Clear pending analytics
        await cache.delete('/api/pending-analytics');
      } catch (error) {
        console.error('[SW] Failed to sync analytics:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Sync offline actions
async function syncOfflineActions() {
  try {
    const cache = await caches.open(API_CACHE);
    const pendingActions = await cache.match('/api/pending-actions');
    
    if (pendingActions) {
      const actions = await pendingActions.json();
      
      for (const action of actions.data) {
        try {
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
          });
          console.log('[SW] Offline action synced:', action.type);
        } catch (error) {
          console.error('[SW] Failed to sync action:', error);
        }
      }
      
      // Clear pending actions
      await cache.delete('/api/pending-actions');
    }
  } catch (error) {
    console.error('[SW] Offline actions sync failed:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  let title = 'CHARLY 2.0 Notification';
  let body = 'New update available';

  if (event.data) {
    const data = event.data.json();
    title = data.title || title;
    body = data.body || body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification(title, { body, ...options })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Notification already closed
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Clean up expired cache entries
async function cleanExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!cacheName.includes(CACHE_VERSION)) continue;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cacheDate = response?.headers.get('sw-cache-date');
      
      if (cacheDate) {
        const ageInSeconds = (Date.now() - new Date(cacheDate).getTime()) / 1000;
        let maxAge = CACHE_DURATIONS.static;
        
        if (cacheName.includes('api')) maxAge = CACHE_DURATIONS.api;
        else if (cacheName.includes('dynamic')) maxAge = CACHE_DURATIONS.dynamic;
        else if (cacheName.includes('images')) maxAge = CACHE_DURATIONS.images;
        
        if (ageInSeconds > maxAge) {
          await cache.delete(request);
          console.log('[SW] Expired cache entry removed:', request.url);
        }
      }
    }
  }
}

// Run cache cleanup periodically
setInterval(cleanExpiredCache, 60 * 60 * 1000); // Every hour

console.log('[SW] CHARLY 2.0 Service Worker loaded successfully');