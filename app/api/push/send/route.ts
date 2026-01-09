import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:runningeraclub@gmail.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys no configuradas' },
        { status: 500 }
      );
    }

    const requestBody = await request.json();
    const { title, body: messageBody, url, icon, tag, user_id, all_users } = requestBody;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Título y cuerpo son requeridos' },
        { status: 400 }
      );
    }

    // Obtener suscripciones
    let query = supabase.from('push_subscriptions').select('*');

    if (all_users) {
      // Enviar a todos los usuarios
      // No filtrar por user_id
    } else if (user_id) {
      // Enviar a un usuario específico
      query = query.eq('user_id', user_id);
    } else {
      return NextResponse.json(
        { error: 'Debes especificar user_id o all_users' },
        { status: 400 }
      );
    }

    const { data: subscriptions, error: subsError } = await query;

    if (subsError) {
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay suscripciones para enviar',
        sent: 0,
      });
    }

    // Preparar payload
    const payload = JSON.stringify({
      title,
      body: messageBody,
      url: url || '/miembros/dashboard',
      icon: icon || '/assets/logo-running-era.png',
      tag: tag || 'notification',
    });

    // Enviar notificaciones
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // web-push espera las keys como strings (base64url)
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        await webpush.sendNotification(subscription, payload);
        return { success: true, endpoint: sub.endpoint };
      } catch (error: any) {
        console.error(`Error sending notification to ${sub.endpoint}:`, error);
        // Si la suscripción es inválida (410 o 404), eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
        return { success: false, endpoint: sub.endpoint, error: error.message };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`,
      sent: successful,
      failed: failed,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificaciones', details: error.message },
      { status: 500 }
    );
  }
}

