import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Obtener todas las actividades del usuario
    const { data: activities, error: activitiesError } = await supabase
      .from('strava_activities')
      .select('distance, moving_time, total_elevation_gain, start_date, type')
      .eq('member_id', user.id)
      .eq('type', 'Run'); // Solo runs

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json(
        { error: 'Error al obtener actividades' },
        { status: 500 }
      );
    }

    // Si no hay actividades, retornar valores por defecto
    if (!activities || activities.length === 0) {
      return NextResponse.json({
        total_distance_km: 0,
        total_runs: 0,
        total_elevation_m: 0,
        total_time_hours: 0,
        avg_distance_km: 0,
        avg_pace_min_km: 0,
        last_run_date: null,
      });
    }

    // Calcular estadísticas
    const totalDistanceM = activities.reduce((sum, a) => sum + parseFloat(a.distance.toString()), 0);
    const totalDistanceKm = totalDistanceM / 1000;
    const totalTimeS = activities.reduce((sum, a) => sum + parseInt(a.moving_time.toString()), 0);
    const totalTimeH = totalTimeS / 3600;
    const totalElevationM = activities.reduce((sum, a) => sum + (parseFloat(a.total_elevation_gain?.toString() || '0')), 0);
    const totalRuns = activities.length;
    const avgDistanceKm = totalDistanceKm / totalRuns;
    
    // Calcular pace promedio (min/km)
    const avgPaceMinKm = totalDistanceKm > 0 ? (totalTimeS / 60) / totalDistanceKm : 0;

    // Obtener fecha de última carrera
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    const lastRunDate = sortedActivities[0]?.start_date || null;

    return NextResponse.json({
      total_distance_km: parseFloat(totalDistanceKm.toFixed(2)),
      total_runs: totalRuns,
      total_elevation_m: parseFloat(totalElevationM.toFixed(2)),
      total_time_hours: parseFloat(totalTimeH.toFixed(2)),
      avg_distance_km: parseFloat(avgDistanceKm.toFixed(2)),
      avg_pace_min_km: parseFloat(avgPaceMinKm.toFixed(2)),
      last_run_date: lastRunDate,
    });
  } catch (error: any) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

