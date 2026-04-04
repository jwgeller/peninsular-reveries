const CACHE_NAME = 'mission-orbit-v6'
const APP_SHELL_URL = new URL('./', self.registration.scope).toString()
const ASSETS = [
  APP_SHELL_URL,
  new URL('../styles/mission-orbit.css', self.registration.scope).toString(),
  new URL('../client/shell.js', self.registration.scope).toString(),
  new URL('../client/mission-orbit/main.js', self.registration.scope).toString(),
  new URL('./audio/launch-rumble-light.ogg', self.registration.scope).toString(),
  new URL('./audio/launch-rumble-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/burn-thrust-pulse-light.ogg', self.registration.scope).toString(),
  new URL('./audio/burn-thrust-pulse-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/reentry-texture-light.ogg', self.registration.scope).toString(),
  new URL('./audio/reentry-texture-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/parachute-deploy-light.ogg', self.registration.scope).toString(),
  new URL('./audio/parachute-deploy-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/splashdown-light.ogg', self.registration.scope).toString(),
  new URL('./audio/splashdown-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/space-ambience-light.ogg', self.registration.scope).toString(),
  new URL('./audio/space-ambience-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/celebration-accent-light.ogg', self.registration.scope).toString(),
  new URL('./audio/celebration-accent-heavy.ogg', self.registration.scope).toString(),
  new URL('../favicon.svg', self.registration.scope).toString(),
  new URL('../apple-touch-icon.png', self.registration.scope).toString(),
  new URL('./manifest.json', self.registration.scope).toString(),
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, copy))
          }
          return response
        })
        .catch(async () => (await caches.match(APP_SHELL_URL)) || Response.error()),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cached)

      return cached || fetched
    }),
  )
})