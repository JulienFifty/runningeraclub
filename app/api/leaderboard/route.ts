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
    const period = searchParams.get('period') || 'alltime'; // alltime, year, month

    // Calcular fechas según el período
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'alltime':
      default:
        startDate = new Date(2000, 0, 1); // Fecha muy antigua
        break;
    }

    // Obtener todas las actividades del período
    const { data: activities, error: activitiesError } = await supabase
      .from('strava_activities')
      .select(`
        member_id,
        distance,
        moving_time,
        total_elevation_gain,
        start_date
      `)
      .eq('type', 'Run')
      .gte('start_date', startDate.toISOString());

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Error al obtener actividades' },
        { status: 500 }
      );
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Agrupar por member_id y calcular stats
    const memberStats = new Map<string, {
      member_id: string;
      total_distance: number;
      total_runs: number;
      total_time: number;
      total_elevation: number;
    }>();

    activities.forEach(activity => {
      const existing = memberStats.get(activity.member_id) || {
        member_id: activity.member_id,
        total_distance: 0,
        total_runs: 0,
        total_time: 0,
        total_elevation: 0,
      };

      existing.total_distance += parseFloat(activity.distance.toString());
      existing.total_runs += 1;
      existing.total_time += parseInt(activity.moving_time.toString());
      existing.total_elevation += parseFloat(activity.total_elevation_gain?.toString() || '0');

      memberStats.set(activity.member_id, existing);
    });

    // Obtener información de los miembros y sus conexiones de Strava
    const memberIds = Array.from(memberStats.keys());
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

    // Obtener conexiones de Strava para las fotos de perfil
    const { data: stravaConnections, error: stravaError } = await supabase
      .from('strava_connections')
      .select('member_id, athlete_data')
      .in('member_id', memberIds);

    // Combinar datos y ordenar por distancia
    const leaderboard = memberIds
      .map(memberId => {
        const stats = memberStats.get(memberId)!;
        const member = members?.find(m => m.id === memberId);
        const stravaConnection = stravaConnections?.find(s => s.member_id === memberId);
        
        // Priorizar foto de Strava, luego foto del perfil, luego null
        const profileImage = stravaConnection?.athlete_data?.profile 
          || member?.profile_image 
          || null;

        return {
          member_id: memberId,
          member_name: member?.full_name || 'Miembro',
          profile_image: profileImage,
          total_distance_km: parseFloat((stats.total_distance / 1000).toFixed(2)),
          total_runs: stats.total_runs,
          total_time_hours: parseFloat((stats.total_time / 3600).toFixed(2)),
          total_elevation_m: parseFloat(stats.total_elevation.toFixed(0)),
          avg_distance_km: parseFloat((stats.total_distance / 1000 / stats.total_runs).toFixed(2)),
          avg_pace_min_km: stats.total_distance > 0 
            ? parseFloat(((stats.total_time / 60) / (stats.total_distance / 1000)).toFixed(2))
            : 0,
        };
      })
      .sort((a, b) => b.total_distance_km - a.total_distance_km)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // Limitar resultados si se especifica
    const limit = parseInt(searchParams.get('limit') || '0');
    const finalLeaderboard = limit > 0 ? leaderboard.slice(0, limit) : leaderboard;

    return NextResponse.json({ 
      leaderboard: finalLeaderboard,
      period,
      total_members: leaderboard.length,
    });
  } catch (error: any) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar leaderboard' },
      { status: 500 }
    );
  }
}

