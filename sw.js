/* ============================================================
   DC Green Events — Service Worker
   ------------------------------------------------------------
   This is the piece that makes the site installable and able to
   open offline. It runs in the background on the visitor's device
   (only on a real https site — not from a double-clicked file).

   How it works, in plain terms:
   • On install, it pre-caches the "app shell" (the core files the
     page needs to start).
   • When the page requests something, we answer from the cache if
     we can, and fall back to the network — so the app opens even
     with no signal. Map tiles use network-first so they stay fresh.
   • When you deploy a new version, bump CACHE_VERSION below. The
     old cache is cleared automatically so visitors get the update.

   YOU RARELY NEED TO TOUCH THIS FILE. The one thing to remember:
   after you change the site and redeploy, increment CACHE_VERSION
   (e.g. "v1" -> "v2") so returning visitors pick up the new files.
   ============================================================ */

const CACHE_VERSION = "v1";
const CACHE_NAME = `dc-green-events-${CACHE_VERSION}`;

// The core files to pre-cache so the app can boot offline. Vite adds
// hashed asset filenames at build time, so rather than list those here,
// we cache the app shell entry points and let runtime caching pick up
// the rest as they're requested.
const APP_SHELL = [
  ".",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// --- Install: pre-cache the app shell -----------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // activate the new SW immediately
  );
});

// --- Activate: clean up old caches --------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("dc-green-events-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// --- Fetch: decide how to answer each request ---------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Map tiles (OpenStreetMap): network-first, fall back to cache. This
  // keeps the map current online, but a previously-viewed area still
  // shows offline. We cap what we store so the cache can't grow forever.
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME + "-tiles").then((cache) => {
            cache.put(request, copy);
            trimCache(CACHE_NAME + "-tiles", 200);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For page navigations, try the network first (so content is fresh),
  // and fall back to the cached app shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("index.html").then((r) => r || caches.match(".")))
    );
    return;
  }

  // Everything else (JS, CSS, fonts, icons): cache-first for instant
  // loads, updating the cache in the background when online.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          // Only cache successful, same-origin or CORS-ok responses.
          if (response && response.status === 200 && response.type !== "opaque") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Keep a cache from growing past `maxItems` by evicting oldest entries.
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}
