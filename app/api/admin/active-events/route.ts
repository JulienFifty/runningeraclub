import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Acceso denegado', success: false, details: adminError?.message },
        { status: 403 }
      );
    }

    // Obtener fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);
    today.setSeconds(0, 0);

    // Obtener todos los eventos activos (no archivados) (porque la columna date es TEXT y puede tener diferentes formatos)
    let { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('id, slug, title, date, max_participants, archived')
      .eq('archived', false) // Solo eventos no archivados
      .order('date', { ascending: true });

    // Si hay error por campo archived no existente, intentar sin filtro
    if (eventsError && (eventsError.message?.includes('archived') || eventsError.code === '42703' || eventsError.code === 'PGRST116')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('events')
        .select('id, slug, title, date, max_participants, archived')
        .order('date', { ascending: true });
      
      if (fallbackError) {
        console.error('Error fetching events:', fallbackError);
        return NextResponse.json(
          { error: 'Error al obtener eventos', details: fallbackError.message },
          { status: 500 }
        );
      }
      
      // Filtrar eventos archivados en JavaScript
      allEvents = (fallbackData || []).filter((e: any) => e.archived !== true);
      eventsError = null;
    }

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Error al obtener eventos', details: eventsError.message },
        { status: 500 }
      );
    }

    // Filtrar eventos activos (fecha >= hoy) en JavaScript
    // Intentar parsear diferentes formatos de fecha
    const events = (allEvents || []).filter((event) => {
      if (!event.date) return false;

      try {
        // Intentar diferentes formatos de fecha
        let eventDate: Date | null = null;

        // Formato 1: YYYY-MM-DD
        if (event.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          eventDate = new Date(event.date);
        }
        // Formato 2: DD MMM YYYY (ej: "10 ENE 2026")
        else if (event.date.match(/^\d{1,2}\s+\w{3}\s+\d{4}$/i)) {
          // Parsear formato español e inglés
          const months: { [key: string]: number } = {
            // Español
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
            // Inglés (solo los diferentes)
            'jan': 0, 'apr': 3, 'aug': 7, 'dec': 11,
          };
          const parts = event.date.toLowerCase().split(/\s+/);
          if (parts.length === 3 && months[parts[1]] !== undefined) {
            eventDate = new Date(
              parseInt(parts[2]),
              months[parts[1]],
              parseInt(parts[0])
            );
          }
        }
        // Formato 3: Intentar parseo automático
        else {
          eventDate = new Date(event.date);
        }

        // Validar que la fecha sea válida y sea >= hoy
        if (eventDate && !isNaN(eventDate.getTime())) {
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        }
      } catch (error) {
        console.warn(`Error parsing date for event ${event.id}: ${event.date}`, error);
      }

      return false;
    }).slice(0, 10); // Limitar a 10 eventos más próximos

    // Para cada evento, calcular registros e ingresos
    const eventsWithStats = await Promise.all(
      (events || []).map(async (event) => {
        try {
          let registeredCount = 0;
          let totalRevenue = 0;

          // Contar registros con pago exitoso (paid) de event_registrations
          // Manejar caso donde la tabla no existe
          try {
            const { count: registrationsCount, error: regError } = await supabase
              .from('event_registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('payment_status', 'paid');

            if (!regError) {
              registeredCount += registrationsCount || 0;
            } else if (regError.code !== 'PGRST116') { // PGRST116 = tabla no existe
              console.error(`Error counting registrations for event ${event.id}:`, regError);
            }
          } catch (e) {
            // Ignorar si la tabla no existe
            console.warn('event_registrations table may not exist');
          }

          // Contar asistentes con pago exitoso (paid) de attendees
          try {
            const { count: attendeesCount, error: attError } = await supabase
              .from('attendees')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('payment_status', 'paid');

            if (!attError) {
              registeredCount += attendeesCount || 0;
            } else if (attError.code !== 'PGRST116') {
              console.error(`Error counting attendees for event ${event.id}:`, attError);
            }
          } catch (e) {
            // Ignorar si la tabla no existe
            console.warn('attendees table may not exist');
          }

          // Calcular ingresos totales de payment_transactions
          try {
            const { data: transactions, error: transError } = await supabase
              .from('payment_transactions')
              .select('amount, status')
              .eq('event_id', event.id)
              .eq('status', 'succeeded');

            if (!transError) {
              totalRevenue = (transactions || []).reduce(
                (sum, t) => sum + (parseFloat(t.amount?.toString() || '0') || 0),
                0
              );
            } else if (transError.code !== 'PGRST116') {
              console.error(`Error fetching transactions for event ${event.id}:`, transError);
            }
          } catch (e) {
            // Ignorar si la tabla no existe
            console.warn('payment_transactions table may not exist');
          }

          const maxParticipants = event.max_participants || 0;
          const spotsRemaining = maxParticipants > 0 ? maxParticipants - registeredCount : 0;
          const isFull = maxParticipants > 0 && registeredCount >= maxParticipants;
          const isNearCapacity = maxParticipants > 0 && spotsRemaining > 0 && spotsRemaining <= 10;

          return {
            id: event.id,
            slug: event.slug,
            title: event.title,
            date: event.date,
            max_participants: event.max_participants,
            registered_count: registeredCount,
            total_revenue: totalRevenue,
            spots_remaining: spotsRemaining,
            is_full: isFull,
            is_near_capacity: isNearCapacity,
          };
        } catch (error: any) {
          console.error(`Error processing event ${event.id}:`, error);
          // Retornar evento con valores por defecto en caso de error
          return {
            id: event.id,
            slug: event.slug,
            title: event.title,
            date: event.date,
            max_participants: event.max_participants,
            registered_count: 0,
            total_revenue: 0,
            spots_remaining: event.max_participants || 0,
            is_full: false,
            is_near_capacity: false,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithStats,
    });
  } catch (error: any) {
    console.error('Error in active-events API:', error);
    return NextResponse.json(
      { 
        error: 'Error del servidor', 
        details: error?.message || 'Error desconocido',
        success: false 
      },
      { status: 500 }
    );
  }
}

