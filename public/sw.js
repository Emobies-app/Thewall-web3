// TheWall Service Worker — Next.js 14 + Vercel
const CACHE = 'thewall-v2';

const SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
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

// ── Install: cache app shell ──────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET
  if (e.request.method !== 'GET') return;

  // Skip blockchain / AI / external APIs
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  // Skip your own API routes
  if (url.pathname.startsWith('/api/')) return;

  // _next/static — cache forever (content-hashed by Next.js)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Pages — network first, fallback to cache, then offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() =>
        caches.match(e.request)
          .then(cached => cached || caches.match('/offline.html'))
      )
  );
});

// ── Push Notifications ────────────────────────
self.addEventListener('push', e => {
  const d = e.data?.json() ?? {
    title: '🧱 TheWall',
    body: 'New wallet activity',
    url: '/'
  };
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: d.url || '/' },
      actions: [
        { action: 'view', title: 'Open Wallet' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action !== 'dismiss')
    e.waitUntil(clients.openWindow(e.notification.data.url));
});

// ── Background Sync ───────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'tx-retry')
    e.waitUntil(Promise.resolve(
      console.log('[TheWall SW] retrying queued transactions')
    ));
});
