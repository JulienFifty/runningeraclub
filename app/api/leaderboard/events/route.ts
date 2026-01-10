import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Usar service role key para bypass RLS y obtener datos públicos del leaderboard
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

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10'); // Top 10 por defecto
    const period = searchParams.get('period') || 'alltime'; // alltime, month

    // Calcular fechas según el período
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'alltime':
      default:
        startDate = new Date(2000, 0, 1); // Fecha muy antigua
        break;
    }

    // Obtener todos los registros de eventos válidos
    // Incluir event_id para contar eventos únicos
    // Filtrar por registration_date según el período
    // Incluir todos los registros excepto los explícitamente cancelados o refunded
    let query = supabase
      .from('event_registrations')
      .select('member_id, event_id, status, payment_status, registration_date, stripe_session_id')
      .gte('registration_date', startDate.toISOString());

    const { data: registrationsWithEvents, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching registrations:', eventsError);
      return NextResponse.json(
        { error: 'Error al obtener registros de eventos' },
        { status: 500 }
      );
    }

    if (!registrationsWithEvents || registrationsWithEvents.length === 0) {
      console.log('No registrations found for period:', period, 'startDate:', startDate.toISOString());
      return NextResponse.json({ leaderboard: [] });
    }

    console.log(`Found ${registrationsWithEvents.length} total registrations for period ${period}`);

    // Agrupar por member_id y contar eventos únicos
    // Filtrar registros válidos: excluir solo los cancelados o refunded explícitamente
    const memberEventCounts = new Map<string, Set<string>>();
    let cancelledCount = 0;
    let refundedCount = 0;
    let noMemberIdCount = 0;

    registrationsWithEvents?.forEach((reg) => {
      // Excluir solo los que están explícitamente cancelados o refunded
      const isCancelled = reg.status === 'cancelled';
      const isRefunded = reg.payment_status === 'refunded';
      
      if (isCancelled) cancelledCount++;
      if (isRefunded) refundedCount++;
      if (!reg.member_id) noMemberIdCount++;
      
      // Incluir todos los registros válidos:
      // 1. Los que tienen payment_status = 'paid' (pagos completados, incluyendo manuales del admin)
      // 2. Los que tienen payment_status = 'pending' (eventos gratuitos o pagos pendientes)
      // 3. Los que tienen payment_status = null pero status válido (registros antiguos)
      // 4. Los que tienen stripe_session_id (pago iniciado, puede estar pendiente de webhook)
      // Solo si tienen member_id válido y no están cancelados/refunded
      const isValidPayment = 
        reg.payment_status === 'paid' || 
        reg.payment_status === 'pending' || 
        reg.payment_status === null ||
        reg.stripe_session_id !== null;
      
      if (!isCancelled && !isRefunded && reg.member_id && isValidPayment) {
        if (!memberEventCounts.has(reg.member_id)) {
          memberEventCounts.set(reg.member_id, new Set());
        }
        memberEventCounts.get(reg.member_id)!.add(reg.event_id);
      }
    });

    console.log(`After filtering: ${memberEventCounts.size} unique members with events`);
    console.log(`Excluded: ${cancelledCount} cancelled, ${refundedCount} refunded, ${noMemberIdCount} no member_id`);

    // Obtener información de los miembros
    const memberIds = Array.from(memberEventCounts.keys());
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, full_name, profile_image')
      .in('id', memberIds);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Error al obtener miembros' },
        { status: 500 }
      );
    }

    // Obtener conexiones de Strava para las fotos
    const { data: stravaConnections } = await supabase
      .from('strava_connections')
      .select('member_id, athlete_data')
      .in('member_id', memberIds);

    // Combinar datos y ordenar por cantidad de eventos únicos
    const leaderboard = memberIds
      .map(memberId => {
        const eventSet = memberEventCounts.get(memberId)!;
        const eventCount = eventSet.size;
        const member = members?.find(m => m.id === memberId);
        const stravaConnection = stravaConnections?.find(s => s.member_id === memberId);
        
        const profileImage = stravaConnection?.athlete_data?.profile 
          || member?.profile_image 
          || null;

        return {
          member_id: memberId,
          member_name: member?.full_name || 'Miembro',
          profile_image: profileImage,
          event_count: eventCount,
        };
      })
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, limit) // Limitar resultados
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // Calcular total de miembros únicos con eventos
    const uniqueMemberIds = new Set(memberIds);

    return NextResponse.json({ 
      leaderboard,
      period,
      total_members: uniqueMemberIds.size,
    });
  } catch (error: any) {
    console.error('Error in events leaderboard API:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar leaderboard de eventos' },
      { status: 500 }
    );
  }
}

