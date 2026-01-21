import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id, email, event_title } = await request.json();

    if (!payment_intent_id && !email) {
      return NextResponse.json(
        { error: 'payment_intent_id o email es requerido' },
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

    const results: any = {
      fixes: [],
    };

    // 1. Buscar la transacción
    let transaction: any = null;
    if (payment_intent_id) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('stripe_payment_intent_id', payment_intent_id)
        .eq('status', 'succeeded')
        .maybeSingle();
      transaction = data;
    }

    // 2. Obtener información de Stripe
    let customerEmail: string | null = email || null;
    let customerName: string | null = null;
    let customerPhone: string | null = null;
    let eventId: string | null = transaction?.event_id || null;
    let sessionId: string | null = transaction?.stripe_session_id || null;

    if (payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id, {
          expand: ['customer', 'latest_charge'],
        });

        if (paymentIntent.customer) {
          const customer = typeof paymentIntent.customer === 'string'
            ? await stripe.customers.retrieve(paymentIntent.customer)
            : paymentIntent.customer;
          
          customerEmail = customerEmail || (customer as any).email || null;
          customerName = (customer as any).name || null;
          customerPhone = (customer as any).phone || null;
        }

        // Buscar la sesión de checkout
        if (!sessionId) {
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: payment_intent_id,
            limit: 1,
            expand: ['data.customer_details'],
          });

          if (sessions.data.length > 0) {
            const session = sessions.data[0];
            sessionId = session.id;
            customerEmail = customerEmail || session.customer_details?.email || null;
            customerName = customerName || session.customer_details?.name || null;
            customerPhone = customerPhone || session.customer_details?.phone || null;
            
            const metadata = session.metadata || {};
            eventId = eventId || metadata.event_id || null;
          }
        }
      } catch (stripeError) {
        console.error('Error retrieving from Stripe:', stripeError);
      }
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No se pudo obtener el email del cliente' },
        { status: 400 }
      );
    }

    if (!eventId && event_title) {
      const { data: foundEvents } = await supabase
        .from('events')
        .select('id, title')
        .ilike('title', `%${event_title}%`)
        .limit(1);
      
      if (foundEvents && foundEvents.length > 0) {
        eventId = foundEvents[0].id;
      }
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'No se pudo determinar el evento' },
        { status: 400 }
      );
    }

    results.customer = {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
    };
    results.event_id = eventId;

    // 3. Verificar si existe el attendee
    const { data: existingAttendee } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', customerEmail)
      .maybeSingle();

    if (!existingAttendee) {
      // Crear attendee
      const { data: newAttendee, error: attendeeError } = await supabase
        .from('attendees')
        .insert({
          event_id: eventId,
          name: customerName || customerEmail,
          email: customerEmail,
          phone: customerPhone || null,
          tickets: 1,
          status: 'pending',
          payment_status: 'paid',
          stripe_session_id: sessionId,
          stripe_payment_intent_id: payment_intent_id,
          amount_paid: transaction?.amount || 55,
          currency: transaction?.currency || 'mxn',
          payment_method: transaction?.payment_method || 'card',
          notes: 'Creado desde transacción de Stripe',
        })
        .select()
        .single();

      if (attendeeError) {
        results.fixes.push({
          action: 'create_attendee',
          success: false,
          error: attendeeError.message,
        });
      } else {
        results.attendee = newAttendee;
        results.fixes.push({
          action: 'create_attendee',
          success: true,
          attendee_id: newAttendee.id,
        });
      }
    } else {
      results.attendee = existingAttendee;
      results.fixes.push({
        action: 'attendee_exists',
        success: true,
        attendee_id: existingAttendee.id,
      });
    }

    // 4. Verificar si existe el miembro
    const { data: existingMember } = await supabase
      .from('members')
      .select('id, email, full_name')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!existingMember) {
      // Verificar si el usuario existe en auth.users pero no en members
      let authUserId: string | null = null;
      
      try {
        // Buscar usuario por email en auth.users
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && authUsers) {
          const user = authUsers.users.find(u => u.email === customerEmail);
          if (user) {
            authUserId = user.id;
          }
        }
      } catch (listError) {
        console.error('Error listing users:', listError);
      }

      if (authUserId) {
        // El usuario existe en auth.users pero no en members, crear el miembro
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            id: authUserId,
            email: customerEmail,
            full_name: customerName || customerEmail.split('@')[0],
            phone: customerPhone || null,
            membership_type: 'regular',
            membership_status: 'active',
          })
          .select()
          .single();

        if (memberError || !newMember) {
          results.fixes.push({
            action: 'create_member',
            success: false,
            error: memberError?.message || 'No se pudo crear el miembro',
          });
        } else {
          results.member = newMember;
          results.fixes.push({
            action: 'create_member',
            success: true,
            member_id: newMember.id,
            note: 'Miembro creado para usuario existente en auth.users',
          });
        }
      } else {
        // Crear usuario en auth.users y luego el miembro
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: {
              full_name: customerName || customerEmail.split('@')[0],
              phone: customerPhone,
            },
          });

          if (authError || !authUser.user) {
            results.fixes.push({
              action: 'create_auth_user',
              success: false,
              error: authError?.message || 'No se pudo crear el usuario',
            });
          } else {
            // Crear el miembro
            const { data: newMember, error: memberError } = await supabase
              .from('members')
              .insert({
                id: authUser.user.id,
                email: customerEmail,
                full_name: customerName || customerEmail.split('@')[0],
                phone: customerPhone || null,
                membership_type: 'regular',
                membership_status: 'active',
              })
              .select()
              .single();

            if (memberError || !newMember) {
              results.fixes.push({
                action: 'create_member',
                success: false,
                error: memberError?.message || 'No se pudo crear el miembro',
              });
            } else {
              results.member = newMember;
              results.fixes.push({
                action: 'create_member',
                success: true,
                member_id: newMember.id,
                note: 'Usuario creado sin contraseña. Debe usar "Olvidé mi contraseña" para establecer una.',
              });
            }
          }
        } catch (error: any) {
          results.fixes.push({
            action: 'create_auth_user',
            success: false,
            error: error.message || 'Error al crear usuario',
          });
        }
      }
    } else {
      results.member = existingMember;
      results.fixes.push({
        action: 'member_exists',
        success: true,
        member_id: existingMember.id,
      });
    }

    // 5. Si tenemos miembro, crear registro en event_registrations
    if (results.member) {
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('member_id', results.member.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (!existingReg) {
        const { data: newReg, error: regError } = await supabase
          .from('event_registrations')
          .insert({
            member_id: results.member.id,
            event_id: eventId,
            payment_status: 'paid',
            status: 'confirmed',
            stripe_session_id: sessionId,
            stripe_payment_intent_id: payment_intent_id,
            amount_paid: transaction?.amount || 55,
            currency: transaction?.currency || 'mxn',
            payment_method: transaction?.payment_method || 'card',
            registration_date: transaction?.created_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (regError) {
          results.fixes.push({
            action: 'create_registration',
            success: false,
            error: regError.message,
          });
        } else {
          results.registration = newReg;
          results.fixes.push({
            action: 'create_registration',
            success: true,
            registration_id: newReg.id,
          });
        }
      } else {
        results.registration = existingReg;
        results.fixes.push({
          action: 'registration_exists',
          success: true,
          registration_id: existingReg.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('Error fixing guest to member:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
