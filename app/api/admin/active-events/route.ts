import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Obtener eventos activos (fecha >= hoy)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, slug, title, date, max_participants')
      .gte('date', todayString)
      .order('date', { ascending: true })
      .limit(10); // Limitar a 10 eventos más próximos

    if (eventsError) {
      return NextResponse.json(
        { error: 'Error al obtener eventos' },
        { status: 500 }
      );
    }

    // Para cada evento, calcular registros e ingresos
    const eventsWithStats = await Promise.all(
      (events || []).map(async (event) => {
        // Contar registros con pago exitoso (paid) de event_registrations
        const { count: registrationsCount } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'paid');

        // Contar asistentes con pago exitoso (paid) de attendees
        const { count: attendeesCount } = await supabase
          .from('attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'paid');

        const registeredCount = (registrationsCount || 0) + (attendeesCount || 0);

        // Calcular ingresos totales de payment_transactions
        const { data: transactions } = await supabase
          .from('payment_transactions')
          .select('amount, status')
          .eq('event_id', event.id)
          .eq('status', 'succeeded');

        const totalRevenue = (transactions || []).reduce(
          (sum, t) => sum + (parseFloat(t.amount?.toString() || '0') || 0),
          0
        );

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
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithStats,
    });
  } catch (error: any) {
    console.error('Error in active-events API:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

