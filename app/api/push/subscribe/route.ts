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
    const { endpoint, keys, user_id } = body;

    if (!endpoint || !keys || !user_id) {
      return NextResponse.json(
        { error: 'Datos de suscripción incompletos' },
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

    // Verificar si ya existe una suscripción con este endpoint
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .single();

    if (existingSubscription) {
      // Actualizar suscripción existente
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          keys: keys,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Suscripción actualizada',
      });
    }

    // Crear nueva suscripción
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user_id,
        endpoint: endpoint,
        keys: keys,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción creada exitosamente',
    });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Error al guardar la suscripción', details: error.message },
      { status: 500 }
    );
  }
}

