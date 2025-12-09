const CACHE = "asia-vouchers-v1";

const CORE_ASSETS = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "icon-192.png"
];

// Instala el SW y guarda la estructura principal
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS))
  );
});

// Activa el SW
self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Intercepta las peticiones y usa cache cuando sea posible
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cacheResp => {
      return cacheResp ||
        fetch(event.request).then(networkResp => {
          // Guarda en caché lo que se vaya cargando (incluye PDFs)
          return caches.open(CACHE).then(cache => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          });
        });
    })
  );
});
