const CACHE_NAME = 'ganatube-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/site.webmanifest',
  '/favicon-192x192.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
];

// Install - cache static assets safely without failing the whole installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch((err) => console.warn('PWA Cache item failed:', url, err)))
      );
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (e.g. manageads.ganatube.in)
  if (!url.startsWith(self.location.origin)) return;

  // Skip API and socket calls
  if (url.includes('/api/') || url.includes('/socket.io/') || url.includes('managegt-api.php')) return;

  // Skip Angular SPA admin & analytics routes — let the browser handle navigation
  if (url.includes('/managegt') || url.includes('/gtanalytic')) return;

  // Cache-first for hashed static assets (JS/CSS) - they never change
  if (url.match(/\.[a-zA-Z0-9_-]{8,}\.(js|css)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for same-origin only
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigation requests, return index.html (SPA fallback)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Return empty 503 instead of undefined (fixes TypeError)
          return new Response('Service Unavailable', { status: 503 });
        });
      })
  );
});

