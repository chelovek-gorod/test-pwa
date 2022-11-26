'use strict';

const staticCashName = 'static-cash';
const staticURLs = [
    'index.html',
    './style/style.css',
    './js/main.js'
];

self.addEventListener('install', event => {
    console.log('[sw]: install');
    event.waitUntil(
        caches.open(staticCashName).then( cache => cache.addAll(staticURLs) )
    );
});
self.addEventListener('activate', event => console.log('[sw]: activate'));
self.addEventListener('fetch', event => console.log('[sw]: fetch'));