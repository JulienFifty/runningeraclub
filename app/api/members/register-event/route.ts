import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { event_id } = await request.json();

    console.log('📝 Register event request:', { event_id });

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('👤 User check:', { user: user?.id, authError });

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price, slug')
      .eq('id', event_id)
      .single();

    console.log('🎫 Event check:', { event, eventError });

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el evento requiere pago
    const requiresPayment = event.price && 
      event.price !== '0' && 
      !event.price.toLowerCase().includes('gratis') &&
      !event.price.toLowerCase().includes('free');

    console.log('💰 Payment check:', { price: event.price, requiresPayment });

    // Verificar si el miembro ya existe en la tabla members
    let { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    console.log('👥 Member check:', { member, memberError });

    // Si el miembro no existe, intentar crearlo (fallback si el trigger falló)
    if (!member) {
      console.log('⚠️ Member not found, creating profile...');
      
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Miembro',
          phone: user.user_metadata?.phone || null,
          instagram: user.user_metadata?.instagram || null,
          membership_type: 'regular',
          membership_status: 'active',
        })
        .select('id, email, full_name')
        .single();

      console.log('👥 Member created:', { newMember, createError });

      if (createError || !newMember) {
        console.error('❌ Failed to create member profile:', createError);
        return NextResponse.json(
          { 
            error: 'Error al crear perfil de miembro', 
            details: createError?.message || 'No se pudo crear el perfil. Por favor intenta de nuevo.'
          },
          { status: 500 }
        );
      }

      // Actualizar la variable member para usar el perfil recién creado
      member = newMember;
      console.log('✅ Member profile created successfully, proceeding with registration');
    }

    // Verificar si ya está registrado
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id, payment_status, registration_date, stripe_session_id')
      .eq('member_id', user.id)
      .eq('event_id', event_id)
      .maybeSingle();

    console.log('✅ Registration check:', { existingRegistration });

    // Variable para rastrear si debemos reutilizar un registro existente
    let reuseExistingRegistration = false;
    let existingRegistrationId: string | null = null;

    if (existingRegistration) {
      // Si el pago está completado, rechazar
      if (existingRegistration.payment_status === 'paid') {
        return NextResponse.json(
          { error: 'Ya estás registrado en este evento' },
          { status: 400 }
        );
      }

      // Si el pago está pendiente
      if (existingRegistration.payment_status === 'pending') {
        // Verificar si tiene stripe_session_id activo
        if (existingRegistration.stripe_session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(existingRegistration.stripe_session_id);
            
            // Si la sesión está completa, actualizar el registro
            if (session.payment_status === 'paid') {
              await supabase
                .from('event_registrations')
                .update({
                  payment_status: 'paid',
                  status: 'confirmed',
                })
                .eq('id', existingRegistration.id);
              
              return NextResponse.json(
                { error: 'Ya estás registrado en este evento (pago completado)' },
                { status: 400 }
              );
            }
            
            // Si la sesión está abierta, devolver la URL
            if (session.status === 'open' && session.url) {
              return NextResponse.json({
                success: true,
                requires_payment: true,
                checkout_url: session.url,
                message: 'Tienes un pago pendiente, continuando con la sesión existente',
              });
            }
          } catch (error) {
            console.error('Error verificando sesión de Stripe:', error);
            // Si hay error con la sesión, reutilizar el registro existente
          }
        }
        
        // Si llegamos aquí, el registro pendiente no tiene sesión válida
        // Reutilizaremos este registro en lugar de crear uno nuevo
        console.log('⚠️ Registro pendiente encontrado sin sesión válida, reutilizando...');
        reuseExistingRegistration = true;
        existingRegistrationId = existingRegistration.id;
      }
    }

    if (requiresPayment) {
      // Si requiere pago, crear sesión de Stripe
      console.log('💳 Creating Stripe checkout session...');
      
      // Pasar datos del usuario y miembro al endpoint de Stripe
      const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id,
          member_id: user.id,
          is_guest: false,
          // Pasar datos del usuario para crear perfil si no existe
          user_email: user.email,
          user_metadata: {
            full_name: user.user_metadata?.full_name,
            phone: user.user_metadata?.phone,
            instagram: user.user_metadata?.instagram,
          },
        }),
      });

      const checkoutData = await checkoutResponse.json();
      
      console.log('💳 Checkout response:', { 
        ok: checkoutResponse.ok, 
        status: checkoutResponse.status,
        data: checkoutData 
      });

      if (!checkoutResponse.ok) {
        console.error('❌ Error en checkout:', checkoutData);
        return NextResponse.json(
          { 
            error: 'Error al crear sesión de pago', 
            details: checkoutData.details || checkoutData.error || 'Error desconocido al crear sesión de pago'
          },
          { status: checkoutResponse.status || 500 }
        );
      }

      // Validar que tenemos la URL
      if (!checkoutData.url) {
        console.error('❌ Checkout exitoso pero sin URL:', checkoutData);
        return NextResponse.json(
          { 
            error: 'Error al crear sesión de pago', 
            details: 'No se recibió la URL de pago de Stripe'
          },
          { status: 500 }
        );
      }

      // Crear o actualizar registro pendiente de pago
      if (reuseExistingRegistration && existingRegistrationId) {
        // Actualizar registro existente con el nuevo stripe_session_id
        const { error: updateError } = await supabase
          .from('event_registrations')
          .update({
            stripe_session_id: checkoutData.sessionId,
            registration_date: new Date().toISOString(),
          })
          .eq('id', existingRegistrationId);

        console.log('📋 Registration updated:', { updateError });

        if (updateError) {
          console.error('❌ Error actualizando registro:', updateError);
        } else {
          console.log('✅ Registro existente actualizado con nueva sesión de Stripe');
        }
      } else {
        // Crear nuevo registro
        const { error: registrationError } = await supabase
          .from('event_registrations')
          .insert({
            member_id: user.id,
            event_id: event_id,
            status: 'pending',
            payment_status: 'pending',
            stripe_session_id: checkoutData.sessionId,
          });

        console.log('📋 Registration created:', { registrationError });

        if (registrationError) {
          console.error('❌ Error creando registro:', registrationError);
          // No fallar aquí, el pago ya se inició
          // Solo loguear el error
        }
      }

      console.log('✅ Retornando checkout_url:', checkoutData.url);

      return NextResponse.json({
        success: true,
        requires_payment: true,
        checkout_url: checkoutData.url,
      });
    } else {
      // Registro gratuito
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          member_id: user.id,
          event_id: event_id,
          status: 'confirmed',
          payment_status: 'paid', // Marcar como "pagado" para eventos gratuitos
        });

      console.log('📋 Free registration created:', { registrationError });

      if (registrationError) {
        return NextResponse.json(
          { error: 'Error al registrarse', details: registrationError.message },
          { status: 500 }
        );
      }

      // Enviar notificación push al usuario cuando se registra a un evento gratuito
      try {
        const { notifyFreeEventRegistration } = await import('@/lib/push-notifications');
        await notifyFreeEventRegistration(user.id, {
          title: event.title,
          slug: event.slug,
        });
      } catch (pushError) {
        // No fallar el registro si falla la notificación
        console.error('[Register Event] Error enviando notificación push:', pushError);
      }

      // Enviar correo de confirmación para eventos gratuitos
      if (member?.email) {
        try {
          // Obtener información completa del evento
          const { data: eventData } = await supabase
            .from('events')
            .select('title, date, location')
            .eq('id', event_id)
            .single();

          // Enviar correo de confirmación
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/email/send-event-confirmation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: member.email,
                name: member.full_name,
                event_id: event_id,
                event_title: eventData?.title || event.title,
                event_date: eventData?.date,
                event_location: eventData?.location,
                amount: 0, // Evento gratuito
                currency: 'MXN',
              }),
            }
          );

          if (emailResponse.ok) {
            console.log('✅ Email de confirmación enviado para evento gratuito a:', member.email);
          } else {
            console.warn('⚠️ Error al enviar email de confirmación:', await emailResponse.text());
          }
        } catch (emailError: any) {
          console.error('❌ Error enviando email de confirmación para evento gratuito:', emailError);
          // No fallar el registro si falla el email
        }
      }

      return NextResponse.json({
        success: true,
        requires_payment: false,
      });
    }
  } catch (error: any) {
    console.error('❌ Error in register-event:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
