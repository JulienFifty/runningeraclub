import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    // Si el usuario canceló o hubo error
    if (error) {
      return NextResponse.redirect(
        new URL('/miembros/login?strava_error=cancelled', request.url)
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL('/miembros/login?strava_error=invalid', request.url)
      );
    }

    // Parse state
    let state: { mode: string; member_id?: string; return_url?: string };
    try {
      state = JSON.parse(stateParam);
    } catch {
      // Fallback para compatibilidad con versión anterior (member_id simple)
      state = { mode: 'connect', member_id: stateParam, return_url: '/miembros/dashboard' };
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Strava credentials');
      return NextResponse.redirect(
        new URL('/miembros/login?strava_error=config', request.url)
      );
    }

    // Exchange code por tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Strava token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(
        new URL('/miembros/login?strava_error=token', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    const supabase = await createClient();

    // MODO: SIGNUP - Crear cuenta nueva con Strava
    if (state.mode === 'signup') {
      // Verificar si ya existe una conexión con este Strava athlete ID
      const { data: existingConnection } = await supabase
        .from('strava_connections')
        .select('member_id, members!inner(id, email)')
        .eq('strava_athlete_id', athlete.id)
        .single();

      if (existingConnection) {
        // Ya existe una cuenta con este Strava - Intentar login automático
        const member = (existingConnection as any).members;
        if (member) {
          try {
            // Generar password temporal desde Strava ID
            const tempPassword = `strava_${athlete.id}_temp`;
            
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: member.email,
              password: tempPassword,
            });

            if (!signInError) {
              return NextResponse.redirect(
                new URL(state.return_url || '/miembros/dashboard', request.url)
              );
            }
          } catch (error) {
            console.error('Error auto-signing in:', error);
          }
        }
        
        // Si el auto-login falla, redirigir a login manual
        return NextResponse.redirect(
          new URL('/miembros/login?strava_error=existing_account', request.url)
        );
      }

      // No existe - Crear nueva cuenta
      const email = athlete.email || `strava_${athlete.id}@runningera.club`;
      const password = `strava_${athlete.id}_${Date.now()}`;
      const fullName = `${athlete.firstname || ''} ${athlete.lastname || ''}`.trim() || 'Corredor Strava';

      // Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            strava_athlete_id: athlete.id,
          },
        },
      });

      if (signUpError || !authData.user) {
        console.error('Error creating auth user:', signUpError);
        return NextResponse.redirect(
          new URL('/miembros/login?strava_error=signup', request.url)
        );
      }

      const userId = authData.user.id;

      // Crear perfil de miembro
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          membership_type: 'regular',
          membership_status: 'active',
        });

      if (memberError) {
        console.error('Error creating member profile:', memberError);
        // Continuar de todos modos
      }

      // Guardar conexión de Strava
      const { error: connectionError } = await supabase
        .from('strava_connections')
        .insert({
          member_id: userId,
          strava_athlete_id: athlete.id,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(expires_at * 1000).toISOString(),
          athlete_data: {
            username: athlete.username,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            profile: athlete.profile,
            city: athlete.city,
            country: athlete.country,
          },
        });

      if (connectionError) {
        console.error('Error saving Strava connection:', connectionError);
      }

      // Login automático
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error('Error signing in after signup:', signInError);
        return NextResponse.redirect(
          new URL('/miembros/login?strava_signup=success&auto_signin=failed', request.url)
        );
      }

      return NextResponse.redirect(
        new URL(`${state.return_url || '/miembros/dashboard'}?strava_signup=success`, request.url)
      );
    }

    // MODO: CONNECT - Conectar Strava a cuenta existente
    if (state.mode === 'connect' && state.member_id) {
      const { error: dbError } = await supabase
        .from('strava_connections')
        .upsert({
          member_id: state.member_id,
          strava_athlete_id: athlete.id,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(expires_at * 1000).toISOString(),
          athlete_data: {
            username: athlete.username,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            profile: athlete.profile,
            city: athlete.city,
            country: athlete.country,
          },
        }, {
          onConflict: 'member_id',
        });

      if (dbError) {
        console.error('Error saving Strava connection:', dbError);
        return NextResponse.redirect(
          new URL('/miembros/dashboard?strava_error=db', request.url)
        );
      }

      return NextResponse.redirect(
        new URL('/miembros/dashboard?strava_connected=true', request.url)
      );
    }

    // Fallback
    return NextResponse.redirect(
      new URL('/miembros/login?strava_error=unknown', request.url)
    );
  } catch (error: any) {
    console.error('Error in Strava callback:', error);
    return NextResponse.redirect(
      new URL('/miembros/login?strava_error=unknown', request.url)
    );
  }
}
