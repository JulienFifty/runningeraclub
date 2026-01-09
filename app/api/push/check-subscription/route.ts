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
        { error: 'endpoint y user_id son requeridos' },
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

    // Verificar si existe una suscripción con este endpoint
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .eq('user_id', user_id)
      .single();

    return NextResponse.json({
      exists: !!subscription,
    });
  } catch (error: any) {
    console.error('Error checking push subscription:', error);
    return NextResponse.json(
      { error: 'Error al verificar suscripción', details: error.message, exists: false },
      { status: 500 }
    );
  }
}

