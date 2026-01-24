import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
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

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, date, location')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    // Verificar si el evento es gratis
    const { data: eventWithPrice } = await supabase
      .from('events')
      .select('price')
      .eq('id', eventId)
      .single();

    const priceStr = eventWithPrice?.price?.toString().toLowerCase() || '';
    const isFreeEvent = !eventWithPrice?.price || 
      eventWithPrice.price === '0' || 
      priceStr.includes('gratis') ||
      priceStr.includes('free');

    // Obtener todos los attendees del evento
    let attendeesQuery = supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    // Para eventos de pago, solo incluir los que tienen payment_status = 'paid'
    if (!isFreeEvent) {
      attendeesQuery = attendeesQuery.eq('payment_status', 'paid');
    }

    const { data: attendeesData, error: attendeesError } = await attendeesQuery;

    if (attendeesError) {
      return NextResponse.json(
        { error: 'Error al obtener attendees', details: attendeesError.message },
        { status: 500 }
      );
    }

    // Obtener todos los registros de miembros del evento
    let registrationsQuery = supabase
      .from('event_registrations')
      .select(`
        *,
        member:members!inner (
          id,
          email,
          full_name,
          phone
        )
      `)
      .eq('event_id', eventId)
      .in('status', ['registered', 'confirmed'])
      .order('registration_date', { ascending: true });

    // Para eventos de pago, solo incluir los que tienen payment_status = 'paid'
    // Para eventos gratis, no filtrar por payment_status (incluir todos)
    if (!isFreeEvent) {
      registrationsQuery = registrationsQuery.eq('payment_status', 'paid');
    }

    const { data: registrationsData, error: registrationsError } = await registrationsQuery;

    if (registrationsError) {
      return NextResponse.json(
        { error: 'Error al obtener registros', details: registrationsError.message },
        { status: 500 }
      );
    }

    // Crear un Set de emails de attendees para evitar duplicados
    const attendeeEmails = new Set(
      (attendeesData || []).map((a: any) => a.email?.toLowerCase()).filter(Boolean)
    );

    // Convertir registros de miembros a formato de lista
    const membersList: any[] = [];
    for (const registration of registrationsData || []) {
      const member = Array.isArray(registration.member) ? registration.member[0] : registration.member;
      if (member?.email) {
        const emailLower = member.email.toLowerCase();
        // Solo incluir si no está ya en attendees (evitar duplicados)
        if (!attendeeEmails.has(emailLower)) {
          membersList.push({
            name: member.full_name || member.email,
            email: member.email,
            phone: member.phone || '',
            registration_type: 'Miembro',
            registration_date: registration.registration_date,
            payment_status: registration.payment_status || (isFreeEvent ? 'Gratis' : 'N/A'),
            payment_method: registration.payment_method || '',
            checked_in: 'No',
            notes: '',
          });
        }
      }
    }

    // Convertir attendees a formato de lista
    const attendeesList = (attendeesData || []).map((a: any) => ({
      name: a.name || '',
      email: a.email || '',
      phone: a.phone || '',
      registration_type: 'Invitado',
      registration_date: a.created_at || '',
      payment_status: a.payment_status || (isFreeEvent ? 'Gratis' : 'N/A'),
      payment_method: a.payment_method || '',
      checked_in: a.status === 'checked_in' ? 'Sí' : 'No',
      notes: a.notes || '',
    }));

    // Combinar ambas listas
    const allAttendees = [...attendeesList, ...membersList];

    // Ordenar por nombre
    allAttendees.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Generar CSV
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Tipo de Registro',
      'Fecha de Registro',
      'Estado de Pago',
      'Método de Pago',
      'Check-in',
      'Notas',
    ];

    const csvRows = [
      headers.join(','),
      ...allAttendees.map((attendee) => {
        const escapeCSV = (value: any) => {
          if (value === null || value === undefined) return '';
          const str = String(value);
          // Si contiene comas, comillas o saltos de línea, envolver en comillas y escapar comillas
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          escapeCSV(attendee.name),
          escapeCSV(attendee.email),
          escapeCSV(attendee.phone),
          escapeCSV(attendee.registration_type),
          escapeCSV(attendee.registration_date),
          escapeCSV(attendee.payment_status),
          escapeCSV(attendee.payment_method),
          escapeCSV(attendee.checked_in),
          escapeCSV(attendee.notes),
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    
    // Generar nombre de archivo
    const eventTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let eventDate = 'sin-fecha';
    if (event.date) {
      try {
        // Intentar parsear la fecha (puede venir en diferentes formatos)
        const dateObj = new Date(event.date);
        if (!isNaN(dateObj.getTime())) {
          eventDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        // Si falla, usar la fecha original sin procesar
        eventDate = event.date.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      }
    }
    const filename = `asistentes_${eventTitle}_${eventDate}.csv`;

    // Retornar CSV como respuesta
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ Error exporting attendees:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
