import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Usar service role key para bypass RLS
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

    // Manejar diferentes tipos de eventos
    // Usar try-catch interno para que errores no causen reintentos infinitos
    try {
      switch (event.type) {
      // ✅ EVENTO PRINCIPAL: Cuando el checkout se completa exitosamente
      case 'checkout.session.completed': {
        let session = event.data.object as Stripe.Checkout.Session;
        
        // Si no tenemos customer_details, hacer un retrieve para obtenerlos
        if (!session.customer_details && session.id) {
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['customer', 'customer_details'],
            });
            session = fullSession as Stripe.Checkout.Session;
          } catch (retrieveError) {
            console.error('⚠️ Error retrieving full session details:', retrieveError);
            // Continuar con la sesión original
          }
        }
        
        console.log('✅ Checkout session completed:', {
          session_id: session.id,
          payment_status: session.payment_status,
          payment_intent: session.payment_intent,
          metadata: session.metadata,
          customer_email: session.customer_details?.email || session.customer_email,
          customer_name: session.customer_details?.name,
        });

        // Actualizar transacción
        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
            payment_method: session.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_session_id', session.id);

        if (transactionError) {
          console.error('⚠️ Error updating transaction:', transactionError);
        } else {
          console.log('✅ Transaction updated successfully');
        }

        const metadata = session.metadata;
        if (!metadata) {
          console.error('❌ No metadata found in session:', session.id);
          break;
        }

        const { event_id, member_id, attendee_id, is_guest, guest_name, guest_email, guest_phone } = metadata;
        console.log('📋 Webhook metadata:', { event_id, member_id, attendee_id, is_guest, guest_name, guest_email });

        if (is_guest === 'true') {
          // Para pago rápido sin cuenta: crear o actualizar attendee cuando el pago se complete
          if (attendee_id) {
            // Si ya existe attendee_id (registro manual previo), actualizar
            const { data: updateData, error: updateError } = await supabase
              .from('attendees')
              .update({
                payment_status: 'paid',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'mxn',
                payment_method: session.payment_method_types?.[0] || 'card',
              })
              .eq('id', attendee_id)
              .select();

            if (updateError) {
              console.error('❌ Error updating attendee:', updateError);
            } else {
              console.log('✅ Attendee updated successfully:', updateData);
            }
          } else {
            // Si es pago rápido sin cuenta (no existe attendee_id), crear el attendee ahora que el pago está completo
            // Obtener email del customer de Stripe (prioridad: metadata > customer_details > customer_email)
            const customerEmail = guest_email || session.customer_details?.email || (session as any).customer_email || null;
            const customerName = guest_name || session.customer_details?.name || 'Invitado';
            
            // IMPORTANTE: Solo crear si el pago está realmente completado
            if (session.payment_status !== 'paid') {
              console.warn('⚠️ Payment status is not "paid", skipping attendee creation:', session.payment_status);
              break;
            }
            
            // Solo crear si tenemos al menos un nombre
            if (!customerName && !customerEmail) {
              console.warn('⚠️ No se puede crear attendee: faltan nombre y email del customer');
              break;
            }
            
            console.log('🆕 Creating attendee for guest checkout:', { 
              guest_name: customerName, 
              guest_email: customerEmail, 
              event_id,
              session_id: session.id,
              payment_status: session.payment_status
            });
            
            const { data: newAttendee, error: createError } = await supabase
              .from('attendees')
              .insert({
                event_id: event_id,
                name: customerName || 'Invitado',
                email: customerEmail,
                phone: guest_phone || null,
                tickets: 1,
                status: 'registered',
                payment_status: 'paid', // IMPORTANTE: solo crear cuando el pago está completo
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'mxn',
                payment_method: session.payment_method_types?.[0] || 'card',
                notes: 'Registro rápido sin cuenta - Pago completado',
              })
              .select()
              .single();

            if (createError) {
              console.error('❌ Error creating attendee for guest checkout:', createError);
            } else {
              console.log('✅ Attendee created successfully for guest checkout:', newAttendee);
            }
          }
        } else if (member_id && event_id) {
          // Primero intentar actualizar el registro existente
          const { data: existingRegistration, error: findError } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('member_id', member_id)
            .eq('event_id', event_id)
            .maybeSingle();

          console.log('🔍 Existing registration check:', { 
            found: !!existingRegistration, 
            error: findError 
          });

          if (existingRegistration) {
            // Actualizar registro existente
            const { data: updateData, error: updateError } = await supabase
              .from('event_registrations')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'mxn',
                payment_method: session.payment_method_types?.[0] || 'card',
              })
              .eq('id', existingRegistration.id)
              .select();

            if (updateError) {
              console.error('❌ Error updating event registration:', updateError);
            } else {
              console.log('✅ Event registration updated successfully:', updateData);
              
              // Crear o actualizar registro en attendees para check-in
              try {
                // Obtener información del miembro
                const { data: memberData } = await supabase
                  .from('members')
                  .select('id, email, full_name, phone')
                  .eq('id', member_id)
                  .single();

                if (memberData) {
                  // Verificar si ya existe un attendee para este miembro y evento
                  const { data: existingAttendee } = await supabase
                    .from('attendees')
                    .select('id')
                    .eq('event_id', event_id)
                    .eq('email', memberData.email)
                    .maybeSingle();

                  if (existingAttendee) {
                    // Actualizar attendee existente
                    const { error: attendeeUpdateError } = await supabase
                      .from('attendees')
                      .update({
                        payment_status: 'paid',
                        status: 'registered',
                        stripe_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent as string,
                        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || 'mxn',
                        payment_method: session.payment_method_types?.[0] || 'card',
                      })
                      .eq('id', existingAttendee.id);

                    if (attendeeUpdateError) {
                      console.error('❌ Error updating attendee:', attendeeUpdateError);
                    } else {
                      console.log('✅ Attendee updated successfully');
                    }
                  } else {
                    // Crear nuevo attendee
                    const { error: attendeeCreateError } = await supabase
                      .from('attendees')
                      .insert({
                        event_id: event_id,
                        name: memberData.full_name || memberData.email,
                        email: memberData.email,
                        phone: memberData.phone || null,
                        payment_status: 'paid',
                        status: 'registered',
                        stripe_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent as string,
                        amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || 'mxn',
                        payment_method: session.payment_method_types?.[0] || 'card',
                      });

                    if (attendeeCreateError) {
                      console.error('❌ Error creating attendee:', attendeeCreateError);
                    } else {
                      console.log('✅ Attendee created successfully for check-in');
                    }
                  }
                }
              } catch (attendeeError) {
                // No fallar el webhook si falla la creación de attendee
                console.error('[Webhook] Error creating/updating attendee:', attendeeError);
              }
              
              // Enviar notificación push al usuario cuando se confirma el pago
              try {
                // Obtener información del evento
                const { data: eventData } = await supabase
                  .from('events')
                  .select('title, slug')
                  .eq('id', event_id)
                  .single();

                if (eventData) {
                  const { notifyPaymentSuccess } = await import('@/lib/push-notifications');
                  await notifyPaymentSuccess(member_id, {
                    title: eventData.title,
                    slug: eventData.slug,
                  });
                }
              } catch (pushError) {
                // No fallar el webhook si falla la notificación
                console.error('[Webhook] Error enviando notificación push:', pushError);
              }
            }
          } else {
            // Si no existe, crearlo (fallback)
            console.log('⚠️ Registration not found, creating new one...');
            
            // Verificar que el miembro existe
            const { data: member, error: memberError } = await supabase
              .from('members')
              .select('id, email')
              .eq('id', member_id)
              .maybeSingle();

            if (memberError || !member) {
              console.error('❌ Member not found:', { member_id, error: memberError });
            } else {
              // Crear el registro
                const { data: newRegistration, error: createError } = await supabase
                  .from('event_registrations')
                  .upsert(
                    {
                      member_id: member_id,
                      event_id: event_id,
                      status: 'confirmed',
                      payment_status: 'paid',
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: session.payment_intent as string,
                      amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                      currency: session.currency || 'mxn',
                      payment_method: session.payment_method_types?.[0] || 'card',
                    },
                    { onConflict: 'member_id,event_id', ignoreDuplicates: false }
                  )
                  .select();

              if (createError) {
                console.error('❌ Error creating event registration:', createError);
              } else {
                console.log('✅ Event registration created successfully:', newRegistration);
                
                // Enviar notificación push al usuario cuando se confirma el pago
                try {
                  // Obtener información del evento
                  const { data: eventData } = await supabase
                    .from('events')
                    .select('title, slug')
                    .eq('id', event_id)
                    .single();

                  if (eventData) {
                    const { notifyPaymentSuccess } = await import('@/lib/push-notifications');
                    await notifyPaymentSuccess(member_id, {
                      title: eventData.title,
                      slug: eventData.slug,
                    });
                  }
                } catch (pushError) {
                  // No fallar el webhook si falla la notificación
                  console.error('[Webhook] Error enviando notificación push:', pushError);
                }
              }
            }
          }
        } else {
          console.error('❌ Missing required metadata:', { member_id, event_id, attendee_id });
        }
        break;
      }

      // ✅ Cuando el pago se procesa exitosamente (backup)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('✅ Payment intent succeeded:', {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
        });
        
        // Actualizar transacción
        await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            payment_method: paymentIntent.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Buscar registro por payment_intent_id para actualizarlo
        const { data: registrationByPI } = await supabase
          .from('event_registrations')
          .select('id, member_id, event_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .maybeSingle();

        if (registrationByPI) {
          // Actualizar registro encontrado por payment_intent_id
          const { error: updateError } = await supabase
            .from('event_registrations')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              amount_paid: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
              currency: paymentIntent.currency || 'mxn',
              payment_method: paymentIntent.payment_method_types?.[0] || 'card',
            })
            .eq('id', registrationByPI.id);

          if (updateError) {
            console.error('❌ Error updating registration by payment_intent_id:', updateError);
          } else {
            console.log('✅ Registration updated by payment_intent_id:', registrationByPI.id);
          }
        } else {
          // Si no encontramos por payment_intent_id, buscar la sesión de checkout
          // para obtener los metadata (event_id, member_id)
          try {
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntent.id,
              limit: 1,
            });

            if (sessions.data.length > 0) {
              const session = sessions.data[0];
              const metadata = session.metadata;
              
              if (metadata && metadata.event_id && metadata.member_id) {
                console.log('📋 Found checkout session, updating registration:', {
                  session_id: session.id,
                  event_id: metadata.event_id,
                  member_id: metadata.member_id,
                });

                // Buscar o crear registro usando metadata
                const { data: existingReg } = await supabase
                  .from('event_registrations')
                  .select('id')
                  .eq('member_id', metadata.member_id)
                  .eq('event_id', metadata.event_id)
                  .maybeSingle();

                if (existingReg) {
                  // Actualizar registro existente
                  const { error: updateError } = await supabase
                    .from('event_registrations')
                    .update({
                      payment_status: 'paid',
                      status: 'confirmed',
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: paymentIntent.id,
                      amount_paid: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
                      currency: paymentIntent.currency || 'mxn',
                      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                    })
                    .eq('id', existingReg.id);

                  if (updateError) {
                    console.error('❌ Error updating registration:', updateError);
                  } else {
                    console.log('✅ Registration updated successfully:', existingReg.id);
                    
                    // Crear o actualizar registro en attendees para check-in
                    try {
                      // Obtener información del miembro
                      const { data: memberData } = await supabase
                        .from('members')
                        .select('id, email, full_name, phone')
                        .eq('id', metadata.member_id)
                        .single();

                      if (memberData) {
                        // Verificar si ya existe un attendee para este miembro y evento
                        const { data: existingAttendee } = await supabase
                          .from('attendees')
                          .select('id')
                          .eq('event_id', metadata.event_id)
                          .eq('email', memberData.email)
                          .maybeSingle();

                        if (existingAttendee) {
                          // Actualizar attendee existente
                          const { error: attendeeUpdateError } = await supabase
                            .from('attendees')
                            .update({
                              payment_status: 'paid',
                              status: 'registered',
                              stripe_session_id: session.id,
                              stripe_payment_intent_id: paymentIntent.id,
                              amount_paid: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
                              currency: paymentIntent.currency || 'mxn',
                              payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                            })
                            .eq('id', existingAttendee.id);

                          if (attendeeUpdateError) {
                            console.error('❌ Error updating attendee:', attendeeUpdateError);
                          } else {
                            console.log('✅ Attendee updated successfully');
                          }
                        } else {
                          // Crear nuevo attendee
                          const { error: attendeeCreateError } = await supabase
                            .from('attendees')
                            .insert({
                              event_id: metadata.event_id,
                              name: memberData.full_name || memberData.email,
                              email: memberData.email,
                              phone: memberData.phone || null,
                              payment_status: 'paid',
                              status: 'registered',
                              stripe_session_id: session.id,
                              stripe_payment_intent_id: paymentIntent.id,
                              amount_paid: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
                              currency: paymentIntent.currency || 'mxn',
                              payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                            });

                          if (attendeeCreateError) {
                            console.error('❌ Error creating attendee:', attendeeCreateError);
                          } else {
                            console.log('✅ Attendee created successfully for check-in');
                          }
                        }
                      }
                    } catch (attendeeError) {
                      // No fallar el webhook si falla la creación de attendee
                      console.error('[Webhook] Error creating/updating attendee:', attendeeError);
                    }
                    
                    // Enviar notificación push al usuario cuando se confirma el pago
                    try {
                      // Obtener información del evento
                      const { data: eventData } = await supabase
                        .from('events')
                        .select('title, slug')
                        .eq('id', metadata.event_id)
                        .single();

                      if (eventData) {
                        const { notifyPaymentSuccess } = await import('@/lib/push-notifications');
                        await notifyPaymentSuccess(metadata.member_id, {
                          title: eventData.title,
                          slug: eventData.slug,
                        });
                      }
                    } catch (pushError) {
                      // No fallar el webhook si falla la notificación
                      console.error('[Webhook] Error enviando notificación push:', pushError);
                    }
                  }
                } else {
                  // Crear registro si no existe
                  const { data: newReg, error: createError } = await supabase
                    .from('event_registrations')
                    .insert({
                      member_id: metadata.member_id,
                      event_id: metadata.event_id,
                      status: 'confirmed',
                      payment_status: 'paid',
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: paymentIntent.id,
                      amount_paid: paymentIntent.amount ? paymentIntent.amount / 100 : 0,
                      currency: paymentIntent.currency || 'mxn',
                      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                    })
                    .select();

                  if (createError) {
                    console.error('❌ Error creating registration:', createError);
                  } else {
                    console.log('✅ Registration created successfully:', newReg);
                  }
                }
              }
            }
          } catch (sessionError) {
            console.error('⚠️ Error fetching checkout session:', sessionError);
          }
        }
        break;
      }

      // ❌ Cuando el pago falla
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('❌ Payment intent failed:', paymentIntent.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // También actualizar el registro si existe
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // 🔄 Cuando se cancela un pago
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('🔄 Payment intent canceled:', paymentIntent.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // 💰 Cuando se procesa un reembolso
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        console.log('💰 Charge refunded:', charge.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        // Actualizar registros de eventos
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        // Actualizar attendees
        await supabase
          .from('attendees')
          .update({
            payment_status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);
        break;
      }

      // 📧 Cuando el checkout está pendiente (ej: OXXO)
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('📧 Async payment succeeded:', session.id);
        
        // Mismo manejo que checkout.session.completed
        const metadata = session.metadata;
        if (metadata) {
          const { event_id, member_id, attendee_id, is_guest } = metadata;

          if (is_guest === 'true' && attendee_id) {
            await supabase
              .from('attendees')
              .update({
                payment_status: 'paid',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
              })
              .eq('id', attendee_id);
          } else if (member_id) {
            await supabase
              .from('event_registrations')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
              })
              .eq('member_id', member_id)
              .eq('event_id', event_id);
            
            // Crear o actualizar registro en attendees para check-in
            try {
              // Obtener información del miembro
              const { data: memberData } = await supabase
                .from('members')
                .select('id, email, full_name, phone')
                .eq('id', member_id)
                .single();

              if (memberData) {
                // Verificar si ya existe un attendee para este miembro y evento
                const { data: existingAttendee } = await supabase
                  .from('attendees')
                  .select('id')
                  .eq('event_id', event_id)
                  .eq('email', memberData.email)
                  .maybeSingle();

                if (existingAttendee) {
                  // Actualizar attendee existente
                  const { error: attendeeUpdateError } = await supabase
                    .from('attendees')
                    .update({
                      payment_status: 'paid',
                      status: 'registered',
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: session.payment_intent as string,
                      amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                      currency: session.currency || 'mxn',
                      payment_method: session.payment_method_types?.[0] || 'card',
                    })
                    .eq('id', existingAttendee.id);

                  if (attendeeUpdateError) {
                    console.error('❌ Error updating attendee:', attendeeUpdateError);
                  } else {
                    console.log('✅ Attendee updated successfully');
                  }
                } else {
                  // Crear nuevo attendee
                  const { error: attendeeCreateError } = await supabase
                    .from('attendees')
                    .insert({
                      event_id: event_id,
                      name: memberData.full_name || memberData.email,
                      email: memberData.email,
                      phone: memberData.phone || null,
                      payment_status: 'paid',
                      status: 'registered',
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: session.payment_intent as string,
                      amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                      currency: session.currency || 'mxn',
                      payment_method: session.payment_method_types?.[0] || 'card',
                    });

                  if (attendeeCreateError) {
                    console.error('❌ Error creating attendee:', attendeeCreateError);
                  } else {
                    console.log('✅ Attendee created successfully for check-in');
                  }
                }
              }
            } catch (attendeeError) {
              // No fallar el webhook si falla la creación de attendee
              console.error('[Webhook] Error creating/updating attendee:', attendeeError);
            }
            
            // Enviar notificación push al usuario cuando se confirma el pago asíncrono
            try {
              // Obtener información del evento
              const { data: eventData } = await supabase
                .from('events')
                .select('title, slug')
                .eq('id', event_id)
                .single();

              if (eventData) {
                const { notifyPaymentSuccess } = await import('@/lib/push-notifications');
                await notifyPaymentSuccess(member_id, {
                  title: eventData.title,
                  slug: eventData.slug,
                });
              }
            } catch (pushError) {
              // No fallar el webhook si falla la notificación
              console.error('[Webhook] Error enviando notificación push:', pushError);
            }
          }
        }
        break;
      }

      // ❌ Cuando el pago asíncrono falla (ej: OXXO expirado)
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('❌ Async payment failed:', session.id);
        
        const metadata = session.metadata;
        if (metadata) {
          const { event_id, member_id, attendee_id, is_guest } = metadata;

          if (is_guest === 'true' && attendee_id) {
            await supabase
              .from('attendees')
              .update({
                payment_status: 'failed',
              })
              .eq('id', attendee_id);
          } else if (member_id) {
            await supabase
              .from('event_registrations')
              .update({
                payment_status: 'failed',
              })
              .eq('member_id', member_id)
              .eq('event_id', event_id);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }
    } catch (switchError: any) {
      // Loggear error pero retornar 200 para evitar reintentos
      console.error('❌ Error processing webhook event:', {
        type: event.type,
        error: switchError.message,
        stack: switchError.stack,
      });
    }

    // Siempre retornar 200 OK para que Stripe no reintente
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    // Solo retornar 500 si es un error de verificación de firma
    // Para otros errores, retornar 200 para evitar reintentos
    console.error('❌ Webhook error:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
    });
    
    // Si es un error de verificación, retornar 400 para que Stripe no lo reintente
    if (error.message?.includes('signature')) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed', details: error.message },
        { status: 400 }
      );
    }
    
    // Para otros errores, retornar 200 para evitar reintentos infinitos
    return NextResponse.json({ received: true, error: 'Processed with errors' }, { status: 200 });
  }
}
