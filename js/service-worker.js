'use strict';

self.addEventListener('install', event => console.log('[sw]: install'));
self.addEventListener('activate', event => console.log('[sw]: activate'));
self.addEventListener('fetch', event => console.log('[sw]: fetch'));