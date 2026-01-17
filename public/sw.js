/// <reference lib="webworker" />

/**
 * AstroWound-MEASURE Service Worker
 * Full offline support with smart caching strategies
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `astrowound-${CACHE_VERSION}`;
const DATA_CACHE = `astrowound-data-${CACHE_VERSION}`;

// Core assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
];

// Install event - pre-cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('astrowound-') && 
                     name !== CACHE_NAME && 
                     name !== DATA_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for CDN assets
  if (!url.origin.includes(self.location.origin) && 
      !url.hostname.includes('cdn') &&
      !url.hostname.includes('tfhub') &&
      !url.hostname.includes('unpkg')) {
    return;
  }

  // Strategy based on request type
  if (request.destination === 'document' || url.pathname === '/') {
    // HTML pages: Network first, fall back to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    // Static assets: Cache first, update in background
    event.respondWith(staleWhileRevalidate(request));
  } else if (
    request.destination === 'image' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  ) {
    // Images: Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Everything else: Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    if (request.mode === 'navigate') {
      return caches.match('/') || createOfflineResponse();
    }
    return createOfflineResponse();
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return createOfflineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  return cachedResponse || fetchPromise || createOfflineResponse();
}

function createOfflineResponse() {
  return new Response(
    '<html><body><h1>Offline</h1><p>AstroWound-MEASURE works offline.</p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html' } }
  );
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_STARTED' });
  });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_COMPLETE' });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'AstroWound-MEASURE', {
        body: data.body || '',
        icon: '/favicon.svg',
        tag: data.tag || 'general',
      })
    );
  } catch (error) {
    console.error('[SW] Push error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker loaded');
