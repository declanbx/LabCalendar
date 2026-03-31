const CACHE_NAME = "feed-log-v1";
const ASSETS = [
  ".",
  "index.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// Font URL cached on first fetch (network-first strategy for external resources)
const FONT_ORIGINS = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

// Install: pre-cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local assets, stale-while-revalidate for fonts
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Font resources: stale-while-revalidate
  if (FONT_ORIGINS.some((origin) => event.request.url.startsWith(origin))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request)
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Local assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
