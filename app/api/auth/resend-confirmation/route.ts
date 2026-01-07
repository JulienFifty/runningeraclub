import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, event_slug, event_title } = await request.json();

    if (!email) {
      console.error('❌ Email no proporcionado');
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Log del intento
    console.log('👤 Intentando reenviar para:', { email, event_slug, event_title });

    // Construir URL de callback con contexto del evento si existe
    let redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/callback`;
    if (event_slug) {
      const callbackParams = new URLSearchParams();
      callbackParams.set('event_slug', event_slug);
      if (event_title) callbackParams.set('event_title', event_title);
      redirectUrl += `?${callbackParams.toString()}`;
    }
    
    console.log('📧 Intentando reenviar email:', { 
      email, 
      redirectUrl,
      event_slug,
      event_title,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    console.log('📧 Respuesta de Supabase:', { 
      success: !error,
      data,
      error: error?.message,
      errorDetails: error
    });

    if (error) {
      console.error('❌ Error al reenviar email:', {
        message: error.message,
        status: error.status,
        code: error.code,
        fullError: error
      });
      
      // Mensajes más descriptivos según el error
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return NextResponse.json(
          { 
            error: 'Demasiados intentos. Espera 60 segundos antes de reenviar.',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        );
      }
      
      if (error.message?.includes('already confirmed')) {
        return NextResponse.json(
          { 
            error: 'Este email ya está confirmado. Intenta iniciar sesión.',
            code: 'ALREADY_CONFIRMED'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message, code: error.code || 'UNKNOWN' },
        { status: 400 }
      );
    }

    console.log('✅ Email reenviado exitosamente:', { email, timestamp: new Date().toISOString() });
    
    return NextResponse.json({
      success: true,
      message: 'Email de confirmación reenviado exitosamente. Revisa tu bandeja (y spam) en 2-5 minutos.',
    });
  } catch (error: any) {
    console.error('💥 Error inesperado en resend-confirmation:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    );
  }
}

