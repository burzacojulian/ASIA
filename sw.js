const CACHE_NAME = "asia-vouchers-v2";

const OFFLINE_URLS = [
  "./",
  "index.html",
  "estilo.css",
  "app.js",
  "manifiesto.webmanifest",
  "icon-192.png"
];

// Instalar: precargar archivos básicos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activar: borrar caches viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch:
// - Para HTML (navegación): NETWORK FIRST → siempre trae la versión nueva
// - Para PDFs, CSS, etc.: CACHE FIRST → funciona offline
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navegación (HTML / páginas)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() =>
          caches.match(req).then((res) => res || caches.match("index.html"))
        )
    );
    return;
  }

  // Otros recursos (CSS, JS, PDFs, imágenes)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      });
    })
  );
});

