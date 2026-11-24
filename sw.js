// Cylinder Designer service worker — offline after the first visit. Page network-first; files cache-first.
// Cleanup touches only cylinder-designer-* caches (this app shares harsh3261.github.io with the other apps).
const CACHE = 'cylinder-designer-v1';
const SHELL = ['./index.html', './engine.js', './app.js', './manifest.json', './icon.svg'];
const PAGE = new URL('./index.html', self.location).href;
const SCOPE = self.registration.scope;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('cylinder-designer') === 0 && k !== CACHE).map((k) => caches.delete(k))))); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url); if (url.origin !== self.location.origin || url.href.indexOf(SCOPE) !== 0) return;
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (isPage || /\.(js|json)$/.test(url.pathname)) {
    const key = isPage ? PAGE : req;
    e.respondWith(fetch(req).then((res) => { if (res.ok && res.type === 'basic') { const c = res.clone(); e.waitUntil(caches.open(CACHE).then((k) => k.put(key, c))); } return res; })
      .catch(() => caches.match(key).then((h) => h || caches.match(PAGE)))); return;
  }
  e.respondWith(caches.match(req).then((h) => h || fetch(req)));
});
