import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // Usar service role key para bypass RLS y obtener conteo correcto
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase incompleta' },
        { status: 500 }
      );
    }

    // Usar service role key si está disponible (bypass RLS)
    const supabase = supabaseServiceKey
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createSupabaseClient(supabaseUrl, supabaseAnonKey);

    // Obtener información del evento para saber el máximo de participantes
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_participants, price')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    if (!event.max_participants) {
      return NextResponse.json({
        maxParticipants: null,
        totalRegistered: 0,
        spotsRemaining: null,
        isFull: false,
      });
    }

    // Verificar si es evento gratuito
    const isFreeEvent = !event.price || 
      event.price === '0' || 
      event.price.toString().toLowerCase().includes('gratis') ||
      event.price.toString().toLowerCase().includes('free');

    // Contar registros de miembros con pago exitoso
    let registrationsQuery = supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'registered']);

    // Filtrar por payment_status según si es evento gratuito o no
    if (isFreeEvent) {
      // Para eventos gratuitos, contar todos los registros (paid, pending, o con stripe_session_id)
      registrationsQuery = registrationsQuery.or('payment_status.eq.paid,payment_status.eq.pending');
    } else {
      // Para eventos de pago, solo contar los pagados
      registrationsQuery = registrationsQuery.eq('payment_status', 'paid');
    }

    const { count: registrationsCount, error: registrationsError } = await registrationsQuery;

    if (registrationsError) {
      console.error('Error contando registros:', registrationsError);
    }

    // Contar invitados (attendees) con pago exitoso
    let attendeesQuery = supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (isFreeEvent) {
      attendeesQuery = attendeesQuery.in('payment_status', ['paid', 'pending']);
    } else {
      attendeesQuery = attendeesQuery.eq('payment_status', 'paid');
    }

    const { count: attendeesCount, error: attendeesError } = await attendeesQuery;

    if (attendeesError) {
      console.error('Error contando invitados:', attendeesError);
    }

    const totalRegistered = (registrationsCount || 0) + (attendeesCount || 0);
    const spotsRemaining = Math.max(0, event.max_participants - totalRegistered);
    const isFull = totalRegistered >= event.max_participants;

    return NextResponse.json({
      maxParticipants: event.max_participants,
      totalRegistered,
      spotsRemaining,
      isFull,
    });
  } catch (error: any) {
    console.error('Error en /api/events/[id]/capacity:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
