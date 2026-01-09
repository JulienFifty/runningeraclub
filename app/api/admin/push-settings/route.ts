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
      // Si la tabla no existe, devolver configuración por defecto
      if (settingsError.code === '42P01' || settingsError.message?.includes('does not exist')) {
        console.warn('[Push Settings] Tabla push_notification_settings no existe. Usando configuración por defecto.');
        return NextResponse.json({
          settings: [
            { id: 'default', setting_key: 'new_event', enabled: true, description: 'Notificar cuando se crea un nuevo evento' },
            { id: 'default', setting_key: 'payment_success', enabled: true, description: 'Notificar cuando se confirma un pago exitoso' },
            { id: 'default', setting_key: 'event_nearly_full', enabled: true, description: 'Notificar cuando quedan pocos lugares disponibles (10 o menos)' },
            { id: 'default', setting_key: 'free_event_registration', enabled: true, description: 'Notificar cuando se registra a un evento gratuito' },
          ],
          settingsMap: {
            new_event: true,
            payment_success: true,
            event_nearly_full: true,
            free_event_registration: true,
          },
          warning: 'La tabla push_notification_settings no existe. Por favor, ejecuta el script SQL en Supabase.',
        });
      }
      throw settingsError;
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

