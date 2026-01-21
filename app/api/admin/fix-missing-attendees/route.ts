import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_title, event_id } = await request.json();

    if (!event_title && !event_id) {
      return NextResponse.json(
        { error: 'event_title o event_id es requerido' },
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

    // 1. Obtener el evento
    let finalEventId = event_id;
    if (!finalEventId && event_title) {
      const { data: foundEvents } = await supabase
        .from('events')
        .select('id, title, slug')
        .ilike('title', `%${event_title}%`)
        .limit(1);
      
      if (foundEvents && foundEvents.length > 0) {
        finalEventId = foundEvents[0].id;
      }
    }

    if (!finalEventId) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', finalEventId)
      .single();

    // 2. Buscar todas las transacciones de pago exitosas
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false });

    // 3. Buscar todos los attendees existentes
    const { data: existingAttendees } = await supabase
      .from('attendees')
      .select('stripe_payment_intent_id, email')
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid');

    const existingPaymentIntents = new Set(
      (existingAttendees || [])
        .map(a => a.stripe_payment_intent_id)
        .filter(Boolean)
    );

    // 4. Encontrar transacciones sin attendee
    const missingTransactions = (transactions || []).filter(
      t => t.stripe_payment_intent_id && !existingPaymentIntents.has(t.stripe_payment_intent_id)
    );

    const fixes: any[] = [];

    // 5. Para cada transacción faltante, crear el attendee
    for (const transaction of missingTransactions) {
      try {
        // Obtener información de la sesión de Stripe
        let customerEmail: string | null = null;
        let customerName: string | null = null;
        let customerPhone: string | null = null;
        let memberId: string | null = transaction.member_id || null;

        if (transaction.stripe_session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(transaction.stripe_session_id, {
              expand: ['customer_details', 'customer'],
            });

            customerEmail = session.customer_details?.email || 
                          (session as any).customer_email || 
                          (session.customer as any)?.email ||
                          null;
            customerName = session.customer_details?.name || 
                          (session.customer as any)?.name ||
                          null;
            customerPhone = session.customer_details?.phone || null;

            // Si no tenemos member_id pero tenemos email, buscar el miembro
            if (!memberId && customerEmail) {
              const { data: member } = await supabase
                .from('members')
                .select('id, email, full_name, phone')
                .eq('email', customerEmail)
                .maybeSingle();
              
              if (member) {
                memberId = member.id;
                customerName = customerName || member.full_name;
                customerPhone = customerPhone || member.phone;
              }
            }

            // También verificar metadata de la sesión
            const metadata = session.metadata || {};
            if (!customerName && metadata.guest_name) {
              customerName = metadata.guest_name;
            }
            if (!customerEmail && metadata.guest_email) {
              customerEmail = metadata.guest_email;
            }
            if (!customerPhone && metadata.guest_phone) {
              customerPhone = metadata.guest_phone;
            }
          } catch (sessionError) {
            console.error(`Error retrieving session ${transaction.stripe_session_id}:`, sessionError);
          }
        }

        // Si no tenemos email, intentar obtenerlo de metadata de la transacción
        if (!customerEmail && transaction.metadata) {
          const metadata = transaction.metadata as any;
          customerEmail = metadata.guest_email || metadata.customer_email || null;
          customerName = customerName || metadata.guest_name || null;
          customerPhone = customerPhone || metadata.guest_phone || null;
        }

        // Si aún no tenemos email, intentar obtenerlo directamente del payment intent en Stripe
        if (!customerEmail && transaction.stripe_payment_intent_id) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe_payment_intent_id, {
              expand: ['customer'],
            });
            
            if (paymentIntent.customer) {
              const customer = typeof paymentIntent.customer === 'string' 
                ? await stripe.customers.retrieve(paymentIntent.customer)
                : paymentIntent.customer;
              
              customerEmail = (customer as any).email || null;
              customerName = customerName || (customer as any).name || null;
            }
          } catch (piError) {
            console.error(`Error retrieving payment intent ${transaction.stripe_payment_intent_id}:`, piError);
          }
        }

        // Si aún no tenemos email, buscar por member_id
        if (!customerEmail && memberId) {
          const { data: member } = await supabase
            .from('members')
            .select('id, email, full_name, phone')
            .eq('id', memberId)
            .single();
          
          if (member) {
            customerEmail = member.email;
            customerName = customerName || member.full_name;
            customerPhone = customerPhone || member.phone;
          }
        }

        if (!customerEmail) {
          fixes.push({
            transaction_id: transaction.id,
            payment_intent: transaction.stripe_payment_intent_id,
            success: false,
            error: 'No se pudo obtener el email del cliente',
          });
          continue;
        }

        // Verificar si ya existe un attendee con este email (por si acaso)
        const { data: existingAttendeeByEmail } = await supabase
          .from('attendees')
          .select('id')
          .eq('event_id', finalEventId)
          .eq('email', customerEmail)
          .maybeSingle();

        if (existingAttendeeByEmail) {
          // Actualizar el attendee existente con el payment_intent
          const { error: updateError } = await supabase
            .from('attendees')
            .update({
              stripe_payment_intent_id: transaction.stripe_payment_intent_id,
              stripe_session_id: transaction.stripe_session_id,
              payment_status: 'paid',
              amount_paid: transaction.amount,
              currency: transaction.currency || 'mxn',
              payment_method: transaction.payment_method || 'card',
            })
            .eq('id', existingAttendeeByEmail.id);

          if (updateError) {
            fixes.push({
              transaction_id: transaction.id,
              payment_intent: transaction.stripe_payment_intent_id,
              email: customerEmail,
              success: false,
              error: updateError.message,
            });
          } else {
            fixes.push({
              transaction_id: transaction.id,
              payment_intent: transaction.stripe_payment_intent_id,
              email: customerEmail,
              success: true,
              action: 'updated_existing_attendee',
              attendee_id: existingAttendeeByEmail.id,
            });
          }
          continue;
        }

        // Crear nuevo attendee
        const { data: newAttendee, error: createError } = await supabase
          .from('attendees')
          .insert({
            event_id: finalEventId,
            name: customerName || customerEmail,
            email: customerEmail,
            phone: customerPhone || null,
            tickets: 1,
            status: 'pending',
            payment_status: 'paid',
            stripe_session_id: transaction.stripe_session_id,
            stripe_payment_intent_id: transaction.stripe_payment_intent_id,
            amount_paid: transaction.amount,
            currency: transaction.currency || 'mxn',
            payment_method: transaction.payment_method || 'card',
            notes: 'Reparado automáticamente - Pago completado',
          })
          .select()
          .single();

        if (createError) {
          fixes.push({
            transaction_id: transaction.id,
            payment_intent: transaction.stripe_payment_intent_id,
            email: customerEmail,
            success: false,
            error: createError.message,
          });
        } else {
          fixes.push({
            transaction_id: transaction.id,
            payment_intent: transaction.stripe_payment_intent_id,
            email: customerEmail,
            name: customerName,
            success: true,
            action: 'created_attendee',
            attendee_id: newAttendee.id,
          });

          // Si tenemos member_id, también crear/actualizar el registro en event_registrations
          if (memberId) {
            const { data: existingReg } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('member_id', memberId)
              .eq('event_id', finalEventId)
              .maybeSingle();

            if (!existingReg) {
              const { error: regError } = await supabase
                .from('event_registrations')
                .insert({
                  member_id: memberId,
                  event_id: finalEventId,
                  payment_status: 'paid',
                  status: 'confirmed',
                  stripe_session_id: transaction.stripe_session_id,
                  stripe_payment_intent_id: transaction.stripe_payment_intent_id,
                  amount_paid: transaction.amount,
                  currency: transaction.currency || 'mxn',
                  payment_method: transaction.payment_method || 'card',
                  registration_date: transaction.created_at,
                });

              if (!regError) {
                fixes[fixes.length - 1].registration_created = true;
              }
            }
          } else if (customerEmail) {
            // Si no tenemos member_id pero tenemos email, verificar si existe un miembro
            // Si no existe, podríamos crearlo, pero eso requiere crear usuario en auth.users
            // Por ahora, solo registramos que debería crearse
            const { data: memberByEmail } = await supabase
              .from('members')
              .select('id')
              .eq('email', customerEmail)
              .maybeSingle();

            if (!memberByEmail) {
              fixes[fixes.length - 1].member_should_be_created = true;
              fixes[fixes.length - 1].member_email = customerEmail;
              fixes[fixes.length - 1].member_name = customerName;
            } else {
              // Si el miembro existe, crear el registro
              const { data: existingReg } = await supabase
                .from('event_registrations')
                .select('id')
                .eq('member_id', memberByEmail.id)
                .eq('event_id', finalEventId)
                .maybeSingle();

              if (!existingReg) {
                const { error: regError } = await supabase
                  .from('event_registrations')
                  .insert({
                    member_id: memberByEmail.id,
                    event_id: finalEventId,
                    payment_status: 'paid',
                    status: 'confirmed',
                    stripe_session_id: transaction.stripe_session_id,
                    stripe_payment_intent_id: transaction.stripe_payment_intent_id,
                    amount_paid: transaction.amount,
                    currency: transaction.currency || 'mxn',
                    payment_method: transaction.payment_method || 'card',
                    registration_date: transaction.created_at,
                  });

                if (!regError) {
                  fixes[fixes.length - 1].registration_created = true;
                  fixes[fixes.length - 1].member_found = true;
                  fixes[fixes.length - 1].member_id = memberByEmail.id;
                }
              }
            }
          }
        }
      } catch (error: any) {
        fixes.push({
          transaction_id: transaction.id,
          payment_intent: transaction.stripe_payment_intent_id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      event: event,
      total_transactions: transactions?.length || 0,
      missing_attendees: missingTransactions.length,
      fixes_applied: fixes.filter(f => f.success).length,
      fixes_failed: fixes.filter(f => !f.success).length,
      fixes: fixes,
    });
  } catch (error: any) {
    console.error('Error fixing missing attendees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
