// Service Worker for 《黑夜君临》遗物检测站 (zero-dependency PWA).
// - install: precache the app shell, static icons/manifest, and every hashed
//   asset referenced by the built index.html (so the site works fully offline).
// - fetch:   navigations are network-first with a cached-shell fallback;
//            same-origin assets are cache-first.
const VERSION = 'v2';
const CACHE = `nightreign-affix-${VERSION}`;

// Files with names known at build time (copied verbatim from public/).
const STATIC = [
  './',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './og-image.png',
];

// Parse the freshly-built index.html for hashed `./assets/...` references.
async function assetUrls() {
  const res = await fetch('./', { cache: 'no-store' });
  const html = await res.text();
  const urls = new Set();
  const re = /(?:src|href)\s*=\s*["']([^"']+assets\/[^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) != null) urls.add(m[1]);
  return [...urls];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      let urls = STATIC;
      try {
        urls = [...STATIC, ...(await assetUrls())];
      } catch {
        // index.html not reachable yet — precache just the static files.
      }
      // One bad URL shouldn't fail the whole install.
      await Promise.all(urls.map((u) => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put('./', net.clone());
          return net;
        } catch {
          const cached = await caches.match('./');
          if (cached) return cached;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      // ignoreVary: the preview/GitHub-Pages response for `./assets/*.js`
      // carries `Vary: Origin`, and the module-script request (always CORS
      // mode) sends an `Origin` header that the precached no-cors request did
      // not — so a plain `caches.match(req)` misses and the script fails
      // offline with net::ERR_FAILED / "Failed to fetch dynamically imported
      // module". Matching by URL (ignoring Vary) serves our own cached copy.
      const cached = await caches.match(req, { ignoreVary: true });
      if (cached) return cached;
      const net = await fetch(req);
      if (net && net.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
      }
      return net;
    })(),
  );
});
