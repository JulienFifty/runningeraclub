import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      name, 
      event_id, 
      event_title, 
      event_date, 
      event_location,
      amount,
      currency = 'MXN'
    } = await request.json();

    if (!email || !event_id) {
      return NextResponse.json(
        { error: 'email y event_id son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Obtener información completa del evento si no se proporciona
    let finalEventTitle = event_title || 'Evento';
    let finalEventDate = event_date || '';
    let finalEventLocation = event_location || '';

    if (!event_title || !event_date) {
      const { data: event } = await supabase
        .from('events')
        .select('title, date, location')
        .eq('id', event_id)
        .single();

      if (event) {
        finalEventTitle = event.title;
        finalEventDate = event.date;
        finalEventLocation = event.location;
      }
    }

    // Formatear fecha
    let formattedDate = finalEventDate;
    if (finalEventDate) {
      try {
        const date = new Date(finalEventDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch (e) {
        // Usar fecha original si falla el formateo
      }
    }

    // Usar Supabase para enviar el correo (si está configurado)
    // O usar Resend si está disponible
    const emailContent = {
      to: email,
      subject: `Confirmación de registro - ${finalEventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de Registro</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 300;">RUNNING ERA</h1>
          </div>
          
          <div style="background: #fff; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #000; margin-top: 0; font-size: 24px; font-weight: 400;">¡Registro Confirmado!</h2>
            
            <p style="color: #666; font-size: 16px;">Hola ${name || 'Invitado'},</p>
            
            <p style="color: #666; font-size: 16px;">
              Tu registro al evento ha sido confirmado exitosamente. Te esperamos en:
            </p>
            
            <div style="background: #f9f9f9; border-left: 4px solid #000; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <h3 style="color: #000; margin-top: 0; font-size: 20px; font-weight: 500;">${finalEventTitle}</h3>
              
              ${finalEventDate ? `
                <p style="color: #666; margin: 10px 0;">
                  <strong style="color: #000;">Fecha:</strong> ${formattedDate}
                </p>
              ` : ''}
              
              ${finalEventLocation ? `
                <p style="color: #666; margin: 10px 0;">
                  <strong style="color: #000;">Ubicación:</strong> ${finalEventLocation}
                </p>
              ` : ''}
              
              ${amount && amount > 0 ? `
                <p style="color: #666; margin: 10px 0;">
                  <strong style="color: #000;">Monto pagado:</strong> $${amount.toFixed(2)} ${currency}
                </p>
              ` : ''}
            </div>
            
            <p style="color: #666; font-size: 16px;">
              <strong>Importante:</strong> Guarda este correo para tener acceso a la información del evento. 
              Recibirás recordatorios y actualizaciones importantes antes del evento.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                ¿Quieres crear una cuenta para gestionar tus registros?<br>
                <a href="${process.env.NEXT_PUBLIC_URL || 'https://runningeraclub.com'}/miembros/login?signup=true" style="color: #000; text-decoration: underline;">Crear cuenta ahora</a>
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://runningeraclub.com'}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500;">Visitar nuestro sitio</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">RUNNING ERA Club</p>
            <p style="margin: 5px 0 0 0;">Este es un correo automático, por favor no respondas.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        ¡Registro Confirmado!
        
        Hola ${name || 'Invitado'},
        
        Tu registro al evento ha sido confirmado exitosamente.
        
        Evento: ${finalEventTitle}
        ${finalEventDate ? `Fecha: ${formattedDate}` : ''}
        ${finalEventLocation ? `Ubicación: ${finalEventLocation}` : ''}
        ${amount && amount > 0 ? `Monto pagado: $${amount.toFixed(2)} ${currency}` : ''}
        
        Importante: Guarda este correo para tener acceso a la información del evento.
        
        ¿Quieres crear una cuenta? Visita: ${process.env.NEXT_PUBLIC_URL || 'https://runningeraclub.com'}/miembros/login?signup=true
        
        RUNNING ERA Club
      `,
    };

    // Intentar enviar usando Resend si está configurado
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'RUNNING ERA <onboarding@resend.dev>',
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          }),
        });

        if (resendResponse.ok) {
          const result = await resendResponse.json();
          console.log('✅ Email enviado exitosamente vía Resend:', result);
          return NextResponse.json({ 
            success: true, 
            message: 'Correo enviado exitosamente',
            id: result.id 
          });
        } else {
          const error = await resendResponse.text();
          console.error('❌ Error enviando email con Resend:', error);
          // Continuar con método alternativo
        }
      } catch (resendError: any) {
        console.error('❌ Error en llamada a Resend:', resendError);
        // Continuar con método alternativo
      }
    }

    // Método alternativo: usar Supabase (si tiene SMTP configurado)
    try {
      // Usar la función de Supabase para enviar correo si está disponible
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: emailContent,
      });

      if (!emailError) {
        return NextResponse.json({ success: true, message: 'Correo enviado exitosamente vía Supabase' });
      }
    } catch (e) {
      // Supabase Functions no disponible
    }

    // Si no hay servicio configurado, loguear para debugging
    console.log('📧 Email de confirmación que se debería enviar:', {
      to: email,
      subject: emailContent.subject,
      event: finalEventTitle,
      note: 'Configura RESEND_API_KEY en variables de entorno para enviar correos',
    });

    // Retornar éxito aunque no se haya enviado (para no bloquear el flujo)
    // En producción, se debe configurar Resend o similar
    return NextResponse.json({ 
      success: true, 
      message: 'Correo de confirmación procesado',
      note: resendApiKey ? 'Error al enviar, pero procesado correctamente' : 'Configura RESEND_API_KEY para enviar correos'
    });
  } catch (error: any) {
    console.error('❌ Error sending confirmation email:', error);
    return NextResponse.json(
      { 
        error: 'Error al enviar correo de confirmación', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
