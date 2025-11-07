/**
 * PWA Initialization - ISEB Client Portal
 * Enregistrement du Service Worker et gestion de l'installation
 */

(function() {
    'use strict';

    // Vérifier si le navigateur supporte les Service Workers
    if ('serviceWorker' in navigator) {
        // Enregistrer le Service Worker au chargement de la page
        window.addEventListener('load', function() {
            registerServiceWorker();
        });
    }

    // Gérer l'installation PWA
    let deferredPrompt;
    const installButton = document.querySelector('.btn-install-pwa');

    window.addEventListener('beforeinstallprompt', function(e) {
        console.log('[PWA] Installation disponible');

        // Empêcher l'affichage automatique du prompt
        e.preventDefault();

        // Stocker l'événement pour l'utiliser plus tard
        deferredPrompt = e;

        // Afficher le bouton d'installation personnalisé
        showInstallPromotion();
    });

    // Gérer le clic sur le bouton d'installation
    if (installButton) {
        installButton.addEventListener('click', async function() {
            if (!deferredPrompt) {
                return;
            }

            // Afficher le prompt d'installation
            deferredPrompt.prompt();

            // Attendre la réponse de l'utilisateur
            const { outcome } = await deferredPrompt.userChoice;

            console.log('[PWA] Choix utilisateur:', outcome);

            if (outcome === 'accepted') {
                console.log('[PWA] Installation acceptée');
                hideInstallPromotion();
            } else {
                console.log('[PWA] Installation refusée');
            }

            // Réinitialiser le prompt
            deferredPrompt = null;
        });
    }

    // Détecter si l'app a été installée
    window.addEventListener('appinstalled', function() {
        console.log('[PWA] Application installée avec succès');
        hideInstallPromotion();

        // Afficher une notification de succès
        showNotification('Application installée avec succès!', 'success');

        // Envoyer une métrique (optionnel)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_installed', {
                event_category: 'PWA',
                event_label: 'Installation'
            });
        }
    });

    /**
     * Enregistrer le Service Worker
     */
    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register(
                '/client_portal/static/service-worker.js',
                { scope: '/my/' }
            );

            console.log('[PWA] Service Worker enregistré:', registration.scope);

            // Vérifier les mises à jour
            registration.addEventListener('updatefound', function() {
                const newWorker = registration.installing;

                newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nouvelle version disponible
                        console.log('[PWA] Nouvelle version disponible');
                        showUpdateNotification();
                    }
                });
            });

            // Rafraîchir périodiquement pour vérifier les mises à jour
            setInterval(function() {
                registration.update();
            }, 60 * 60 * 1000); // Toutes les heures

        } catch (error) {
            console.error('[PWA] Erreur d\'enregistrement Service Worker:', error);
        }
    }

    /**
     * Afficher le prompt d'installation personnalisé
     */
    function showInstallPromotion() {
        // Créer ou afficher un élément UI pour promouvoir l'installation
        let installPrompt = document.querySelector('.pwa-install-prompt');

        if (!installPrompt) {
            installPrompt = document.createElement('div');
            installPrompt.className = 'pwa-install-prompt';
            installPrompt.innerHTML = `
                <div class="install-prompt-content">
                    <button type="button" class="close-install-prompt" aria-label="Fermer">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4><i class="fa fa-mobile"></i> Installer l'application</h4>
                    <p>Installez ISEB sur votre appareil pour un accès rapide et hors ligne!</p>
                    <button class="btn btn-primary btn-install-pwa">
                        <i class="fa fa-download"></i> Installer maintenant
                    </button>
                    <button class="btn btn-secondary btn-dismiss-install">
                        Plus tard
                    </button>
                </div>
            `;

            document.body.appendChild(installPrompt);

            // Gérer la fermeture
            installPrompt.querySelector('.close-install-prompt').addEventListener('click', hideInstallPromotion);
            installPrompt.querySelector('.btn-dismiss-install').addEventListener('click', function() {
                hideInstallPromotion();
                // Ne plus afficher pendant 7 jours
                localStorage.setItem('pwa-install-dismissed', Date.now());
            });

            // Réattacher l'événement au nouveau bouton
            installPrompt.querySelector('.btn-install-pwa').addEventListener('click', async function() {
                if (!deferredPrompt) {
                    return;
                }

                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    hideInstallPromotion();
                }

                deferredPrompt = null;
            });
        }

        // Vérifier si l'utilisateur a déjà refusé récemment
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return; // Ne pas afficher pendant 7 jours
            }
        }

        // Afficher le prompt
        setTimeout(function() {
            installPrompt.classList.add('show');
        }, 100);
    }

    /**
     * Masquer le prompt d'installation
     */
    function hideInstallPromotion() {
        const installPrompt = document.querySelector('.pwa-install-prompt');
        if (installPrompt) {
            installPrompt.classList.remove('show');
        }
    }

    /**
     * Afficher une notification de mise à jour
     */
    function showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'alert alert-info alert-dismissible pwa-update-banner';
        updateBanner.innerHTML = `
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>Nouvelle version disponible!</strong>
            <button class="btn btn-sm btn-primary ml-3 btn-reload-app">
                Mettre à jour
            </button>
        `;

        document.body.insertBefore(updateBanner, document.body.firstChild);

        // Gérer le clic sur le bouton de mise à jour
        updateBanner.querySelector('.btn-reload-app').addEventListener('click', function() {
            // Envoyer un message au service worker pour skip waiting
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }

            // Recharger la page
            window.location.reload();
        });
    }

    /**
     * Afficher une notification utilisateur
     */
    function showNotification(message, type) {
        type = type || 'info';

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show pwa-notification`;
        notification.innerHTML = `
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            ${message}
        `;

        document.body.insertBefore(notification, document.body.firstChild);

        // Auto-supprimer après 5 secondes
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 5000);
    }

    /**
     * Vérifier si l'app tourne en mode standalone (installée)
     */
    function isStandalone() {
        return (window.matchMedia('(display-mode: standalone)').matches) ||
               (window.navigator.standalone) ||
               document.referrer.includes('android-app://');
    }

    // Ajouter une classe au body si en mode standalone
    if (isStandalone()) {
        document.body.classList.add('pwa-standalone');
        console.log('[PWA] Mode standalone actif');
    }

    /**
     * Demander la permission pour les notifications push (optionnel)
     */
    function requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(function(permission) {
                console.log('[PWA] Permission notifications:', permission);

                if (permission === 'granted') {
                    subscribeToNotifications();
                }
            });
        }
    }

    /**
     * S'abonner aux notifications push
     */
    async function subscribeToNotifications() {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Vérifier si déjà abonné
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Créer un nouvel abonnement
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
                });

                // Envoyer l'abonnement au serveur
                await fetch('/my/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(subscription)
                });

                console.log('[PWA] Abonné aux notifications push');
            }
        } catch (error) {
            console.error('[PWA] Erreur abonnement notifications:', error);
        }
    }

    /**
     * Convertir la clé VAPID base64 en Uint8Array
     */
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }

    /**
     * Récupérer la clé publique VAPID (à configurer)
     */
    function getVapidPublicKey() {
        // Remplacer par votre clé publique VAPID
        return 'YOUR_VAPID_PUBLIC_KEY';
    }

    // Exposer les fonctions utiles globalement
    window.PWA = {
        requestNotificationPermission: requestNotificationPermission,
        isStandalone: isStandalone,
        showNotification: showNotification
    };

})();
