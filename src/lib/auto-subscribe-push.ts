/**
 * Función para suscribirse automáticamente a notificaciones push
 * cuando un usuario crea su cuenta o confirma su email
 */

export async function autoSubscribeToPushNotifications(userId: string): Promise<boolean> {
  // Solo ejecutar en el cliente (navegador)
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Verificar que el navegador soporte notificaciones push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Auto Subscribe] Navegador no soporta notificaciones push');
      return false;
    }

    // Verificar permisos
    const permission = Notification.permission;
    if (permission === 'denied') {
      console.log('[Auto Subscribe] Permisos de notificación denegados');
      return false;
    }

    // Si ya hay una suscripción, no hacer nada
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        // Verificar si ya está guardada en el servidor
        const response = await fetch(`/api/push/check-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existingSubscription.endpoint, user_id: userId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            console.log('[Auto Subscribe] Ya existe una suscripción');
            return true;
          }
        }
      }
    } catch (error) {
      console.log('[Auto Subscribe] No hay suscripción existente, creando nueva');
    }

    // Si los permisos son 'default', solicitar permiso
    if (permission === 'default') {
      const newPermission = await Notification.requestPermission();
      if (newPermission !== 'granted') {
        console.log('[Auto Subscribe] Usuario denegó los permisos');
        return false;
      }
    }

    // Obtener clave VAPID pública
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('[Auto Subscribe] VAPID public key no configurada');
      return false;
    }

    // Registrar Service Worker si no está registrado
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('[Auto Subscribe] Error registrando service worker:', error);
      return false;
    }

    // Convertir clave VAPID de base64 a Uint8Array
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    // Crear suscripción
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Obtener keys
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    if (!p256dhKey || !authKey) {
      throw new Error('Error al obtener las claves de suscripción');
    }

    // Preparar datos de suscripción
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, ''),
        auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, ''),
      },
      user_id: userId,
    };

    // Enviar suscripción al servidor
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la suscripción');
    }

    console.log('[Auto Subscribe] Suscripción automática creada exitosamente');
    return true;
  } catch (error: any) {
    console.error('[Auto Subscribe] Error en suscripción automática:', error);
    // No mostrar error al usuario, es silencioso
    return false;
  }
}

