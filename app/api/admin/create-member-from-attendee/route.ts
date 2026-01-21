import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { attendee_email, attendee_id, payment_intent_id } = await request.json();

    if (!attendee_email && !attendee_id && !payment_intent_id) {
      return NextResponse.json(
        { error: 'attendee_email, attendee_id o payment_intent_id es requerido' },
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

    // 1. Buscar el attendee
    let attendee: any = null;
    
    if (attendee_id) {
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', attendee_id)
        .single();
      attendee = data;
    } else if (payment_intent_id) {
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('stripe_payment_intent_id', payment_intent_id)
        .maybeSingle();
      attendee = data;
    } else if (attendee_email) {
      // Buscar el attendee más reciente con este email
      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('email', attendee_email)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      attendee = data;
    }

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee no encontrado' },
        { status: 404 }
      );
    }

    const results: any = {
      attendee: attendee,
      member: null,
      registrations: [],
      fixes: [],
    };

    // 2. Verificar si ya existe un miembro con este email
    const { data: existingMember } = await supabase
      .from('members')
      .select('id, email, full_name')
      .eq('email', attendee.email)
      .maybeSingle();

    if (existingMember) {
      results.member = existingMember;
      results.fixes.push({
        action: 'member_exists',
        success: true,
        member_id: existingMember.id,
      });
    } else {
      // 3. El miembro no existe, necesitamos crearlo
      // Pero para crear un miembro necesitamos un usuario en auth.users
      // Esto requiere crear el usuario primero
      
      // Obtener más información del attendee o de Stripe
      let customerName = attendee.name || attendee.email.split('@')[0];
      let customerPhone = attendee.phone || null;

      // Intentar obtener más información de Stripe
      if (attendee.stripe_session_id) {
        try {
          const session = await stripe.checkout.sessions.retrieve(attendee.stripe_session_id, {
            expand: ['customer_details', 'customer'],
          });

          customerName = session.customer_details?.name || 
                        (session.customer as any)?.name ||
                        customerName;
          customerPhone = session.customer_details?.phone || customerPhone;
        } catch (error) {
          console.error('Error retrieving Stripe session:', error);
        }
      }

      // Crear usuario en auth.users (requiere Admin API)
      // Nota: Esto crea un usuario sin contraseña, el usuario necesitará usar "Olvidé mi contraseña"
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: attendee.email,
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            full_name: customerName,
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
              email: attendee.email,
              full_name: customerName,
              phone: customerPhone,
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

    // 4. Si tenemos un miembro (existente o recién creado), crear registros en event_registrations
    if (results.member) {
      // Buscar todos los attendees de este email que tienen payment_status = 'paid'
      const { data: allAttendees } = await supabase
        .from('attendees')
        .select('*')
        .eq('email', attendee.email)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allAttendees) {
        for (const att of allAttendees) {
          // Verificar si ya existe un registro para este evento
          const { data: existingReg } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('member_id', results.member.id)
            .eq('event_id', att.event_id)
            .maybeSingle();

          if (!existingReg) {
            // Crear registro
            const { data: newReg, error: regError } = await supabase
              .from('event_registrations')
              .insert({
                member_id: results.member.id,
                event_id: att.event_id,
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: att.stripe_session_id,
                stripe_payment_intent_id: att.stripe_payment_intent_id,
                amount_paid: att.amount_paid ? parseFloat(att.amount_paid.toString()) : null,
                currency: att.currency || 'mxn',
                payment_method: att.payment_method || 'card',
                registration_date: att.created_at,
              })
              .select()
              .single();

            if (regError) {
              results.fixes.push({
                action: 'create_registration',
                event_id: att.event_id,
                success: false,
                error: regError.message,
              });
            } else {
              results.registrations.push(newReg);
              results.fixes.push({
                action: 'create_registration',
                event_id: att.event_id,
                success: true,
                registration_id: newReg.id,
              });
            }
          } else {
            // Actualizar registro existente si falta información
            const { error: updateError } = await supabase
              .from('event_registrations')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: att.stripe_session_id || existingReg.stripe_session_id,
                stripe_payment_intent_id: att.stripe_payment_intent_id || existingReg.stripe_payment_intent_id,
                amount_paid: att.amount_paid ? parseFloat(att.amount_paid.toString()) : existingReg.amount_paid,
                currency: att.currency || existingReg.currency || 'mxn',
                payment_method: att.payment_method || existingReg.payment_method || 'card',
              })
              .eq('id', existingReg.id);

            if (!updateError) {
              results.fixes.push({
                action: 'update_registration',
                event_id: att.event_id,
                success: true,
                registration_id: existingReg.id,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('Error creating member from attendee:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
