// Service Worker para Web Push Notifications
const CACHE_NAME = 'running-era-v1';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(clients.claim());
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificación push recibida');

  let notificationData = {
    title: 'RUNNING ERA',
    body: 'Tienes una nueva notificación',
    icon: '/assets/logo-running-era.png',
    badge: '/assets/logo-running-era.png',
    tag: 'default',
    requireInteraction: false,
    data: {
      url: '/miembros/dashboard'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: {
          url: data.url || notificationData.data.url,
          ...data
        }
      };
    } catch (e) {
      console.error('[Service Worker] Error parseando datos push:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificación clickeada');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/miembros/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejo de acciones en notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificación cerrada');
});

