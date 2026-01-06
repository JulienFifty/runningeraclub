import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { data: member, error: memberError } = await supabase
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
      .select('id')
      .eq('member_id', user.id)
      .eq('event_id', event_id)
      .maybeSingle();

    console.log('✅ Registration check:', { existingRegistration });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya estás registrado en este evento' },
        { status: 400 }
      );
    }

    if (requiresPayment) {
      // Si requiere pago, crear sesión de Stripe
      console.log('💳 Creating Stripe checkout session...');
      
      const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id,
          member_id: user.id,
          is_guest: false,
        }),
      });

      const checkoutData = await checkoutResponse.json();
      
      console.log('💳 Checkout response:', { ok: checkoutResponse.ok, data: checkoutData });

      if (!checkoutResponse.ok) {
        return NextResponse.json(
          { error: 'Error al crear sesión de pago', details: checkoutData.error },
          { status: 500 }
        );
      }

      // Crear registro pendiente de pago
      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          member_id: user.id,
          event_id: event_id,
          status: 'pending',
          payment_status: 'pending',
        });

      console.log('📋 Registration created:', { registrationError });

      if (registrationError) {
        return NextResponse.json(
          { error: 'Error al crear registro', details: registrationError.message },
          { status: 500 }
        );
      }

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
