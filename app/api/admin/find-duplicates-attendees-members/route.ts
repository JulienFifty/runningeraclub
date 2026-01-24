import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_id, auto_delete = false } = await request.json();

    if (!event_id) {
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
      .select('id, title, slug')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    // Obtener todos los attendees del evento
    const { data: allAttendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event_id);

    if (attendeesError) {
      return NextResponse.json(
        { error: 'Error al obtener attendees', details: attendeesError.message },
        { status: 500 }
      );
    }

    // Obtener todos los registros de miembros del evento
    const { data: allRegistrations, error: registrationsError } = await supabase
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
      .eq('event_id', event_id);

    if (registrationsError) {
      return NextResponse.json(
        { error: 'Error al obtener registros', details: registrationsError.message },
        { status: 500 }
      );
    }

    // Crear un mapa de emails de miembros registrados
    const memberEmails = new Map<string, any>();
    for (const registration of allRegistrations || []) {
      const member = Array.isArray(registration.member) ? registration.member[0] : registration.member;
      if (member?.email) {
        const emailLower = member.email.toLowerCase().trim();
        if (!memberEmails.has(emailLower)) {
          memberEmails.set(emailLower, {
            registration_id: registration.id,
            member_id: member.id,
            member_email: member.email,
            member_name: member.full_name,
            registration_date: registration.registration_date,
            payment_status: registration.payment_status,
          });
        }
      }
    }

    // Buscar duplicados: attendees que tienen el mismo email que un miembro registrado
    const duplicates: any[] = [];

    for (const attendee of allAttendees || []) {
      if (attendee.email) {
        const emailLower = attendee.email.toLowerCase().trim();
        const memberRegistration = memberEmails.get(emailLower);

        if (memberRegistration) {
          duplicates.push({
            attendee: {
              id: attendee.id,
              email: attendee.email,
              name: attendee.name,
              phone: attendee.phone,
              created_at: attendee.created_at,
              payment_status: attendee.payment_status,
              stripe_session_id: attendee.stripe_session_id,
            },
            member: {
              registration_id: memberRegistration.registration_id,
              member_id: memberRegistration.member_id,
              email: memberRegistration.member_email,
              name: memberRegistration.member_name,
              registration_date: memberRegistration.registration_date,
              payment_status: memberRegistration.payment_status,
            },
            match_type: 'email',
          });
        }
      }
    }

    // También buscar por nombre si no hay email (menos confiable pero puede ayudar)
    const nameMatches: any[] = [];
    if (allAttendees && allRegistrations) {
      for (const attendee of allAttendees) {
        if (!attendee.email && attendee.name) {
          const attendeeNameLower = attendee.name.toLowerCase().trim();
          
          for (const registration of allRegistrations) {
            const member = Array.isArray(registration.member) ? registration.member[0] : registration.member;
            if (member?.full_name) {
              const memberNameLower = member.full_name.toLowerCase().trim();
              
              // Comparación de nombres (exacta o muy similar)
              if (attendeeNameLower === memberNameLower || 
                  attendeeNameLower.includes(memberNameLower) || 
                  memberNameLower.includes(attendeeNameLower)) {
                // Verificar que no sea ya un duplicado por email
                const isAlreadyDuplicate = duplicates.some(d => 
                  d.attendee.id === attendee.id || 
                  d.member.registration_id === registration.id
                );
                
                if (!isAlreadyDuplicate) {
                  nameMatches.push({
                    attendee: {
                      id: attendee.id,
                      email: attendee.email,
                      name: attendee.name,
                      phone: attendee.phone,
                      created_at: attendee.created_at,
                    },
                    member: {
                      registration_id: registration.id,
                      member_id: member.id,
                      email: member.email,
                      name: member.full_name,
                      registration_date: registration.registration_date,
                    },
                    match_type: 'name',
                    confidence: attendeeNameLower === memberNameLower ? 'high' : 'medium',
                  });
                }
              }
            }
          }
        }
      }
    }

    let deletedCount = 0;
    const deleted: any[] = [];

    // Si auto_delete es true, eliminar los attendees duplicados (mantener los registros de miembros)
    if (auto_delete && duplicates.length > 0) {
      for (const duplicate of duplicates) {
        const { error: deleteError } = await supabase
          .from('attendees')
          .delete()
          .eq('id', duplicate.attendee.id);

        if (!deleteError) {
          deletedCount++;
          deleted.push({
            attendee_id: duplicate.attendee.id,
            email: duplicate.attendee.email,
            name: duplicate.attendee.name,
            reason: `Duplicado con miembro registrado (${duplicate.member.email})`,
          });
        } else {
          deleted.push({
            attendee_id: duplicate.attendee.id,
            email: duplicate.attendee.email,
            name: duplicate.attendee.name,
            error: deleteError.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      summary: {
        total_attendees: allAttendees?.length || 0,
        total_member_registrations: allRegistrations?.length || 0,
        duplicates_by_email: duplicates.length,
        potential_duplicates_by_name: nameMatches.length,
        deleted: deletedCount,
      },
      duplicates_by_email: duplicates,
      potential_duplicates_by_name: nameMatches,
      deleted: auto_delete ? deleted : [],
      recommendation: duplicates.length > 0 
        ? `Se encontraron ${duplicates.length} duplicados por email. Ejecuta con auto_delete=true para eliminarlos.`
        : 'No se encontraron duplicados por email.',
    });
  } catch (error: any) {
    console.error('❌ Error finding duplicates:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
