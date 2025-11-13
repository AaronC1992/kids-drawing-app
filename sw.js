// Service Worker for Kids Drawing App PWA
const CACHE_NAME = 'kids-drawing-app-v3';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './offline.html',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png'
];

// Install event - cache files
// Install event - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
// Fetch event
self.addEventListener('fetch', event => {
  // Handle navigation requests with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Optionally update the cache in the background
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // For other requests: cache-first, then network
  event.respondWith(
    caches.match(event.request).then(cacheHit => {
      if (cacheHit) return cacheHit;
      return fetch(event.request).then(networkResp => {
        // Cache same-origin GET requests
        try {
          const url = new URL(event.request.url);
          if (url.origin === self.location.origin && event.request.method === 'GET') {
            const respClone = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
          }
        } catch (e) { /* ignore */ }
        return networkResp;
      }).catch(() => {
        // For images, you could return a placeholder; for now, just fail
        return caches.match('./offline.html');
      });
    })
  );
});

// Activate event - clean up old caches
// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim())
  );
});
