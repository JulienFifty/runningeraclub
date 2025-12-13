import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el miembro existe
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Perfil de miembro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el evento existe
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_participants')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya está registrado
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('member_id', user.id)
      .eq('event_id', event_id)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya estás registrado en este evento' },
        { status: 400 }
      );
    }

    // Verificar cupo disponible
    if (event.max_participants) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('status', ['registered', 'confirmed']);

      if (count && count >= event.max_participants) {
        return NextResponse.json(
          { error: 'El evento está lleno' },
          { status: 400 }
        );
      }
    }

    // Crear registro
    const { data: registration, error: registrationError } = await supabase
      .from('event_registrations')
      .insert({
        member_id: user.id,
        event_id: event_id,
        status: 'registered',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (registrationError) {
      console.error('Error creating registration:', registrationError);
      return NextResponse.json(
        { error: 'Error al registrar en el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

