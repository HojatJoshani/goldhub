// GoldHub Service Worker
// PWA offline support and caching

const CACHE_NAME = "goldhub-v1.0.0";
const STATIC_CACHE = "goldhub-static-v1";
const DYNAMIC_CACHE = "goldhub-dynamic-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/icon-maskable.svg",
  "/apple-icon.svg",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Skip waiting");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] Cache error:", err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API requests (always fetch from network)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip Next.js HMR and dev requests
  if (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("hot-update") ||
    url.pathname.startsWith("/__nextjs")
  ) {
    return;
  }

  // Network-first for navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache, then to offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Update cache in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => caches.match("/icon.svg"));
      })
    );
    return;
  }

  // Stale-while-revalidate for other requests
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Message event - for skipWaiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push notification support
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);
  let data = { title: "گلد هاب", body: "اعلان جدید" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "گلد هاب", body: event.data.text() };
    }
  }
  const options = {
    body: data.body,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    dir: "rtl",
    lang: "fa",
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event);
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Periodic sync (for background gold price updates)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "gold-price-update") {
    console.log("[SW] Periodic sync: gold prices");
    event.waitUntil(updateGoldPrices());
  }
});

async function updateGoldPrices() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    // This would trigger the gold price update
    console.log("[SW] Background gold price update");
  } catch (err) {
    console.error("[SW] Background sync error:", err);
  }
}
