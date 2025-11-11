/**
 * Service Worker pour ISEB Client Portal
 * Gestion du cache et fonctionnalité offline
 */

const CACHE_NAME = 'iseb-client-portal-v1';
const OFFLINE_URL = '/my/offline';

// Fichiers à mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
    '/my/home',
    '/my/dashboard',
    '/my/documents',
    '/my/expenses',
    '/client_portal/static/css/client_portal.css',
    '/client_portal/static/js/client_portal.js',
    '/web/static/lib/jquery/jquery.js',
    '/web/static/lib/bootstrap/css/bootstrap.css',
    '/web/static/lib/bootstrap/js/bootstrap.js',
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
    OFFLINE_URL
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des ressources statiques');
                // Utiliser addAll avec gestion d'erreur pour éviter qu'un échec bloque tout
                return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })))
                    .catch((error) => {
                        console.warn('[Service Worker] Erreur lors de la mise en cache:', error);
                        // Continuer même si certains fichiers échouent
                        return Promise.resolve();
                    });
            })
            .then(() => {
                // Forcer le nouveau service worker à devenir actif immédiatement
                return self.skipWaiting();
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Supprimer les anciens caches
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Prendre le contrôle de tous les clients immédiatement
                return self.clients.claim();
            })
    );
});

// Interception des requêtes (stratégie Network First with Cache Fallback)
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorer les requêtes vers d'autres domaines (sauf CDN connus)
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== location.origin &&
        !requestUrl.host.includes('cdn.jsdelivr.net')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la requête réussit, mettre en cache et retourner
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }

                return response;
            })
            .catch(() => {
                // Si le réseau échoue, essayer de servir depuis le cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }

                        // Si c'est une navigation et qu'il n'y a pas de cache, afficher la page offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }

                        // Sinon, retourner une erreur
                        return new Response('Offline - Resource not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message reçu:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME)
                .then(() => {
                    console.log('[Service Worker] Cache vidé');
                    return self.registration.update();
                })
        );
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        // Permet au client de demander la mise en cache d'URLs spécifiques
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(urls);
                })
        );
    }
});

// Gestion de la synchronisation en arrière-plan (Background Sync)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sync event:', event.tag);

    if (event.tag === 'sync-documents') {
        event.waitUntil(syncDocuments());
    }

    if (event.tag === 'sync-expenses') {
        event.waitUntil(syncExpenses());
    }
});

// Synchroniser les documents en attente
async function syncDocuments() {
    try {
        // Récupérer les documents en attente depuis IndexedDB
        const pendingDocs = await getPendingDocuments();

        for (const doc of pendingDocs) {
            // Envoyer chaque document au serveur
            await fetch('/my/document/upload', {
                method: 'POST',
                body: doc.formData
            });

            // Supprimer de la queue locale
            await removePendingDocument(doc.id);
        }

        console.log('[Service Worker] Documents synchronisés');
    } catch (error) {
        console.error('[Service Worker] Erreur de synchronisation documents:', error);
        throw error; // Re-throw pour que le sync soit retenté
    }
}

// Synchroniser les notes de frais en attente
async function syncExpenses() {
    try {
        const pendingExpenses = await getPendingExpenses();

        for (const expense of pendingExpenses) {
            await fetch('/my/expense/create', {
                method: 'POST',
                body: expense.formData
            });

            await removePendingExpense(expense.id);
        }

        console.log('[Service Worker] Notes de frais synchronisées');
    } catch (error) {
        console.error('[Service Worker] Erreur de synchronisation expenses:', error);
        throw error;
    }
}

// Helpers pour IndexedDB (à implémenter côté client)
async function getPendingDocuments() {
    // Placeholder - à implémenter avec IndexedDB
    return [];
}

async function removePendingDocument(id) {
    // Placeholder
}

async function getPendingExpenses() {
    // Placeholder
    return [];
}

async function removePendingExpense(id) {
    // Placeholder
}

// Gestion des notifications push (si activées)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification reçue');

    let notificationData = {
        title: 'ISEB Client Portal',
        body: 'Vous avez une nouvelle notification',
        icon: '/client_portal/static/img/icon-192x192.png',
        badge: '/client_portal/static/img/badge-72x72.png'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                data: data.url ? { url: data.url } : {}
            };
        } catch (e) {
            console.error('[Service Worker] Erreur parsing push data:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Gestion du clic sur notification
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification cliquée');

    event.notification.close();

    // Ouvrir ou focaliser la fenêtre du client
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Si une fenêtre est déjà ouverte, la focaliser
                for (let client of clientList) {
                    if (client.url.includes('/my/') && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Sinon, ouvrir une nouvelle fenêtre
                if (clients.openWindow) {
                    const url = event.notification.data?.url || '/my/home';
                    return clients.openWindow(url);
                }
            })
    );
});
