import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const body = await request.json();
    const { endpoint, user_id } = body;

    if (!endpoint || !user_id) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar que el user_id coincida con el usuario autenticado
    if (user_id !== user.id) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 403 }
      );
    }

    // Eliminar suscripción
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la suscripción', details: error.message },
      { status: 500 }
    );
  }
}

