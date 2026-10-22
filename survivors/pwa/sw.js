// Service worker de la app instalable (Fase 12). Solo existe para que Chrome ofrezca instalar el juego.
// La página se pide siempre a internet primero, así una versión publicada nueva llega sola a la app instalada; si no hay
// conexión se usa la última guardada. El resto (código con nombres que cambian en cada build, sprites, sonidos) no se
// toca: lo guarda el navegador como en cualquier web.
const CACHE = 'hb-survivors-page';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') return;
    event.respondWith(
        fetch(event.request.url, { cache: 'no-cache' })
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request.url, copy)));
                }
                return response;
            })
            .catch(() => caches.match(event.request.url, { ignoreSearch: true }).then((cached) => cached ?? Response.error())),
    );
});
