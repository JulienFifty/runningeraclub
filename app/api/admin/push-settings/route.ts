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

