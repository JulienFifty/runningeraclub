import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Obtener todos los eventos
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo evento
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('events')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enviar notificación push automática a todos los usuarios
    try {
      const { notifyNewEvent } = await import('@/lib/push-notifications');
      await notifyNewEvent({
        id: data.id,
        slug: data.slug,
        title: data.title,
        date: data.date,
        location: data.location,
      });
    } catch (pushError) {
      // No fallar la creación del evento si falla la notificación
      console.error('[Events API] Error enviando notificación push:', pushError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    );
  }
}









