import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET - Obtener configuración de notificaciones
export async function GET() {
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

    // Obtener configuración
    const { data: settings, error: settingsError } = await supabase
      .from('push_notification_settings')
      .select('*')
      .order('setting_key', { ascending: true });

    if (settingsError) {
      // Si la tabla no existe, devolver configuración por defecto con código 200 pero con warning
      if (settingsError.code === '42P01' || settingsError.message?.includes('does not exist') || settingsError.message?.includes('schema cache')) {
        console.warn('[Push Settings] Tabla push_notification_settings no existe. Usando configuración por defecto.');
        return NextResponse.json({
          settings: [
            { id: 'default-1', setting_key: 'new_event', enabled: true, description: 'Notificar cuando se crea un nuevo evento' },
            { id: 'default-2', setting_key: 'payment_success', enabled: true, description: 'Notificar cuando se confirma un pago exitoso' },
            { id: 'default-3', setting_key: 'event_nearly_full', enabled: true, description: 'Notificar cuando quedan pocos lugares disponibles (10 o menos)' },
            { id: 'default-4', setting_key: 'free_event_registration', enabled: true, description: 'Notificar cuando se registra a un evento gratuito' },
          ],
          settingsMap: {
            new_event: true,
            payment_success: true,
            event_nearly_full: true,
            free_event_registration: true,
          },
          warning: 'La tabla push_notification_settings no existe. Por favor, ejecuta el script SQL en Supabase (supabase/quick-setup-push-notifications.sql).',
        }, { status: 200 }); // Retornar 200 con warning en lugar de error
      }
      // Si es un error de permisos, retornar un error específico con instrucciones
      if (settingsError.code === '42501' || settingsError.message?.includes('permission denied')) {
        console.error('[Push Settings] Error de permisos al obtener configuración:', settingsError);
        return NextResponse.json({
          settings: [
            { id: 'default-1', setting_key: 'new_event', enabled: true, description: 'Notificar cuando se crea un nuevo evento' },
            { id: 'default-2', setting_key: 'payment_success', enabled: true, description: 'Notificar cuando se confirma un pago exitoso' },
            { id: 'default-3', setting_key: 'event_nearly_full', enabled: true, description: 'Notificar cuando quedan pocos lugares disponibles (10 o menos)' },
            { id: 'default-4', setting_key: 'free_event_registration', enabled: true, description: 'Notificar cuando se registra a un evento gratuito' },
          ],
          settingsMap: {
            new_event: true,
            payment_success: true,
            event_nearly_full: true,
            free_event_registration: true,
          },
          warning: 'Error de permisos en las políticas RLS. Por favor, ejecuta el script SQL actualizado (supabase/quick-setup-push-notifications.sql) para corregir las políticas.',
        }, { status: 200 });
      }
      // Para otros errores, retornar error 500
      console.error('[Push Settings] Error obteniendo configuración:', settingsError);
      return NextResponse.json(
        { 
          error: 'Error al obtener configuración', 
          details: settingsError.message || 'Error desconocido',
          code: settingsError.code,
        },
        { status: 500 }
      );
    }

    // Convertir a formato de objeto para fácil acceso
    const settingsMap: Record<string, boolean> = {};
    settings?.forEach((setting) => {
      settingsMap[setting.setting_key] = setting.enabled;
    });

    return NextResponse.json({
      settings: settings || [],
      settingsMap,
    });
  } catch (error: any) {
    console.error('Error fetching push notification settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de notificaciones
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { setting_key, enabled } = body;

    if (!setting_key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Actualizar configuración
    const { data, error } = await supabase
      .from('push_notification_settings')
      .update({ enabled })
      .eq('setting_key', setting_key)
      .select()
      .single();

    if (error) {
      // Si la tabla no existe, retornar error informativo
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return NextResponse.json(
          { 
            error: 'La tabla push_notification_settings no existe',
            details: 'Por favor, ejecuta el script SQL en Supabase (supabase/quick-setup-push-notifications.sql) para crear la tabla.',
            code: error.code,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      setting: data,
    });
  } catch (error: any) {
    console.error('Error updating push notification settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración', details: error.message },
      { status: 500 }
    );
  }
}

