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
    // Usar service role key para bypass RLS cuando se envía a todos los usuarios
    // ya que las políticas RLS pueden bloquear el acceso para administradores
    let subscriptions;
    let subsError;
    
    if (all_users) {
      // Enviar a todos los usuarios - usar service role para bypass RLS
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (supabaseServiceKey && supabaseUrl) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        
        const result = await supabaseAdmin
          .from('push_subscriptions')
          .select('*');
        
        subscriptions = result.data;
        subsError = result.error;
      } else {
        // Si no hay service role key, usar cliente normal (puede fallar si las políticas RLS están mal configuradas)
        const result = await supabase
          .from('push_subscriptions')
          .select('*');
        
        subscriptions = result.data;
        subsError = result.error;
      }
    } else if (user_id) {
      // Enviar a un usuario específico
      const result = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user_id);
      
      subscriptions = result.data;
      subsError = result.error;
    } else {
      return NextResponse.json(
        { error: 'Debes especificar user_id o all_users' },
        { status: 400 }
      );
    }

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

