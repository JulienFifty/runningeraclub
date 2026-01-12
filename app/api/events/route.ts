import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Obtener todos los eventos (solo no archivados para público)
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Intentar filtrar por archived, si falla (campo no existe), cargar todos y filtrar en JS
    let { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('archived', false) // Solo eventos no archivados
      .order('date', { ascending: true });

    // Si hay error por campo archived no existente, intentar sin filtro
    if (error && (error.message?.includes('archived') || error.code === '42703' || error.code === 'PGRST116')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      
      // Filtrar eventos archivados en JavaScript
      // Si archived no existe, asumir false (evento activo)
      data = (fallbackData || []).filter((e: any) => e.archived !== true);
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al obtener eventos', details: error?.message },
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









