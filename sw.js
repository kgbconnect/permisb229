/* PermisB_229 — service worker : permet d'ouvrir l'application sans Internet après la première visite. */
const CACHE = 'permisb229-v2';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fichiers du site : réponse immédiate depuis le cache, mise à jour en arrière-plan.
// Les appels vers le service Google (connexion, questions) ne passent jamais par ici.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(net); return cached; }
      return net.then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    })
  );
});
