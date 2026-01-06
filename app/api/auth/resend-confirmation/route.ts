import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Reenviar email de confirmación con URL de callback configurada
    const redirectUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/callback`;
    
    console.log('📧 Reenviando email de confirmación:', { email, redirectUrl });
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    console.log('📧 Resultado de reenvío:', { error: error?.message });

    if (error) {
      console.error('Error al reenviar email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email de confirmación reenviado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en resend-confirmation:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

