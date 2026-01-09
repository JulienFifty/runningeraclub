/**
 * Función helper para enviar notificaciones push automáticamente
 * Esta función puede ser llamada desde cualquier lugar del servidor
 */

interface SendPushNotificationOptions {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  user_id?: string;
  all_users?: boolean;
}

/**
 * Envía una notificación push a un usuario específico o a todos los usuarios
 * @param options - Opciones de la notificación
 * @returns Promise con el resultado del envío
 */
export async function sendPushNotification(options: SendPushNotificationOptions): Promise<{
  success: boolean;
  sent?: number;
  failed?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Verificar que las VAPID keys estén configuradas
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Push Notifications] VAPID keys no configuradas, saltando notificación');
      return {
        success: false,
        error: 'VAPID keys no configuradas',
      };
    }

    // Construir la URL base de la API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // Llamar a la API de envío de notificaciones
    const response = await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: options.title,
        body: options.body,
        url: options.url || '/miembros/dashboard',
        icon: options.icon || '/assets/logo-running-era.png',
        tag: options.tag || 'notification',
        user_id: options.user_id,
        all_users: options.all_users || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar notificación');
    }

    const data = await response.json();
    return {
      success: true,
      sent: data.sent,
      failed: data.failed,
      message: data.message,
    };
  } catch (error: any) {
    console.error('[Push Notifications] Error al enviar notificación:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
}

/**
 * Notifica cuando se crea un nuevo evento
 */
export async function notifyNewEvent(event: {
  id: string;
  slug: string;
  title: string;
  date: string;
  location?: string;
}): Promise<void> {
  try {
    await sendPushNotification({
      title: '🎉 ¡Nuevo evento disponible!',
      body: `${event.title} - ${event.date}`,
      url: `/eventos/${event.slug}`,
      tag: `event-${event.id}`,
      all_users: true,
    });
    console.log(`[Push Notifications] Notificación de nuevo evento enviada: ${event.title}`);
  } catch (error) {
    console.error('[Push Notifications] Error al notificar nuevo evento:', error);
  }
}

/**
 * Notifica cuando se confirma un pago exitoso
 */
export async function notifyPaymentSuccess(userId: string, event: {
  title: string;
  slug: string;
}): Promise<void> {
  try {
    await sendPushNotification({
      title: '✅ Pago confirmado',
      body: `Tu registro a "${event.title}" ha sido confirmado exitosamente`,
      url: `/miembros/dashboard`,
      tag: `payment-success-${userId}`,
      user_id: userId,
    });
    console.log(`[Push Notifications] Notificación de pago confirmado enviada al usuario: ${userId}`);
  } catch (error) {
    console.error('[Push Notifications] Error al notificar pago confirmado:', error);
  }
}

/**
 * Notifica cuando quedan pocos lugares disponibles en un evento
 */
export async function notifyEventNearlyFull(event: {
  id: string;
  slug: string;
  title: string;
  spotsRemaining: number;
}): Promise<void> {
  try {
    await sendPushNotification({
      title: '⚠️ Quedan pocos lugares',
      body: `Solo quedan ${event.spotsRemaining} lugares disponibles para "${event.title}"`,
      url: `/eventos/${event.slug}`,
      tag: `event-nearly-full-${event.id}`,
      all_users: true,
    });
    console.log(`[Push Notifications] Notificación de evento casi lleno enviada: ${event.title}`);
  } catch (error) {
    console.error('[Push Notifications] Error al notificar evento casi lleno:', error);
  }
}

/**
 * Notifica recordatorio de evento (24 horas antes)
 */
export async function notifyEventReminder(userId: string, event: {
  title: string;
  date: string;
  location?: string;
  slug: string;
}): Promise<void> {
  try {
    await sendPushNotification({
      title: '📅 Recordatorio de evento',
      body: `No olvides: ${event.title} mañana a las ${event.date}`,
      url: `/eventos/${event.slug}`,
      tag: `event-reminder-${userId}`,
      user_id: userId,
    });
    console.log(`[Push Notifications] Recordatorio de evento enviado al usuario: ${userId}`);
  } catch (error) {
    console.error('[Push Notifications] Error al enviar recordatorio:', error);
  }
}

/**
 * Notifica cuando un evento se acerca (1 hora antes)
 */
export async function notifyEventStarting(userId: string, event: {
  title: string;
  location?: string;
  slug: string;
}): Promise<void> {
  try {
    await sendPushNotification({
      title: '🚀 ¡El evento comienza pronto!',
      body: `${event.title} comienza en 1 hora${event.location ? ` en ${event.location}` : ''}`,
      url: `/eventos/${event.slug}`,
      tag: `event-starting-${userId}`,
      user_id: userId,
    });
    console.log(`[Push Notifications] Notificación de evento comenzando enviada al usuario: ${userId}`);
  } catch (error) {
    console.error('[Push Notifications] Error al notificar evento comenzando:', error);
  }
}

