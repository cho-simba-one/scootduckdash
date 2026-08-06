// Duck Scooter Dash - offline app-shell cache.
// Bump CACHE_NAME any time file contents change so clients pick up updates
// instead of being stuck on a stale cached copy.
const CACHE_NAME = 'duck-scooter-dash-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/background.js',
  './js/camera.js',
  './js/constants.js',
  './js/enemy.js',
  './js/game.js',
  './js/input.js',
  './js/level.js',
  './js/main.js',
  './js/pixelArt.js',
  './js/player.js',
  './js/projectile.js',
  './js/sprites.js',
  './js/titleScreen.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell, falling back to network (and caching what
// we fetch) for anything else -- e.g. the Google Font, which we don't want
// to force-cache since it's a third-party resource that can change.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
