import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Usar service role key si está disponible, sino usar cliente normal
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

    const { name, email, phone, tickets, event_id, registration_type, payment_method } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Determinar payment_status basado en registration_type
    // Si es staff o cortesía, marcar como 'paid' para que cuente en el cupo
    // Si es regular y tiene método de pago (stripe, cash, transfer), marcar como 'paid'
    const paymentStatus = (registration_type === 'staff' || registration_type === 'cortesia') 
      ? 'paid' 
      : (registration_type === 'regular' && payment_method)
      ? 'paid'
      : null;

    // Determinar notes basado en registration_type y método de pago
    let notes = null;
    if (registration_type === 'staff') {
      notes = 'Staff - Registro manual';
    } else if (registration_type === 'cortesia') {
      notes = 'Cortesía - Registro manual';
    } else if (registration_type === 'regular' && payment_method) {
      const paymentMethodLabels: { [key: string]: string } = {
        'stripe': 'Pago en Stripe',
        'cash': 'Pago en Efectivo',
        'transfer': 'Pago por Transferencia',
      };
      notes = `Regular - ${paymentMethodLabels[payment_method] || 'Pago manual'}`;
    }

    // Crear el asistente
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        tickets: tickets || 1,
        status: 'pending',
        event_id: event_id || null,
        payment_status: paymentStatus,
        payment_method: payment_method || null,
        notes: notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear el asistente', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendee: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Usar service role key si está disponible, sino usar cliente normal
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

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    // Obtener attendees de la tabla attendees
    // SOLO mostrar los que tienen payment_status = 'paid' (pagos completados)
    // O los que son registros manuales (staff, cortesía) que ya tienen payment_status = 'paid'
    let attendeesQuery = supabase
      .from('attendees')
      .select('*')
      .eq('payment_status', 'paid') // SOLO pagos completados
      .order('created_at', { ascending: false });

    if (eventId) {
      attendeesQuery = attendeesQuery.eq('event_id', eventId);
    }

    const { data: attendeesData, error: attendeesError } = await attendeesQuery;

    if (attendeesError) {
      console.error('Error loading attendees:', attendeesError);
    }

    // Si hay eventId, también obtener miembros registrados de event_registrations
    // que no estén en attendees (para sincronizar datos)
    let membersData: any[] = [];
    if (eventId) {
      try {
        // Obtener registros de miembros con pago completado
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('event_registrations')
          .select(`
            id,
            member_id,
            event_id,
            registration_date,
            status,
            payment_status,
            member:members!inner (
              id,
              email,
              full_name,
              phone
            )
          `)
          .eq('event_id', eventId)
          .eq('payment_status', 'paid')
          .in('status', ['registered', 'confirmed']);

        if (!registrationsError && registrationsData) {
          // Obtener emails de los attendees existentes para evitar duplicados
          const existingEmails = new Set(
            (attendeesData || []).map((a: any) => a.email?.toLowerCase()).filter(Boolean)
          );

          // Convertir registros de miembros a formato attendees
          membersData = registrationsData
            .filter((reg: any) => {
              const member = Array.isArray(reg.member) ? reg.member[0] : reg.member;
              const email = member?.email?.toLowerCase();
              // Solo incluir si no existe ya en attendees
              return email && !existingEmails.has(email);
            })
            .map((reg: any) => {
              const member = Array.isArray(reg.member) ? reg.member[0] : reg.member;
              return {
                id: `member_${reg.member_id}_${reg.event_id}`, // ID único para evitar conflictos
                name: member?.full_name || member?.email || 'Miembro',
                email: member?.email || null,
                phone: member?.phone || null,
                tickets: 1,
                status: 'pending' as const,
                event_id: reg.event_id,
                payment_status: reg.payment_status || 'paid',
                payment_method: null,
                notes: 'Registro de miembro',
                created_at: reg.registration_date,
                checked_in_at: null,
              };
            });
        }
      } catch (membersError) {
        console.error('Error loading members from event_registrations:', membersError);
        // Continuar sin fallar si hay error
      }
    }

    // Combinar attendees y miembros registrados
    const allAttendees = [...(attendeesData || []), ...membersData];

    return NextResponse.json({
      success: true,
      attendees: allAttendees,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

