/// <reference lib="webworker" />

/**
 * AstroWound-MEASURE Service Worker
 * Full offline support with smart caching strategies
 * Domain: bonnesantemedicals.com
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `astrowound-${CACHE_VERSION}`;
const DATA_CACHE = `astrowound-data-${CACHE_VERSION}`;
const AI_MODEL_CACHE = `astrowound-ai-${CACHE_VERSION}`;
const IMAGE_CACHE = `astrowound-images-${CACHE_VERSION}`;

// Core assets to cache immediately for full offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/guide',
];

// AI model assets to precache for offline AI functionality
const AI_MODEL_ASSETS = [
  // TensorFlow.js core
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js',
];

// Install event - pre-cache static assets and AI models
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache AI model assets separately
      caches.open(AI_MODEL_CACHE).then((cache) => {
        console.log('[SW] Caching AI model assets');
        return Promise.all(
          AI_MODEL_ASSETS.map(url => 
            cache.add(url).catch(err => console.log('[SW] Failed to cache:', url, err))
          )
        );
      })
    ]).then(() => {
      console.log('[SW] All assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  const currentCaches = [CACHE_NAME, DATA_CACHE, AI_MODEL_CACHE, IMAGE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('astrowound-') && !currentCaches.includes(name);
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
      !url.hostname.includes('unpkg') &&
      !url.hostname.includes('jsdelivr') &&
      !url.hostname.includes('bonnesantemedicals.com')) {
    return;
  }

  // Strategy based on request type
  if (request.destination === 'document' || url.pathname === '/') {
    // HTML pages: Network first, fall back to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (
    url.hostname.includes('cdn') ||
    url.hostname.includes('tfhub') ||
    url.hostname.includes('jsdelivr') ||
    url.pathname.includes('model') ||
    url.pathname.endsWith('.wasm')
  ) {
    // AI model assets: Cache first (they don't change often)
    event.respondWith(aiModelCacheStrategy(request));
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

// AI model cache strategy - aggressive caching for offline AI
async function aiModelCacheStrategy(request) {
  const cache = await caches.open(AI_MODEL_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    }).catch(() => {});
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] AI model fetch failed:', request.url);
    return createOfflineResponse();
  }
}

function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AstroWound-MEASURE - Offline</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #0ea5e9, #0369a1); }
        .card { background: white; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px; margin: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        h1 { color: #0ea5e9; margin-bottom: 1rem; }
        p { color: #64748b; line-height: 1.6; }
        button { background: #0ea5e9; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; margin-top: 1rem; }
        button:hover { background: #0369a1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📡 Offline Mode</h1>
        <p>AstroWound-MEASURE works offline! Your data is stored safely on your device.</p>
        <p>Please check your internet connection or try again later.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>`,
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
