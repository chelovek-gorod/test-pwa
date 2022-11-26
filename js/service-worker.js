'use strict';

const staticCashName = 'static-cash';
const staticURLs = [
    './test-pwa/index.html',
    './test-pwa/style/style.css',
    './test-pwa/js/main.js'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(staticCashName);
    await cache.addAll(staticURLs)

    console.log('[sw]: install');
});
self.addEventListener('activate', event => console.log('[sw]: activate'));
self.addEventListener('fetch', event => {
    console.log('[sw]: fetch', event.request.url);

    event.respondWith( cacheFirst(event.request) );
});

async function cacheFirst(request) {
    const cached = await caches.match( request );
    return cached ?? await fetch( request );
}