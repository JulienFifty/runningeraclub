import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'connect'; // 'connect' o 'signup'
    const memberId = searchParams.get('member_id');
    const returnUrl = searchParams.get('return_url') || '/miembros/dashboard';

    // Si es modo connect, necesitamos member_id
    if (mode === 'connect' && !memberId) {
      return NextResponse.json(
        { error: 'member_id es requerido para conectar' },
        { status: 400 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error('Missing Strava credentials');
      return NextResponse.json(
        { error: 'Configuración de Strava incompleta' },
        { status: 500 }
      );
    }

    // Construir URL de autorización de Strava
    const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
    stravaAuthUrl.searchParams.set('client_id', clientId);
    stravaAuthUrl.searchParams.set('redirect_uri', redirectUri);
    stravaAuthUrl.searchParams.set('response_type', 'code');
    stravaAuthUrl.searchParams.set('approval_prompt', 'auto');
    stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all');
    
    // Guardar el state como JSON con toda la info necesaria
    const state = JSON.stringify({
      mode,
      member_id: memberId,
      return_url: returnUrl,
    });
    
    stravaAuthUrl.searchParams.set('state', state);

    // Redirigir a Strava
    return NextResponse.redirect(stravaAuthUrl.toString());
  } catch (error: any) {
    console.error('Error in Strava auth:', error);
    return NextResponse.json(
      { error: 'Error al iniciar autenticación con Strava' },
      { status: 500 }
    );
  }
}
