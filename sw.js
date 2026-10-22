// Service Worker for Trackside Catalog PWA
const CACHE_NAME = 'trackside-catalog-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/map.css',
  './css/modal.css',
  './js/app.js',
  './js/data.js',
  './js/search.js',
  './js/utils.js',
  './js/components/icons.js',
  './js/components/toast.js',
  './js/views/artists.js',
  './js/views/browse.js',
  './js/views/favorites.js',
  './js/views/map.js',
  './js/views/rallies.js',
  './js/views/modal.js',
  './assets/icons/favicon.svg',
  './data/conventions.json',
  './data/artists.json',
  './data/rallies.json',
  './data/merch_categories.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // If requesting json data, try network first then fallback to cache
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
