const CACHE_NAME = 'ganatube-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// Install - cache static assets (gracefully skip failures)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {
          console.warn('SW: Failed to cache:', url);
        }))
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

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || url.includes('/api/')) {
    return;
  }

  // Skip socket.io requests
  if (url.includes('/socket.io/')) {
    return;
  }

  // Skip Firebase Auth and Google APIs (these must never be cached/intercepted)
  if (
    url.includes('googleapis.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('gstatic.com') ||
    url.includes('accounts.google.com') ||
    url.includes('apis.google.com') ||
    url.includes('firebaseinstallations') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
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
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

