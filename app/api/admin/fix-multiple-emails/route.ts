import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { emails, event_id } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'emails es requerido y debe ser un array' },
        { status: 400 }
      );
    }

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

    const results: any[] = [];

    // Procesar cada correo
    for (const email of emails) {
      const emailLower = email.toLowerCase().trim();
      const result: any = {
        email: emailLower,
        member: null,
        transactions: [],
        registration: null,
        attendee: null,
        fixes: [],
        errors: [],
      };

      try {
        // 1. Buscar miembro por email
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('id, email, full_name, phone')
          .eq('email', emailLower)
          .maybeSingle();

        if (member) {
          result.member = {
            id: member.id,
            email: member.email,
            full_name: member.full_name,
          };
        } else {
          // Si no existe miembro, buscar en auth.users
          const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
          const matchingUser = users?.find(u => u.email?.toLowerCase() === emailLower);
          
          if (matchingUser) {
            // Crear miembro desde auth.users
            const { data: newMember, error: createMemberError } = await supabase
              .from('members')
              .insert({
                id: matchingUser.id,
                email: matchingUser.email || emailLower,
                full_name: matchingUser.user_metadata?.full_name || matchingUser.email?.split('@')[0] || 'Miembro',
                phone: matchingUser.user_metadata?.phone || null,
                membership_type: 'regular',
                membership_status: 'active',
              })
              .select('id, email, full_name, phone')
              .single();

            if (!createMemberError && newMember) {
              result.member = {
                id: newMember.id,
                email: newMember.email,
                full_name: newMember.full_name,
              };
              result.fixes.push({
                action: 'create_member',
                success: true,
                member_id: newMember.id,
              });
            } else {
              result.errors.push(`Error al crear miembro: ${createMemberError?.message}`);
            }
          } else {
            // Si no hay usuario, intentar crear uno usando datos de Stripe
            // Primero buscar transacciones para obtener información
            const { data: allTempTransactions } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('event_id', event_id)
              .is('member_id', null)
              .limit(100);

            const tempTransactions = allTempTransactions?.find((t: any) => {
              const metadata = t.metadata || {};
              const guestEmail = metadata.guest_email || metadata.customer_email || '';
              return guestEmail.toLowerCase() === emailLower;
            });

            if (tempTransactions) {
              try {
                const metadata = tempTransactions.metadata || {};
                // Usar metadata primero, solo llamar a Stripe si falta información crítica
                let guestName = metadata.guest_name || emailLower.split('@')[0];
                let guestPhone = metadata.guest_phone || null;

                // Solo intentar obtener de Stripe si no tenemos el nombre y tenemos session_id
                if ((!guestName || guestName === emailLower.split('@')[0]) && tempTransactions.stripe_session_id) {
                  try {
                    const session = await stripe.checkout.sessions.retrieve(tempTransactions.stripe_session_id, {
                      expand: ['customer_details', 'customer'],
                    });
                    guestName = session.customer_details?.name || guestName;
                    guestPhone = session.customer_details?.phone || guestPhone;
                  } catch (stripeError: any) {
                    // Si falla Stripe, usar lo que tenemos de metadata
                    console.warn(`No se pudo obtener datos de Stripe para ${emailLower}: ${stripeError.message}`);
                  }
                }

                // Verificar si el usuario ya existe
                let userId: string | null = null;
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email?.toLowerCase() === emailLower);
                
                if (existingUser) {
                  userId = existingUser.id;
                } else {
                  // Crear usuario en auth.users
                  const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
                    email: emailLower,
                    email_confirm: true, // Confirmar email automáticamente
                    user_metadata: {
                      full_name: guestName,
                      phone: guestPhone,
                    },
                    password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!', // Contraseña temporal segura
                  });

                  if (!createUserError && newUser.user) {
                    userId = newUser.user.id;
                    result.fixes.push({
                      action: 'create_user',
                      success: true,
                      user_id: userId,
                    });
                  } else {
                    result.errors.push(`Error al crear usuario: ${createUserError?.message}`);
                  }
                }

                // Si tenemos userId, crear o actualizar miembro
                if (userId) {
                  // Verificar si el miembro ya existe
                  const { data: existingMember } = await supabase
                    .from('members')
                    .select('id, email, full_name, phone')
                    .eq('id', userId)
                    .maybeSingle();

                  if (existingMember) {
                    result.member = {
                      id: existingMember.id,
                      email: existingMember.email,
                      full_name: existingMember.full_name,
                    };
                    result.fixes.push({
                      action: 'member_already_exists',
                      success: true,
                      member_id: existingMember.id,
                    });
                  } else {
                    // Crear miembro
                    const { data: newMember, error: createMemberError } = await supabase
                      .from('members')
                      .insert({
                        id: userId,
                        email: emailLower,
                        full_name: guestName,
                        phone: guestPhone,
                        membership_type: 'regular',
                        membership_status: 'active',
                      })
                      .select('id, email, full_name, phone')
                      .single();

                    if (!createMemberError && newMember) {
                      result.member = {
                        id: newMember.id,
                        email: newMember.email,
                        full_name: newMember.full_name,
                      };
                      result.fixes.push({
                        action: 'create_member',
                        success: true,
                        member_id: newMember.id,
                        note: 'Miembro creado desde datos de transacción',
                      });
                    } else {
                      result.errors.push(`Error al crear miembro: ${createMemberError?.message}`);
                    }
                  }
                }
              } catch (error: any) {
                result.errors.push(`Error al procesar transacción: ${error.message}`);
              }
            } else {
              result.errors.push('No se encontró miembro, usuario ni transacción con información suficiente');
            }
          }
        }

        // 2. Buscar transacciones de pago
        let transactions: any[] = [];

        // Buscar por email en metadata (guest checkouts)
        const { data: guestTransactions } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('event_id', event_id)
          .is('member_id', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (guestTransactions) {
          const matching = guestTransactions.filter((t: any) => {
            const metadata = t.metadata || {};
            const guestEmail = metadata.guest_email || metadata.customer_email || '';
            return guestEmail.toLowerCase() === emailLower;
          });
          transactions = matching;
        }

        // Si hay miembro, buscar también por member_id
        if (result.member?.id) {
          const { data: memberTransactions } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('member_id', result.member.id)
            .eq('event_id', event_id)
            .order('created_at', { ascending: false });

          if (memberTransactions && memberTransactions.length > 0) {
            // Combinar sin duplicados
            const existingIds = new Set(transactions.map(t => t.id));
            transactions = [
              ...transactions,
              ...memberTransactions.filter(t => !existingIds.has(t.id))
            ];
          }
        }

        result.transactions = transactions;

        // 3. Verificar event_registration
        if (result.member?.id) {
          const { data: registration } = await supabase
            .from('event_registrations')
            .select('*')
            .eq('member_id', result.member.id)
            .eq('event_id', event_id)
            .maybeSingle();

          result.registration = registration || null;

          // Si no hay registro pero hay transacciones, crearlo
          if (!registration && transactions.length > 0) {
            const latestTransaction = transactions[0];
            const { data: newRegistration, error: createRegError } = await supabase
              .from('event_registrations')
              .insert({
                member_id: result.member.id,
                event_id: event_id,
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: latestTransaction.stripe_session_id,
                stripe_payment_intent_id: latestTransaction.stripe_payment_intent_id,
                amount_paid: latestTransaction.amount,
                currency: latestTransaction.currency || 'mxn',
                payment_method: latestTransaction.payment_method || 'card',
                registration_date: latestTransaction.created_at,
              })
              .select()
              .single();

            if (!createRegError && newRegistration) {
              result.registration = newRegistration;
              result.fixes.push({
                action: 'create_registration',
                success: true,
                registration_id: newRegistration.id,
              });
            } else if (createRegError?.code === '23505') {
              // Duplicado, cargar el existente
              const { data: existingReg } = await supabase
                .from('event_registrations')
                .select('*')
                .eq('member_id', result.member.id)
                .eq('event_id', event_id)
                .single();
              
              if (existingReg) {
                result.registration = existingReg;
                result.fixes.push({
                  action: 'create_registration',
                  success: true,
                  registration_id: existingReg.id,
                  note: 'Registro ya existía',
                });
              }
            } else {
              result.errors.push(`Error al crear registro: ${createRegError?.message}`);
            }
          }
        }

        // 4. Verificar attendee
        const { data: attendee } = await supabase
          .from('attendees')
          .select('*')
          .eq('event_id', event_id)
          .eq('email', emailLower)
          .maybeSingle();

        result.attendee = attendee || null;

        // Si no hay attendee pero hay registro o transacciones, crearlo
        if (!attendee && (result.registration || transactions.length > 0)) {
          const latestTransaction = transactions[0];
          const memberName = result.member?.full_name || emailLower.split('@')[0];
          
          const { data: newAttendee, error: createAttendeeError } = await supabase
            .from('attendees')
            .insert({
              event_id: event_id,
              name: memberName,
              email: emailLower,
              phone: result.member?.phone || null,
              tickets: 1,
              status: 'pending',
              payment_status: 'paid',
              stripe_session_id: latestTransaction?.stripe_session_id || result.registration?.stripe_session_id || null,
              stripe_payment_intent_id: latestTransaction?.stripe_payment_intent_id || result.registration?.stripe_payment_intent_id || null,
              amount_paid: latestTransaction?.amount || result.registration?.amount_paid || 0,
              currency: latestTransaction?.currency || result.registration?.currency || 'mxn',
              payment_method: latestTransaction?.payment_method || result.registration?.payment_method || 'card',
              notes: 'Reparado automáticamente',
            })
            .select()
            .single();

          if (!createAttendeeError && newAttendee) {
            result.attendee = newAttendee;
            result.fixes.push({
              action: 'create_attendee',
              success: true,
              attendee_id: newAttendee.id,
            });
          } else {
            result.errors.push(`Error al crear attendee: ${createAttendeeError?.message}`);
          }
        }

        // 5. Si hay transacciones con member_id null, actualizarlas
        if (result.member?.id) {
          for (const transaction of transactions) {
            if (transaction.member_id === null) {
              const { error: updateError } = await supabase
                .from('payment_transactions')
                .update({ member_id: result.member.id })
                .eq('id', transaction.id);

              if (!updateError) {
                result.fixes.push({
                  action: 'update_transaction_member_id',
                  success: true,
                  transaction_id: transaction.id,
                });
              }
            }
          }
        }

      } catch (error: any) {
        result.errors.push(`Error procesando ${emailLower}: ${error.message}`);
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
      results,
      summary: {
        total: results.length,
        with_member: results.filter(r => r.member).length,
        with_transactions: results.filter(r => r.transactions.length > 0).length,
        with_registration: results.filter(r => r.registration).length,
        with_attendee: results.filter(r => r.attendee).length,
        total_fixes: results.reduce((sum, r) => sum + r.fixes.length, 0),
        total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      },
    });
  } catch (error: any) {
    console.error('❌ Error fixing multiple emails:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
