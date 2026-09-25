// Rolodex service worker.
// Contacts live in localStorage, so the only thing that needs caching is the
// shell. Navigations are network-first with a cached fallback, which keeps the
// app usable on a plane without ever serving a stale build when online.

const VERSION = "rolodex-v2";
const SHELL = ["/", "/people", "/import", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match("/offline")) ?? Response.error()),
    );
    return;
  }

  // Static build output is content-hashed, so cache-first is safe and fast.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".png")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

// Follow-up reminders are shown via registration.showNotification (see
// lib/notifications.ts), so a click needs to be routed back into the app
// here rather than through a page's own click handler.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        if ("navigate" in existing) return existing.navigate(url);
        return undefined;
      }
      return self.clients.openWindow(url);
    }),
  );
});
