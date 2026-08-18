/**
 * Service Worker for Juan PWA
 * Strategy: Cache-first for local static assets, Network-only for LLM API and Search endpoints
 */

const CACHE_NAME = 'juan-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/assets/images/juanhead.png',
  '/assets/images/logo.png',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/videos/juanhead.mp4',
  '/assets/audio/pop.mp3',
  '/assets/audio/send.mp3',
  '/assets/audio/success.mp3'
];

// Install event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching warning (some assets might be dynamically generated):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for external APIs & dynamic requests, Cache-first for static local assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker cache for API & streaming requests
  if (
    url.hostname.includes('api.mistral.ai') ||
    url.hostname.includes('api.tavily.com') ||
    url.hostname.includes('wikipedia.org') ||
    url.hostname.includes('duckduckgo.com') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through to network directly
  }

  // 2. Cache-first strategy for local assets with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache freshness (stale-while-revalidate for local files)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
