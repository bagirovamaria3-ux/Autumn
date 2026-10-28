const CACHE_NAME = 'autumn-cache-v2'; // сменил версию на v2, чтобы старый кэш сбросился
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  self.skipWaiting(); // активируем новый SW сразу
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)) // удаляем старые кэши
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Для картинок с GitHub — сначала кэш, потом сеть
  if (url.hostname.includes('githubusercontent.com') || url.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // 2. Для остального (HTML, API GitHub) — сначала сеть, потом кэш
  event.respondWith(
    fetch(event.request).then(response => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(() => caches.match(event.request))
  );
});
