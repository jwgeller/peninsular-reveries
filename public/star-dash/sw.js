const CACHE_NAME = 'star-dash-v1'
const BASE_PATH = self.location.pathname.replace(/\/star-dash\/sw\.js$/, '') || ''
function withBase(url) { return url.startsWith('/') ? BASE_PATH + url : url }
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('star-dash-') && k !== CACHE_NAME).map(k => caches.delete(k))))) ; self.clients.claim() })
self.addEventListener('fetch', (event) => { event.respondWith(fetch(event.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)) } return r }).catch(() => caches.match(event.request).then(r => r || Response.error()))) })
