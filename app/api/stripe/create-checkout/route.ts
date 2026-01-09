import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { 
      event_id, 
      member_id, 
      attendee_id, 
      is_guest, 
      coupon_code,
      user_email,
      user_metadata
    } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price, slug, image, max_participants')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // ✅ VALIDAR CUPO DISPONIBLE
    // Solo contar pagos exitosos (paid), NO contar pendientes hasta que se confirmen
    if (event.max_participants) {
      const { count: registrationsCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .eq('payment_status', 'paid');

      const { count: attendeesCount } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .eq('payment_status', 'paid');

      const totalRegistered = (registrationsCount || 0) + (attendeesCount || 0);

      if (totalRegistered >= event.max_participants) {
        return NextResponse.json(
          { 
            error: 'Evento lleno',
            message: `Lo sentimos, este evento ha alcanzado su capacidad máxima de ${event.max_participants} participantes.`
          },
          { status: 400 }
        );
      }

      // Verificar si quedan pocos lugares (10 o menos) y enviar notificación
      const spotsRemaining = event.max_participants - totalRegistered;
      if (spotsRemaining > 0 && spotsRemaining <= 10) {
        console.log(`⚠️ Quedan ${spotsRemaining} lugares disponibles para evento:`, event_id);
        
        // Enviar notificación push a todos los usuarios cuando quedan pocos lugares
        try {
          const { notifyEventNearlyFull } = await import('@/lib/push-notifications');
          await notifyEventNearlyFull({
            id: event.id,
            slug: event.slug,
            title: event.title,
            spotsRemaining: spotsRemaining,
          });
        } catch (pushError) {
          // No fallar el checkout si falla la notificación
          console.error('[Create Checkout] Error enviando notificación push:', pushError);
        }
      }
    }

    // Verificar si el evento requiere pago
    if (!event.price || event.price === '0' || event.price.toLowerCase().includes('gratis')) {
      return NextResponse.json(
        { error: 'Este evento no requiere pago' },
        { status: 400 }
      );
    }

    // Extraer el monto del precio (asumiendo formato: "$500 MXN" o "500")
    const priceMatch = event.price.match(/\d+/);
    if (!priceMatch) {
      return NextResponse.json(
        { error: 'Precio del evento inválido' },
        { status: 400 }
      );
    }

    let amount = parseInt(priceMatch[0]) * 100; // Stripe usa centavos
    let discountAmount = 0;
    let couponData = null;

    // ✅ VALIDAR Y APLICAR CUPÓN DE DESCUENTO
    if (coupon_code) {
      try {
        const couponResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/coupons/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: coupon_code,
            event_id: event_id,
            amount: amount / 100, // Convertir a MXN
          }),
        });

        if (couponResponse.ok) {
          const couponResult = await couponResponse.json();
          
          if (couponResult.valid) {
            discountAmount = Math.round(couponResult.discount_amount * 100); // Convertir a centavos
            amount = Math.round(couponResult.final_amount * 100);
            couponData = couponResult.coupon;
            
            console.log('✅ Cupón aplicado:', {
              code: coupon_code,
              discount: discountAmount / 100,
              final: amount / 100
            });
          }
        }
      } catch (error) {
        console.error('Error validating coupon:', error);
        // Continuar sin cupón si hay error
      }
    }

    // ✅ VALIDAR MÍNIMO DE STRIPE ($10.00 MXN = 1000 centavos)
    const STRIPE_MINIMUM_AMOUNT = 1000; // $10.00 MXN en centavos
    if (amount < STRIPE_MINIMUM_AMOUNT) {
      console.error('❌ Monto menor al mínimo de Stripe:', {
        amount: amount / 100,
        minimum: STRIPE_MINIMUM_AMOUNT / 100,
        event_price: event.price
      });
      
      return NextResponse.json(
        { 
          error: 'Precio mínimo no alcanzado', 
          details: `Stripe requiere un mínimo de $${STRIPE_MINIMUM_AMOUNT / 100} MXN por transacción. El precio del evento ($${amount / 100} MXN) es menor al mínimo requerido.`,
          hint: 'Considera ajustar el precio del evento o usar un método de pago alternativo para eventos de bajo costo.'
        },
        { status: 400 }
      );
    }

    // Obtener o crear cliente de Stripe
    let stripeCustomerId: string | undefined;
    let customerEmail: string | undefined;
    let customerName: string | undefined;

    if (member_id) {
      // Para miembros
      let member = null;
      let memberError = null;
      
      // Intentar obtener el miembro
      const memberResult = await supabase
        .from('members')
        .select('stripe_customer_id, email, full_name')
        .eq('id', member_id)
        .maybeSingle();
      
      member = memberResult.data;
      memberError = memberResult.error;

      console.log('👤 Member lookup:', { member_id, found: !!member, error: memberError });

      // Si el miembro no existe, usar datos del usuario para Stripe
      // (El perfil debería haberse creado en register-event, pero si no existe,
      // podemos crear la sesión de Stripe solo con el email)
      if (!member) {
        console.log('⚠️ Member not found in Stripe checkout, usando datos del usuario...');
        
        // Usar datos del usuario pasados desde register-event
        if (!user_email) {
          console.error('❌ No se proporcionaron datos del usuario');
          return NextResponse.json(
            { 
              error: 'No se pudo obtener información del usuario', 
              details: 'Faltan datos del usuario. Por favor intenta de nuevo.'
            },
            { status: 400 }
          );
        }

        // Usar email y nombre del usuario directamente para Stripe
        // No intentamos crear el perfil aquí porque RLS lo bloquea
        // El perfil debería haberse creado en register-event
        customerEmail = user_email;
        customerName = user_metadata?.full_name || user_email?.split('@')[0] || 'Miembro';
        
        console.log('👤 Usando datos del usuario directamente para Stripe:', { 
          email: customerEmail, 
          name: customerName 
        });
      } else {
        // Si el miembro existe, usar sus datos
        customerEmail = member.email;
        customerName = member.full_name || member.email?.split('@')[0] || 'Miembro';
      }

      // Crear o reutilizar cliente de Stripe (funciona tanto si member existe como si no)
      if (member?.stripe_customer_id) {
        // Cliente ya existe en Stripe - reutilizar para futuros pagos
        stripeCustomerId = member.stripe_customer_id;
        console.log('✅ Cliente Stripe existente reutilizado:', stripeCustomerId);
      } else if (customerEmail) {
        // Crear nuevo cliente en Stripe
        console.log('💳 Creando nuevo cliente en Stripe para:', customerEmail);
        
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            member_id: member_id,
            source: 'runningeraclub',
          },
        });

        stripeCustomerId = customer.id;
        console.log('✅ Nuevo cliente Stripe creado:', stripeCustomerId);

        // Intentar guardar stripe_customer_id en la BD si el perfil existe
        if (member) {
          await supabase
            .from('members')
            .update({ stripe_customer_id: customer.id })
            .eq('id', member_id);
        } else {
          // Si el perfil no existe, el stripe_customer_id se guardará cuando
          // el trigger o register-event cree el perfil
          console.log('⚠️ Perfil no existe aún, stripe_customer_id se guardará cuando se cree el perfil');
        }
      }
    } else if (attendee_id) {
      // Para invitados
      const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .select('stripe_customer_id, email, name')
        .eq('id', attendee_id)
        .maybeSingle();

      console.log('👤 Attendee lookup:', { attendee_id, found: !!attendee, error: attendeeError });

      if (attendee) {
        customerEmail = attendee.email || undefined;
        customerName = attendee.name;

        if (attendee.stripe_customer_id) {
          // Cliente ya existe en Stripe
          stripeCustomerId = attendee.stripe_customer_id;
        } else if (attendee.email) {
          // Buscar si ya existe un cliente con este email
          const existingCustomers = await stripe.customers.list({
            email: attendee.email,
            limit: 1,
          });

          if (existingCustomers.data.length > 0) {
            stripeCustomerId = existingCustomers.data[0].id;
          } else {
            // Crear nuevo cliente en Stripe
            const customer = await stripe.customers.create({
              email: attendee.email,
              name: attendee.name,
              metadata: {
                attendee_id: attendee_id,
                source: 'runningeraclub_guest',
              },
            });

            stripeCustomerId = customer.id;
          }

          // Guardar stripe_customer_id en la BD
          await supabase
            .from('attendees')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', attendee_id);
        }
      }
    }

    // Crear sesión de checkout
    const sessionConfig: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: event.title,
              images: event.image ? [event.image] : [],
              description: couponData ? `Cupón ${couponData.code} aplicado` : undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/eventos/${event.slug}?payment_cancelled=true`,
      metadata: {
        event_id,
        member_id: member_id || '',
        attendee_id: attendee_id || '',
        is_guest: is_guest ? 'true' : 'false',
        coupon_code: couponData ? couponData.code : '',
        discount_amount: discountAmount ? (discountAmount / 100).toString() : '0',
      },
    };

    // Agregar descuento visible en Stripe si hay cupón
    if (couponData && discountAmount > 0) {
      sessionConfig.discounts = [{
        coupon: await createStripeCoupon(couponData, discountAmount / 100)
      }];
    }

    // Agregar customer si existe
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Stripe session creada:', { 
      sessionId: session.id, 
      url: session.url,
      hasUrl: !!session.url 
    });

    // Validar que la sesión tenga URL
    if (!session.url) {
      console.error('❌ Stripe session creada pero sin URL');
      return NextResponse.json(
        { 
          error: 'Error al crear sesión de pago', 
          details: 'La sesión de Stripe no tiene URL. Por favor intenta de nuevo.'
        },
        { status: 500 }
      );
    }

    // Crear transacción pendiente usando Service Role Key para bypass RLS
    try {
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { error: transactionError } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
          event_id,
          member_id: member_id || null,
          attendee_id: attendee_id || null,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string || null,
          amount: amount / 100,
          currency: 'mxn',
          status: 'pending',
          metadata: {
            stripe_customer_id: stripeCustomerId,
            coupon_code: couponData?.code,
            discount_amount: discountAmount / 100,
            original_amount: parseInt(priceMatch[0]),
          },
        });

      if (transactionError) {
        console.error('⚠️ Error creating transaction (no crítico):', transactionError);
        // No fallar si la transacción no se crea, es solo para tracking
      } else {
        console.log('✅ Transaction created successfully');
      }
    } catch (error) {
      console.error('⚠️ Error creating transaction (no crítico):', error);
      // No fallar si la transacción no se crea
    }

    // Registrar uso del cupón si se aplicó (usando Service Role Key)
    if (couponData && discountAmount > 0) {
      try {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        await supabaseAdmin
          .from('coupon_usage')
          .insert({
            coupon_id: couponData.id,
            member_id: member_id || null,
            attendee_id: attendee_id || null,
            event_id: event_id,
            discount_amount: discountAmount / 100,
            original_amount: parseInt(priceMatch[0]),
            final_amount: amount / 100,
          });

        // Incrementar contador de uso del cupón
        await supabaseAdmin
          .from('coupons')
          .update({ used_count: supabaseAdmin.rpc('increment', { row_id: couponData.id }) })
          .eq('id', couponData.id);
      } catch (couponError) {
        console.error('⚠️ Error registrando uso de cupón (no crítico):', couponError);
        // No fallar si el cupón no se registra
      }
    }

    console.log('✅ Retornando respuesta exitosa con URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      discount_applied: discountAmount > 0,
      discount_amount: discountAmount / 100,
      final_amount: amount / 100,
    });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    
    // Errores específicos de Stripe
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { 
          error: 'Error de configuración de pago', 
          details: error.message,
          hint: 'Verifica que las claves de Stripe estén configuradas correctamente en Vercel'
        },
        { status: 500 }
      );
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          error: 'Error de autenticación con Stripe', 
          details: 'Las credenciales de Stripe son inválidas',
          hint: 'Configura STRIPE_SECRET_KEY en las variables de entorno de Vercel'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear sesión de pago', 
        details: error.message,
        type: error.type || 'Unknown'
      },
      { status: 500 }
    );
  }
}

// Helper para crear cupón en Stripe (para visualización)
async function createStripeCoupon(couponData: any, discountAmount: number) {
  try {
    const stripeCoupon = await stripe.coupons.create({
      name: couponData.code,
      amount_off: Math.round(discountAmount * 100),
      currency: 'mxn',
      duration: 'once',
    });
    return stripeCoupon.id;
  } catch (error) {
    console.error('Error creating Stripe coupon:', error);
    // Si falla, continuar sin mostrarlo en Stripe
    return undefined;
  }
}

