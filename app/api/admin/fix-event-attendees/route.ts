import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
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

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    // Obtener TODOS los attendees del evento (sin filtrar por payment_status)
    const { data: allAttendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false });

    if (attendeesError) {
      return NextResponse.json(
        { error: 'Error al obtener attendees', details: attendeesError.message },
        { status: 500 }
      );
    }

    const results: any[] = [];
    let fixedCount = 0;
    let errorsCount = 0;

    // Procesar cada attendee
    for (const attendee of allAttendees || []) {
      const result: any = {
        attendee_id: attendee.id,
        email: attendee.email,
        name: attendee.name,
        current_payment_status: attendee.payment_status,
        fixes: [],
        errors: [],
      };

      try {
        // 1. Verificar si tiene payment_status = 'paid'
        if (attendee.payment_status !== 'paid') {
          // Buscar transacciones de pago para este attendee
          let transactions: any[] = [];

          // Buscar por stripe_session_id o stripe_payment_intent_id
          if (attendee.stripe_session_id) {
            const { data: transBySession } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('stripe_session_id', attendee.stripe_session_id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (transBySession && transBySession.length > 0) {
              transactions = transBySession;
            }
          }

          if (transactions.length === 0 && attendee.stripe_payment_intent_id) {
            const { data: transByIntent } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('stripe_payment_intent_id', attendee.stripe_payment_intent_id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (transByIntent && transByIntent.length > 0) {
              transactions = transByIntent;
            }
          }

          // Si no encontramos por IDs, buscar por email y event_id
          if (transactions.length === 0 && attendee.email) {
            const { data: allEventTransactions } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('event_id', event_id)
              .is('member_id', null)
              .order('created_at', { ascending: false })
              .limit(100);

            if (allEventTransactions) {
              const matching = allEventTransactions.filter((t: any) => {
                const metadata = t.metadata || {};
                const guestEmail = metadata.guest_email || metadata.customer_email || '';
                return guestEmail.toLowerCase() === attendee.email?.toLowerCase();
              });

              if (matching.length > 0) {
                transactions = matching;
              }
            }
          }

          // Si no encontramos transacciones en la BD, buscar en Stripe directamente
          if (transactions.length === 0) {
            try {
              // Buscar en Stripe por session_id si existe
              if (attendee.stripe_session_id) {
                try {
                  const session = await stripe.checkout.sessions.retrieve(attendee.stripe_session_id, {
                    expand: ['payment_intent', 'customer'],
                  });

                  if (session.payment_status === 'paid' && session.status === 'complete') {
                    // Crear objeto de transacción desde Stripe
                    transactions = [{
                      id: `stripe_${session.id}`,
                      stripe_session_id: session.id,
                      stripe_payment_intent_id: typeof session.payment_intent === 'string' 
                        ? session.payment_intent 
                        : session.payment_intent?.id || null,
                      amount: session.amount_total ? session.amount_total / 100 : 0,
                      currency: session.currency || 'mxn',
                      status: 'succeeded',
                      payment_method: 'card',
                      metadata: session.metadata || {},
                    }];
                  }
                } catch (stripeError: any) {
                  // Si la sesión no existe en Stripe, continuar
                  console.warn(`Session ${attendee.stripe_session_id} no encontrada en Stripe: ${stripeError.message}`);
                }
              }

              // Si aún no encontramos, buscar por email en Stripe (últimas sesiones del evento)
              if (transactions.length === 0 && attendee.email) {
                try {
                  // Obtener el precio del evento para buscar sesiones similares
                  const { data: eventData } = await supabase
                    .from('events')
                    .select('price')
                    .eq('id', event_id)
                    .single();

                  const eventPrice = eventData?.price;
                  
                  // Buscar sesiones recientes en Stripe
                  const sessions = await stripe.checkout.sessions.list({
                    limit: 100,
                    expand: ['data.payment_intent', 'data.customer'],
                  });

                  // Filtrar por email y monto aproximado
                  const matchingSessions = sessions.data.filter((s: any) => {
                    const customerEmail = s.customer_details?.email || s.customer_email || '';
                    const metadataEmail = s.metadata?.guest_email || s.metadata?.customer_email || '';
                    const emailMatch = customerEmail.toLowerCase() === attendee.email.toLowerCase() ||
                                      metadataEmail.toLowerCase() === attendee.email.toLowerCase();
                    
                    // Si tenemos precio del evento, verificar que coincida aproximadamente
                    if (eventPrice && typeof eventPrice === 'string') {
                      const priceNum = parseFloat(eventPrice.replace(/[^0-9.]/g, ''));
                      const amountMatch = !s.amount_total || Math.abs((s.amount_total / 100) - priceNum) < 10;
                      return emailMatch && amountMatch;
                    }
                    
                    return emailMatch;
                  });

                  if (matchingSessions.length > 0) {
                    const session = matchingSessions[0];
                    if (session.payment_status === 'paid' && session.status === 'complete') {
                      transactions = [{
                        id: `stripe_${session.id}`,
                        stripe_session_id: session.id,
                        stripe_payment_intent_id: typeof session.payment_intent === 'string' 
                          ? session.payment_intent 
                          : session.payment_intent?.id || null,
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || 'mxn',
                        status: 'succeeded',
                        payment_method: 'card',
                        metadata: session.metadata || {},
                      }];
                    }
                  }
                } catch (stripeError: any) {
                  console.warn(`Error buscando en Stripe para ${attendee.email}: ${stripeError.message}`);
                }
              }
            } catch (error: any) {
              console.warn(`Error buscando en Stripe: ${error.message}`);
            }
          }

          // Si encontramos transacciones exitosas, actualizar payment_status
          const successfulTransactions = transactions.filter((t: any) => 
            t.status === 'succeeded' || t.status === 'completed'
          );

          if (successfulTransactions.length > 0) {
            const latestTransaction = successfulTransactions[0];
            
            // Actualizar attendee
            const { error: updateError } = await supabase
              .from('attendees')
              .update({
                payment_status: 'paid',
                stripe_session_id: latestTransaction.stripe_session_id || attendee.stripe_session_id,
                stripe_payment_intent_id: latestTransaction.stripe_payment_intent_id || attendee.stripe_payment_intent_id,
                amount_paid: latestTransaction.amount || attendee.amount_paid || 0,
                currency: latestTransaction.currency || attendee.currency || 'mxn',
                payment_method: latestTransaction.payment_method || attendee.payment_method || 'card',
              })
              .eq('id', attendee.id);

            if (!updateError) {
              result.current_payment_status = 'paid';
              result.fixes.push({
                action: 'update_payment_status',
                success: true,
                from: attendee.payment_status,
                to: 'paid',
                source: latestTransaction.id?.startsWith('stripe_') ? 'stripe' : 'database',
              });
              fixedCount++;
            } else {
              result.errors.push(`Error al actualizar payment_status: ${updateError.message}`);
              errorsCount++;
            }
          } else {
            // Si no encontramos transacciones pero el attendee tiene stripe_session_id o stripe_payment_intent_id,
            // asumir que pagó (puede ser un caso donde el webhook no se procesó correctamente)
            if (attendee.stripe_session_id || attendee.stripe_payment_intent_id) {
              const { error: updateError } = await supabase
                .from('attendees')
                .update({
                  payment_status: 'paid',
                })
                .eq('id', attendee.id);

              if (!updateError) {
                result.current_payment_status = 'paid';
                result.fixes.push({
                  action: 'update_payment_status_assumed',
                  success: true,
                  from: attendee.payment_status,
                  to: 'paid',
                  note: 'Actualizado basado en presencia de stripe_session_id o stripe_payment_intent_id',
                });
                fixedCount++;
              }
            } else {
              result.errors.push('No se encontraron transacciones exitosas ni IDs de Stripe');
            }
          }
        }

        // 2. Verificar si tiene miembro asociado y event_registration
        if (attendee.email) {
          const emailLower = attendee.email.toLowerCase();
          
          // Buscar miembro por email
          const { data: member } = await supabase
            .from('members')
            .select('id, email, full_name')
            .eq('email', emailLower)
            .maybeSingle();

          if (member) {
            result.member_id = member.id;

            // Verificar si tiene event_registration
            const { data: registration } = await supabase
              .from('event_registrations')
              .select('*')
              .eq('member_id', member.id)
              .eq('event_id', event_id)
              .maybeSingle();

            if (!registration) {
              // Crear event_registration
              const { data: newRegistration, error: createRegError } = await supabase
                .from('event_registrations')
                .insert({
                  member_id: member.id,
                  event_id: event_id,
                  payment_status: attendee.payment_status === 'paid' ? 'paid' : 'pending',
                  status: 'confirmed',
                  stripe_session_id: attendee.stripe_session_id,
                  stripe_payment_intent_id: attendee.stripe_payment_intent_id,
                  amount_paid: attendee.amount_paid,
                  currency: attendee.currency || 'mxn',
                  payment_method: attendee.payment_method || 'card',
                  registration_date: attendee.created_at,
                })
                .select()
                .single();

              if (!createRegError && newRegistration) {
                result.fixes.push({
                  action: 'create_registration',
                  success: true,
                  registration_id: newRegistration.id,
                });
                fixedCount++;
              } else if (createRegError?.code !== '23505') { // Ignorar duplicados
                result.errors.push(`Error al crear registro: ${createRegError?.message}`);
                errorsCount++;
              }
            } else {
              result.registration_id = registration.id;
            }
          } else {
            // No tiene miembro, pero si tiene email y pagó, podríamos crear uno
            // (esto es opcional, solo si realmente pagó)
            if (attendee.payment_status === 'paid' && attendee.email) {
              result.errors.push('No tiene miembro asociado (puede crear uno manualmente si es necesario)');
            }
          }
        }

      } catch (error: any) {
        result.errors.push(`Error procesando attendee: ${error.message}`);
        errorsCount++;
      }

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      summary: {
        total_attendees: allAttendees?.length || 0,
        fixed: fixedCount,
        errors: errorsCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('❌ Error fixing event attendees:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
