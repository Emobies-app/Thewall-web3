// TheWall Web3 — Service Worker (v2)
const CACHE = 'thewall-v2';

const SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // '/offline.html'   ← commented out until you create the file
];

const SKIP_HOSTS = [
  'alchemy.com',
  'walletconnect.com',
  'walletconnect.org',
  'coingecko.com',
  'anthropic.com',
  'niledb.com',
  'helius-rpc.com',
];

// ── Install ─────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ───────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── SKIP_WAITING (important for SWRegister) ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push, Sync, Periodic Sync (kept as you had them)
self.addEventListener('push', e => { /* your existing code */ });
self.addEventListener('notificationclick', e => { /* your existing code */ });
self.addEventListener('sync', e => { /* your existing code */ });
self.addEventListener('periodicsync', e => { /* your existing code */ });
