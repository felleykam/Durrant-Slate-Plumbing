const CACHE = 'ppwa-cache-v3';
const ASSETS = [
  'index.html','styles.css','app.js',
  'modules/jobs.js','modules/calc.js','modules/notes.js','modules/board.js','modules/cloud.js','config.js',
  'manifest.webmanifest',
  'icons/icon-192.png','icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // Navigation requests: network-first, fallback to cached index for offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Static assets: cache-first
  if (['script','style','image','font'].includes(request.destination) || ASSETS.some(a => url.pathname.endsWith(a))) {
    e.respondWith(
      caches.match(request).then(r => r || fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return resp;
      }).catch(() => caches.match('index.html')))
    );
  }
});
