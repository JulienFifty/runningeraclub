import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { event_id, member_id, attendee_id, is_guest, coupon_code } = await request.json();

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
    if (event.max_participants) {
      const { count: registrationsCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('payment_status', ['paid', 'pending']);

      const { count: attendeesCount } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('payment_status', ['paid', 'pending']);

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

      // Verificar si queda solo 1 cupo
      if (totalRegistered === event.max_participants - 1) {
        console.log('⚠️ Último cupo disponible para evento:', event_id);
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

    // Obtener o crear cliente de Stripe
    let stripeCustomerId: string | undefined;
    let customerEmail: string | undefined;
    let customerName: string | undefined;

    if (member_id) {
      // Para miembros
      const { data: member } = await supabase
        .from('members')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', member_id)
        .single();

      if (member) {
        customerEmail = member.email;
        customerName = `${member.first_name} ${member.last_name}`;

        if (member.stripe_customer_id) {
          // Cliente ya existe en Stripe
          stripeCustomerId = member.stripe_customer_id;
        } else {
          // Crear nuevo cliente en Stripe
          const customer = await stripe.customers.create({
            email: member.email,
            name: customerName,
            metadata: {
              member_id: member_id,
              source: 'runningeraclub',
            },
          });

          stripeCustomerId = customer.id;

          // Guardar stripe_customer_id en la BD
          await supabase
            .from('members')
            .update({ stripe_customer_id: customer.id })
            .eq('id', member_id);
        }
      }
    } else if (attendee_id) {
      // Para invitados
      const { data: attendee } = await supabase
        .from('attendees')
        .select('stripe_customer_id, email, name')
        .eq('id', attendee_id)
        .single();

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
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/eventos/${event.slug}`,
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

    // Crear transacción pendiente
    const { error: transactionError } = await supabase
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
      console.error('Error creating transaction:', transactionError);
    }

    // Registrar uso del cupón si se aplicó
    if (couponData && discountAmount > 0) {
      await supabase
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
      await supabase
        .from('coupons')
        .update({ used_count: supabase.rpc('increment', { row_id: couponData.id }) })
        .eq('id', couponData.id);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      discount_applied: discountAmount > 0,
      discount_amount: discountAmount / 100,
      final_amount: amount / 100,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error al crear sesión de pago', details: error.message },
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

