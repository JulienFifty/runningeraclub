import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_title, event_id } = await request.json();

    if (!event_title && !event_id) {
      return NextResponse.json(
        { error: 'event_title o event_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Obtener el evento
    let finalEventId = event_id;
    if (!finalEventId && event_title) {
      const { data: foundEvents } = await supabase
        .from('events')
        .select('id, title, max_participants')
        .ilike('title', `%${event_title}%`)
        .limit(1);
      
      if (foundEvents && foundEvents.length > 0) {
        finalEventId = foundEvents[0].id;
      }
    }

    if (!finalEventId) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todos los registros de event_registrations
    const { data: registrationsData } = await supabase
      .from('event_registrations')
      .select(`
        id,
        member_id,
        notes,
        payment_status,
        status,
        member:members (
          id,
          email,
          full_name
        )
      `)
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid');

    // Obtener todos los attendees
    const { data: attendeesData } = await supabase
      .from('attendees')
      .select('id, name, email, notes, payment_status, status')
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid');

    // Separar en categorías
    const allRegistrations = (registrationsData || []).map((reg: any) => ({
      type: 'registration',
      id: reg.id,
      name: reg.member?.full_name || 'Sin nombre',
      email: reg.member?.email || 'Sin email',
      notes: reg.notes || null,
      isStaff: reg.notes?.toLowerCase().includes('staff') || false,
      payment_status: reg.payment_status,
      status: reg.status,
    }));

    const allAttendees = (attendeesData || []).map((att: any) => ({
      type: 'attendee',
      id: att.id,
      name: att.name || 'Sin nombre',
      email: att.email || 'Sin email',
      notes: att.notes || null,
      isStaff: att.notes?.toLowerCase().includes('staff') || false,
      payment_status: att.payment_status,
      status: att.status,
    }));

    // Filtrar staff
    const validRegistrations = allRegistrations.filter((r) => !r.isStaff);
    const validAttendees = allAttendees.filter((a) => !a.isStaff);

    // Obtener emails de miembros registrados para detectar duplicados
    const registeredMemberEmails = new Set(
      validRegistrations.map((r) => r.email?.toLowerCase()).filter(Boolean) as string[]
    );

    // Filtrar attendees que son duplicados (mismo email que un miembro registrado)
    const uniqueAttendees = validAttendees.filter(
      (att) => !att.email || !registeredMemberEmails.has(att.email.toLowerCase())
    );

    // Combinar todos los participantes válidos
    const allParticipants = [
      ...validRegistrations.map((r) => ({ ...r, counted: true })),
      ...uniqueAttendees.map((a) => ({ ...a, counted: true })),
    ];

    // También incluir los que NO se cuentan (staff y duplicados) para referencia
    const staffParticipants = [
      ...allRegistrations.filter((r) => r.isStaff).map((r) => ({ ...r, counted: false, reason: 'Staff' })),
      ...allAttendees.filter((a) => a.isStaff).map((a) => ({ ...a, counted: false, reason: 'Staff' })),
    ];

    const duplicateAttendees = validAttendees.filter(
      (att) => att.email && registeredMemberEmails.has(att.email.toLowerCase())
    ).map((a) => ({ ...a, counted: false, reason: 'Duplicado (ya registrado como miembro)' }));

    return NextResponse.json({
      success: true,
      event_id: finalEventId,
      summary: {
        total_registrations: allRegistrations.length,
        total_attendees: allAttendees.length,
        staff_count: staffParticipants.length,
        duplicate_count: duplicateAttendees.length,
        valid_count: allParticipants.length,
      },
      counted: allParticipants,
      excluded: {
        staff: staffParticipants,
        duplicates: duplicateAttendees,
      },
      raw: {
        all_registrations: allRegistrations,
        all_attendees: allAttendees,
      },
    });
  } catch (error: any) {
    console.error('Error listing participants:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
