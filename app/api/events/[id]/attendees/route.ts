import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: event_id } = await params;
    const supabase = await createClient();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener información del evento para saber si es gratuito
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, price')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const isFreeEvent = !event.price || 
      event.price === '0' || 
      event.price.toLowerCase().includes('gratis') ||
      event.price.toLowerCase().includes('free');

    // Obtener registros de miembros (solo los confirmados y pagados)
    let registrationsQuery = supabase
      .from('event_registrations')
      .select(`
        id,
        registration_date,
        payment_status,
        stripe_session_id,
        member:members!inner (
          id,
          full_name,
          email,
          profile_image
        )
      `)
      .eq('event_id', event_id)
      .in('status', ['confirmed', 'registered']);

    // Filtrar por payment_status según si es evento gratuito o no
    if (isFreeEvent) {
      registrationsQuery = registrationsQuery.or('payment_status.eq.paid,payment_status.eq.pending,stripe_session_id.not.is.null');
    } else {
      registrationsQuery = registrationsQuery.eq('payment_status', 'paid');
    }

    const { data: registrations, error: registrationsError } = await registrationsQuery;

    if (registrationsError) {
      console.error('Error obteniendo registros:', registrationsError);
      return NextResponse.json(
        { error: 'Error al obtener asistentes' },
        { status: 500 }
      );
    }

    // Obtener invitados (attendees)
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('id, name, email, phone, created_at')
      .eq('event_id', event_id)
      .in('payment_status', ['paid', 'pending']);

    if (attendeesError) {
      console.error('Error obteniendo invitados:', attendeesError);
      // No fallar si hay error con invitados, solo seguir con miembros
    }

    // Transformar los datos para unificar el formato
    const membersList = (registrations || [])
      .filter((reg: any) => reg.member) // Filtrar registros sin miembro válido
      .map((reg: any) => {
        const member = Array.isArray(reg.member) ? reg.member[0] : reg.member;
        return {
          id: member?.id || reg.id,
          name: member?.full_name || 'Miembro',
          email: member?.email || null,
          profile_image: member?.profile_image || null,
          registration_date: reg.registration_date,
          type: 'member' as const,
        };
      });

    const guestsList = (attendees || []).map((attendee: any) => ({
      id: attendee.id,
      name: attendee.name || 'Invitado',
      email: attendee.email || null,
      profile_image: null,
      registration_date: attendee.created_at,
      type: 'guest' as const,
    }));

    // Combinar y ordenar por fecha de registro
    const allAttendees = [...membersList, ...guestsList].sort((a, b) => 
      new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime()
    );

    return NextResponse.json({
      attendees: allAttendees,
      total: allAttendees.length,
    });
  } catch (error: any) {
    console.error('Error en /api/events/[id]/attendees:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

