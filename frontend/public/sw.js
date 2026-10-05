// AnySaver Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch for local development
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});