import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/cuenta-confirmada';
  const eventSlug = requestUrl.searchParams.get('event_slug');
  const eventTitle = requestUrl.searchParams.get('event_title');

  if (code) {
    const supabase = await createClient();
    
    // Intercambiar el código por una sesión
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Verificar si el perfil de miembro existe, si no, crearlo
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // Si el perfil no existe, crearlo automáticamente
      if (memberError && memberError.code === 'PGRST116') {
        await supabase.from('members').insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Miembro',
          phone: data.user.user_metadata?.phone || null,
          instagram: data.user.user_metadata?.instagram || null,
          membership_type: 'regular',
          membership_status: 'active',
        });
      }

      // Construir URL de redirección con contexto del evento
      let redirectUrl = new URL(next, requestUrl.origin);
      redirectUrl.searchParams.set('email_confirmed', 'true');
      
      if (eventSlug) {
        redirectUrl.searchParams.set('event_slug', eventSlug);
      }
      if (eventTitle) {
        redirectUrl.searchParams.set('event_title', eventTitle);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Si hay un error, redirigir al login con un mensaje de error
  return NextResponse.redirect(
    new URL('/miembros/login?error=confirmation_failed', requestUrl.origin)
  );
}

