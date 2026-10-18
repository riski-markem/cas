const VERSI_CACHE = 'keuangan-v1';
const ASET_INTI = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(VERSI_CACHE).then(function (cache) {
            return cache.addAll(ASET_INTI);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (daftar) {
            return Promise.all(
                daftar
                    .filter(function (nama) { return nama !== VERSI_CACHE; })
                    .map(function (nama) { return caches.delete(nama); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    const permintaan = event.request;
    if (permintaan.method !== 'GET') return;

    const url = new URL(permintaan.url);
    if (url.origin !== self.location.origin) return;

    if (permintaan.mode === 'navigate') {
        event.respondWith(
            fetch(permintaan).then(function (respons) {
                const salinan = respons.clone();
                caches.open(VERSI_CACHE).then(function (cache) {
                    cache.put('./index.html', salinan);
                });
                return respons;
            }).catch(function () {
                return caches.match('./index.html');
            })
        );
        return;
    }

    event.respondWith(
        caches.match(permintaan).then(function (tersimpan) {
            const dariJaringan = fetch(permintaan).then(function (respons) {
                if (respons && respons.status === 200) {
                    const salinan = respons.clone();
                    caches.open(VERSI_CACHE).then(function (cache) {
                        cache.put(permintaan, salinan);
                    });
                }
                return respons;
            }).catch(function () {
                return tersimpan;
            });
            return tersimpan || dariJaringan;
        })
    );
});
