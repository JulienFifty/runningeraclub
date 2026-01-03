import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count: number;
}

export async function POST(request: NextRequest) {
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

    // Obtener conexión de Strava
    const { data: connection, error: connectionError } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('member_id', user.id)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'No hay conexión con Strava' },
        { status: 404 }
      );
    }

    // Verificar si el token necesita refrescarse
    const now = Math.floor(Date.now() / 1000);
    let accessToken = connection.access_token;

    if (connection.expires_at && connection.expires_at < now) {
      // Token expirado, refrescar
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Error al refrescar token de Strava' },
          { status: 500 }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Actualizar tokens en la BD
      await supabase
        .from('strava_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: refreshData.expires_at,
        })
        .eq('member_id', user.id);
    }

    // Obtener la fecha de la última actividad sincronizada
    const { data: lastActivity } = await supabase
      .from('strava_activities')
      .select('start_date')
      .eq('member_id', user.id)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    // Construir URL de Strava API
    const stravaApiUrl = new URL('https://www.strava.com/api/v3/athlete/activities');
    stravaApiUrl.searchParams.set('per_page', '100'); // Máximo permitido por página
    
    if (lastActivity) {
      const afterTimestamp = Math.floor(new Date(lastActivity.start_date).getTime() / 1000);
      stravaApiUrl.searchParams.set('after', afterTimestamp.toString());
    }

    // Obtener actividades de Strava
    const activitiesResponse = await fetch(stravaApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!activitiesResponse.ok) {
      return NextResponse.json(
        { error: 'Error al obtener actividades de Strava' },
        { status: 500 }
      );
    }

    const activities: StravaActivity[] = await activitiesResponse.json();

    if (activities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay nuevas actividades',
        synced: 0,
      });
    }

    // Filtrar solo actividades de tipo "Run"
    const runActivities = activities.filter(a => a.type === 'Run');

    // Guardar actividades en la BD
    const activitiesToInsert = runActivities.map(activity => ({
      member_id: user.id,
      activity_id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      start_date: activity.start_date,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      kudos_count: activity.kudos_count,
      raw_data: activity,
    }));

    const { error: insertError } = await supabase
      .from('strava_activities')
      .upsert(activitiesToInsert, {
        onConflict: 'activity_id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error inserting activities:', insertError);
      console.error('Activities data:', JSON.stringify(activitiesToInsert[0], null, 2));
      return NextResponse.json(
        { 
          error: 'Error al guardar actividades',
          details: insertError.message,
          code: insertError.code 
        },
        { status: 500 }
      );
    }

    // Actualizar última sincronización
    await supabase
      .from('strava_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('member_id', user.id);

    return NextResponse.json({
      success: true,
      message: `${runActivities.length} actividades sincronizadas`,
      synced: runActivities.length,
      total: activities.length,
    });
  } catch (error: any) {
    console.error('Error in Strava sync:', error);
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar con Strava' },
      { status: 500 }
    );
  }
}

