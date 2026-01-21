import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { member_id, event_id, event_title, stripe_payment_intent_id, member_email } = await request.json();

    let finalMemberId = member_id;
    let finalEventId = event_id;

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

    // 1. Verificar si existe el registro en event_registrations
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('member_id', finalMemberId)
      .eq('event_id', finalEventId)
      .maybeSingle();

    console.log('📋 Registration check:', { registration, error: regError });

    // 2. Obtener información del miembro
    // Si se proporciona member_email, buscar por email primero
    if (member_email && !finalMemberId) {
      const { data: memberByEmail } = await supabase
        .from('members')
        .select('id, email, full_name, phone')
        .eq('email', member_email)
        .maybeSingle();
      
      if (memberByEmail) {
        finalMemberId = memberByEmail.id;
      }
    }

    if (!finalMemberId) {
      return NextResponse.json(
        { error: 'member_id o member_email es requerido' },
        { status: 400 }
      );
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, full_name, phone')
      .eq('id', finalMemberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Miembro no encontrado', details: memberError?.message },
        { status: 404 }
      );
    }

    // 3. Obtener información del evento
    // Si no se proporciona event_id pero sí event_title, buscarlo
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
        { error: 'event_id o event_title es requerido' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', finalEventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    // 4. Buscar transacciones de pago para este miembro y evento
    // Buscar de múltiples formas para encontrar la transacción
    let transactions: any[] = [];
    
    // Método 1: Por member_id y event_id
    const { data: transactionsByMemberEvent } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('member_id', finalMemberId)
      .eq('event_id', finalEventId)
      .order('created_at', { ascending: false });
    
    if (transactionsByMemberEvent && transactionsByMemberEvent.length > 0) {
      transactions = transactionsByMemberEvent;
    }

    // Método 2: Buscar todas las transacciones del evento y filtrar por email
    if (transactions.length === 0) {
      const { data: allEventTransactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('event_id', finalEventId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (allEventTransactions) {
        // Filtrar por email en metadata (para guest checkouts que coinciden con el email del miembro)
        const matching = allEventTransactions.filter((t: any) => {
          const metadata = t.metadata || {};
          const guestEmail = metadata.guest_email || metadata.customer_email || '';
          return t.member_id === member_id ||
                 guestEmail.toLowerCase() === member.email.toLowerCase() ||
                 (t.member_id === null && guestEmail.toLowerCase() === member.email.toLowerCase());
        });
        
        if (matching.length > 0) {
          transactions = matching;
        }
      }
    }

    // Método 3: Buscar todas las transacciones del miembro y filtrar por evento
    if (transactions.length === 0) {
      const { data: allMemberTransactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('member_id', finalMemberId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (allMemberTransactions) {
        const matching = allMemberTransactions.filter((t: any) => {
          const metadata = t.metadata || {};
          return t.event_id === finalEventId ||
                 metadata.event_id === finalEventId ||
                 (metadata.event_title && event.title && 
                  (metadata.event_title.includes('LONG RUN') || 
                   metadata.event_title.includes('ATÍPICO') ||
                   event.title.includes(metadata.event_title.split(' ')[0])));
        });
        
        if (matching.length > 0) {
          transactions = matching;
        }
      }
    }

    // Método 4: Buscar por stripe_payment_intent_id si se proporciona
    if (transactions.length === 0 && stripe_payment_intent_id) {
      const { data: transactionsByPaymentIntent } = await supabase
        .from('payment_transactions')
        .select('*')
        .ilike('stripe_payment_intent_id', `%${stripe_payment_intent_id}%`)
        .order('created_at', { ascending: false });
      
      if (transactionsByPaymentIntent && transactionsByPaymentIntent.length > 0) {
        // Verificar que el email coincida o que sea del evento correcto
        const matching = transactionsByPaymentIntent.filter((t: any) => {
          const metadata = t.metadata || {};
          const guestEmail = metadata.guest_email || metadata.customer_email || '';
          return t.event_id === finalEventId ||
                 guestEmail.toLowerCase() === member.email.toLowerCase() ||
                 t.member_id === member_id ||
                 (t.member_id === null && guestEmail.toLowerCase() === member.email.toLowerCase());
        });
        
        if (matching.length > 0) {
          transactions = matching;
        } else if (transactionsByPaymentIntent.length > 0) {
          // Si encontramos la transacción pero no coincide exactamente, usarla de todos modos
          // (puede ser que el event_id o member_id estén mal)
          transactions = transactionsByPaymentIntent;
        }
      }
    }

    // Método 5: Buscar por email en todas las transacciones del evento (sin member_id)
    if (transactions.length === 0) {
      const { data: allEventTransactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('event_id', finalEventId)
        .is('member_id', null) // Solo guest checkouts
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (allEventTransactions) {
        const matching = allEventTransactions.filter((t: any) => {
          const metadata = t.metadata || {};
          const guestEmail = metadata.guest_email || metadata.customer_email || '';
          return guestEmail.toLowerCase() === member.email.toLowerCase();
        });
        
        if (matching.length > 0) {
          transactions = matching;
        }
      }
    }

    console.log('💳 Transactions found:', transactions?.length || 0);

    const results: any = {
      member: {
        id: member.id,
        email: member.email,
        full_name: member.full_name,
      },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
      registration: registration || null,
      transactions: transactions || [],
      fixes: [],
    };

    // 5. Si encontramos transacciones de guest checkout, actualizar el member_id
    for (const transaction of transactions || []) {
      if (transaction.member_id === null && transaction.metadata?.is_guest === 'true') {
        const metadata = transaction.metadata || {};
        const guestEmail = metadata.guest_email || metadata.customer_email || '';
        
        if (guestEmail.toLowerCase() === member.email.toLowerCase()) {
          // Actualizar la transacción para asociarla con el miembro
          const { error: updateTransError } = await supabase
            .from('payment_transactions')
            .update({ member_id: finalMemberId })
            .eq('id', transaction.id);
          
          if (!updateTransError) {
            transaction.member_id = member_id;
            results.fixes.push({
              action: 'update_transaction_member_id',
              success: true,
              transaction_id: transaction.id,
            });
          }
        }
      }
    }

    // 6. Si no existe registro en event_registrations, crearlo
    // Filtrar transacciones exitosas o pendientes que puedan haberse completado
    const validTransactions = (transactions || []).filter((t: any) => 
      t.status === 'succeeded' || 
      t.status === 'pending' ||
      (t.status === 'pending' && t.metadata?.is_guest !== 'true')
    );

    // Si no hay registro pero el usuario dice que pagó, crear el registro
    // (asumiendo que el pago se procesó en Stripe pero no se guardó correctamente en la BD)
    if (!registration) {
      if (validTransactions.length > 0) {
        const latestTransaction = validTransactions[0];
        
        const { data: newRegistration, error: createRegError } = await supabase
          .from('event_registrations')
          .insert({
            member_id: finalMemberId,
            event_id: finalEventId,
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

        if (createRegError) {
          // Si el error es por duplicado, el registro ya existe, cargarlo
          if (createRegError.message?.includes('duplicate key') || createRegError.code === '23505') {
            const { data: existingReg } = await supabase
              .from('event_registrations')
              .select('*')
              .eq('member_id', finalMemberId)
              .eq('event_id', finalEventId)
              .single();
            
            if (existingReg) {
              results.registration = existingReg;
              results.fixes.push({
                action: 'create_registration',
                success: true,
                registration_id: existingReg.id,
                note: 'Registro ya existía, se cargó correctamente',
              });
            } else {
              results.fixes.push({
                action: 'create_registration',
                success: false,
                error: createRegError.message,
              });
            }
          } else {
            results.fixes.push({
              action: 'create_registration',
              success: false,
              error: createRegError.message,
            });
          }
        } else {
          results.fixes.push({
            action: 'create_registration',
            success: true,
            registration_id: newRegistration.id,
          });
          results.registration = newRegistration;
        }
      } else {
        // Si no hay transacciones pero el usuario pagó, crear registro marcado como pagado
        // (esto es un fix manual para casos donde el webhook falló)
        const { data: newRegistrationManual, error: createRegManualError } = await supabase
          .from('event_registrations')
          .insert({
            member_id: finalMemberId,
            event_id: finalEventId,
            payment_status: 'paid',
            status: 'confirmed',
            amount_paid: null, // No tenemos el monto exacto
            currency: 'mxn',
            payment_method: 'card',
            notes: 'Reparado manualmente - Pago procesado en Stripe',
          })
          .select()
          .single();

        if (createRegManualError) {
          // Si el error es por duplicado, el registro ya existe, cargarlo
          if (createRegManualError.message?.includes('duplicate key') || createRegManualError.code === '23505') {
            const { data: existingReg } = await supabase
              .from('event_registrations')
              .select('*')
              .eq('member_id', finalMemberId)
              .eq('event_id', finalEventId)
              .single();
            
            if (existingReg) {
              results.registration = existingReg;
              results.fixes.push({
                action: 'create_registration_manual',
                success: true,
                registration_id: existingReg.id,
                note: 'Registro ya existía, se cargó correctamente',
              });
            } else {
              results.fixes.push({
                action: 'create_registration_manual',
                success: false,
                error: createRegManualError.message,
              });
            }
          } else {
            results.fixes.push({
              action: 'create_registration_manual',
              success: false,
              error: createRegManualError.message,
            });
          }
        } else {
          results.fixes.push({
            action: 'create_registration_manual',
            success: true,
            registration_id: newRegistrationManual.id,
            note: 'Creado sin transacción (pago procesado en Stripe)',
          });
          results.registration = newRegistrationManual;
        }
      }
    } else if (registration && registration.payment_status !== 'paid' && validTransactions.length > 0) {
      // Si existe pero no está marcado como pagado, actualizarlo
      const latestTransaction = validTransactions[0];
      
      const { data: updatedRegistration, error: updateRegError } = await supabase
        .from('event_registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          stripe_session_id: latestTransaction.stripe_session_id,
          stripe_payment_intent_id: latestTransaction.stripe_payment_intent_id,
          amount_paid: latestTransaction.amount,
          currency: latestTransaction.currency || 'mxn',
          payment_method: latestTransaction.payment_method || 'card',
        })
        .eq('id', registration.id)
        .select()
        .single();

      if (updateRegError) {
        results.fixes.push({
          action: 'update_registration',
          success: false,
          error: updateRegError.message,
        });
      } else {
        results.fixes.push({
          action: 'update_registration',
          success: true,
          registration_id: updatedRegistration.id,
        });
        results.registration = updatedRegistration;
      }
    }

    // 7. Verificar si existe attendee para check-in (antes de actualizar registro)
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('email', member.email)
      .maybeSingle();

    console.log('👤 Attendee check:', { attendee, error: attendeeError });

    results.attendee = attendee || null;

    // 8. Si no se creó un registro nuevo pero existe uno, cargarlo
    if (!results.registration && registration) {
      results.registration = registration;
    }
    
    // 8b. Si el registro existe (ya sea nuevo o existente) pero le faltan datos de Stripe, actualizarlo
    const registrationToCheck = results.registration || registration;
    if (registrationToCheck && (!registrationToCheck.stripe_payment_intent_id || !registrationToCheck.stripe_session_id || !registrationToCheck.amount_paid)) {
      const attendeeData = results.attendee || attendee;
      const transactionData = validTransactions?.[0] || transactions?.[0];
      
      if (attendeeData || transactionData) {
        const updateData: any = {};
        
        if (!registrationToCheck.stripe_payment_intent_id) {
          updateData.stripe_payment_intent_id = attendeeData?.stripe_payment_intent_id || transactionData?.stripe_payment_intent_id || null;
        }
        
        if (!registrationToCheck.stripe_session_id) {
          updateData.stripe_session_id = attendeeData?.stripe_session_id || transactionData?.stripe_session_id || null;
        }
        
        if (!registrationToCheck.amount_paid && (attendeeData?.amount_paid || transactionData?.amount)) {
          updateData.amount_paid = attendeeData?.amount_paid || transactionData?.amount || null;
        }
        
        if (!registrationToCheck.currency && (attendeeData?.currency || transactionData?.currency)) {
          updateData.currency = attendeeData?.currency || transactionData?.currency || 'mxn';
        }
        
        if (!registrationToCheck.payment_method && (attendeeData?.payment_method || transactionData?.payment_method)) {
          updateData.payment_method = attendeeData?.payment_method || transactionData?.payment_method || 'card';
        }
        
        if (Object.keys(updateData).length > 0) {
          const { data: updatedReg, error: updateError } = await supabase
            .from('event_registrations')
            .update(updateData)
            .eq('id', registrationToCheck.id)
            .select()
            .single();
          
          if (!updateError && updatedReg) {
            results.registration = updatedReg;
            results.fixes.push({
              action: 'update_registration_stripe_data',
              success: true,
              registration_id: updatedReg.id,
            });
          } else if (updateError) {
            results.fixes.push({
              action: 'update_registration_stripe_data',
              success: false,
              error: updateError.message,
            });
          }
        }
      }
    }

    // 9. Si no existe attendee pero hay registro pagado, crearlo
    // También crear si no hay registro pero sabemos que pagó
    // Usar el registro existente si no se creó uno nuevo
    const finalRegistration = results.registration || registration;
    
    if (!attendee && finalRegistration && finalRegistration.payment_status === 'paid') {
      const latestTransaction = validTransactions?.[0] || transactions?.[0];
      
      const { data: newAttendee, error: createAttendeeError } = await supabase
        .from('attendees')
        .insert({
          event_id: finalEventId,
          name: member.full_name || member.email,
          email: member.email,
          phone: member.phone || null,
          tickets: 1,
          status: 'pending',
          payment_status: 'paid',
          stripe_session_id: latestTransaction?.stripe_session_id || finalRegistration.stripe_session_id || null,
          stripe_payment_intent_id: latestTransaction?.stripe_payment_intent_id || finalRegistration.stripe_payment_intent_id || null,
          amount_paid: latestTransaction?.amount || finalRegistration.amount_paid || 0,
          currency: latestTransaction?.currency || finalRegistration.currency || 'mxn',
          payment_method: latestTransaction?.payment_method || finalRegistration.payment_method || 'card',
          notes: 'Reparado automáticamente - Pago completado',
        })
        .select()
        .single();

      if (createAttendeeError) {
        results.fixes.push({
          action: 'create_attendee',
          success: false,
          error: createAttendeeError.message,
        });
      } else {
        results.fixes.push({
          action: 'create_attendee',
          success: true,
          attendee_id: newAttendee.id,
        });
        results.attendee = newAttendee;
      }
    } else if (attendee && attendee.payment_status !== 'paid') {
      // Si existe pero no está marcado como pagado, actualizarlo
      const latestTransaction = transactions?.[0];
      
      const { data: updatedAttendee, error: updateAttendeeError } = await supabase
        .from('attendees')
        .update({
          payment_status: 'paid',
          status: 'pending',
          stripe_session_id: latestTransaction?.stripe_session_id || attendee.stripe_session_id,
          stripe_payment_intent_id: latestTransaction?.stripe_payment_intent_id || attendee.stripe_payment_intent_id,
          amount_paid: latestTransaction?.amount || attendee.amount_paid || 0,
          currency: latestTransaction?.currency || attendee.currency || 'mxn',
          payment_method: latestTransaction?.payment_method || attendee.payment_method || 'card',
        })
        .eq('id', attendee.id)
        .select()
        .single();

      if (updateAttendeeError) {
        results.fixes.push({
          action: 'update_attendee',
          success: false,
          error: updateAttendeeError.message,
        });
      } else {
        results.fixes.push({
          action: 'update_attendee',
          success: true,
          attendee_id: updatedAttendee.id,
        });
        results.attendee = updatedAttendee;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('❌ Error fixing member registration:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
