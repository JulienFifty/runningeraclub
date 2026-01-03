import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10'); // Top 10 por defecto

    // Obtener todos los registros de eventos confirmados/attended
    const { data: registrations, error: registrationsError } = await supabase
      .from('event_registrations')
      .select('member_id, status')
      .in('status', ['confirmed', 'attended', 'registered']); // Incluir 'registered' también

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError);
      return NextResponse.json(
        { error: 'Error al obtener registros de eventos' },
        { status: 500 }
      );
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Agrupar por member_id y contar eventos únicos
    const memberEvents = new Map<string, {
      member_id: string;
      event_count: number;
    }>();

    registrations.forEach((reg) => {
      const existing = memberEvents.get(reg.member_id) || {
        member_id: reg.member_id,
        event_count: 0,
      };

      existing.event_count += 1;
      memberEvents.set(reg.member_id, existing);
    });

    // Obtener información de los miembros
    const memberIds = Array.from(memberEvents.keys());
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

    // Combinar datos y ordenar por cantidad de eventos
    const leaderboard = memberIds
      .map(memberId => {
        const stats = memberEvents.get(memberId)!;
        const member = members?.find(m => m.id === memberId);
        const stravaConnection = stravaConnections?.find(s => s.member_id === memberId);
        
        const profileImage = stravaConnection?.athlete_data?.profile 
          || member?.profile_image 
          || null;

        return {
          member_id: memberId,
          member_name: member?.full_name || 'Miembro',
          profile_image: profileImage,
          event_count: stats.event_count,
        };
      })
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, limit) // Limitar resultados
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({ 
      leaderboard,
      total_members: leaderboard.length,
    });
  } catch (error: any) {
    console.error('Error in events leaderboard API:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar leaderboard de eventos' },
      { status: 500 }
    );
  }
}

