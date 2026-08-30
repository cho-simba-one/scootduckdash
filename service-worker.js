// Duck Scooter Dash - offline app-shell cache.
// Bump CACHE_NAME any time file contents change so clients pick up updates
// instead of being stuck on a stale cached copy.
const CACHE_NAME = 'duck-scooter-dash-v13';

// NOTE: every JS module must be listed here. cache.addAll() is all-or-nothing,
// so a single missing/404 entry rejects the whole install -- but an entry that
// is merely ABSENT fails silently in a nastier way: online users are fine
// (network-first fetches it at runtime) while anyone who installs the PWA and
// goes offline before playing gets a broken app shell.
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
  './js/hazards.js',
  './js/level.js',
  './js/levels.js',
  './js/main.js',
  './js/pickups.js',
  './js/pixelArt.js',
  './js/player.js',
  './js/projectile.js',
  './js/sfx.js',
  './js/sprites.js',
  './js/titleScreen.js',
  './js/touchControls.js',
  './js/music.js',
  './js/musicData.js',
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

// Network-first, falling back to cache only when offline. This is the
// opposite of what most PWA tutorials show (cache-first), on purpose --
// this game is under active development and cache-first meant anyone who'd
// loaded it once before an update would get stuck on stale files until an
// awkward double-reload cleared it. Network-first means: online (the
// common case) always gets the current build; offline still works because
// whatever was last fetched successfully gets cached as a fallback.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
