import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_title, event_id } = await request.json();

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
        .select('id, title')
        .ilike('title', `%${event_title}%`)
        .limit(1);
      
      if (foundEvents && foundEvents.length > 0) {
        finalEventId = foundEvents[0].id;
      }
    }

    if (!finalEventId) {
      return NextResponse.json(
        { error: 'event_title o event_id es requerido' },
        { status: 400 }
      );
    }

    // 2. Buscar todos los attendees pagados que no tienen miembro asociado
    const { data: attendees } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay attendees para procesar',
        fixes: [],
      });
    }

    // 3. Para cada attendee, verificar si tiene miembro y crear si falta
    const fixes: any[] = [];
    const processedEmails = new Set<string>();

    for (const attendee of attendees) {
      if (!attendee.email || processedEmails.has(attendee.email)) {
        continue;
      }

      processedEmails.add(attendee.email);

      try {
        // Verificar si existe miembro
        const { data: existingMember } = await supabase
          .from('members')
          .select('id, email')
          .eq('email', attendee.email)
          .maybeSingle();

        if (!existingMember) {
          // Buscar usuario en auth.users
          let authUserId: string | null = null;
          
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            if (authUsers) {
              const user = authUsers.users.find(u => u.email === attendee.email);
              if (user) {
                authUserId = user.id;
              }
            }
          } catch (error) {
            console.error(`Error listing users for ${attendee.email}:`, error);
          }

          if (authUserId) {
            // Crear miembro para usuario existente
            const { data: newMember, error: memberError } = await supabase
              .from('members')
              .insert({
                id: authUserId,
                email: attendee.email,
                full_name: attendee.name || attendee.email.split('@')[0],
                phone: attendee.phone || null,
                membership_type: 'regular',
                membership_status: 'active',
              })
              .select()
              .single();

            if (memberError) {
              fixes.push({
                email: attendee.email,
                action: 'create_member',
                success: false,
                error: memberError.message,
              });
              continue;
            } else {
              fixes.push({
                email: attendee.email,
                action: 'create_member',
                success: true,
                member_id: newMember.id,
              });
            }
          } else {
            // Crear usuario y miembro
            try {
              const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: attendee.email,
                email_confirm: true,
                user_metadata: {
                  full_name: attendee.name || attendee.email.split('@')[0],
                  phone: attendee.phone,
                },
              });

              if (authError || !authUser.user) {
                fixes.push({
                  email: attendee.email,
                  action: 'create_auth_user',
                  success: false,
                  error: authError?.message || 'No se pudo crear el usuario',
                });
                continue;
              }

              const { data: newMember, error: memberError } = await supabase
                .from('members')
                .insert({
                  id: authUser.user.id,
                  email: attendee.email,
                  full_name: attendee.name || attendee.email.split('@')[0],
                  phone: attendee.phone || null,
                  membership_type: 'regular',
                  membership_status: 'active',
                })
                .select()
                .single();

              if (memberError) {
                fixes.push({
                  email: attendee.email,
                  action: 'create_member',
                  success: false,
                  error: memberError.message,
                });
                continue;
              } else {
                fixes.push({
                  email: attendee.email,
                  action: 'create_member',
                  success: true,
                  member_id: newMember.id,
                });
              }
            } catch (error: any) {
              fixes.push({
                email: attendee.email,
                action: 'create_auth_user',
                success: false,
                error: error.message,
              });
              continue;
            }
          }
        }

        // Obtener el miembro (existente o recién creado)
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('email', attendee.email)
          .single();

        if (member) {
          // Buscar todos los eventos de este attendee y crear registros
          const { data: allAttendeeEvents } = await supabase
            .from('attendees')
            .select('event_id, stripe_payment_intent_id, stripe_session_id, amount_paid, currency, payment_method, created_at')
            .eq('email', attendee.email)
            .eq('payment_status', 'paid');

          if (allAttendeeEvents) {
            for (const attEvent of allAttendeeEvents) {
              const { data: existingReg } = await supabase
                .from('event_registrations')
                .select('id')
                .eq('member_id', member.id)
                .eq('event_id', attEvent.event_id)
                .maybeSingle();

              if (!existingReg) {
                const { error: regError } = await supabase
                  .from('event_registrations')
                  .insert({
                    member_id: member.id,
                    event_id: attEvent.event_id,
                    payment_status: 'paid',
                    status: 'confirmed',
                    stripe_session_id: attEvent.stripe_session_id,
                    stripe_payment_intent_id: attEvent.stripe_payment_intent_id,
                    amount_paid: attEvent.amount_paid ? parseFloat(attEvent.amount_paid.toString()) : null,
                    currency: attEvent.currency || 'mxn',
                    payment_method: attEvent.payment_method || 'card',
                    registration_date: attEvent.created_at,
                  });

                if (!regError) {
                  fixes.push({
                    email: attendee.email,
                    action: 'create_registration',
                    event_id: attEvent.event_id,
                    success: true,
                  });
                }
              }
            }
          }
        }
      } catch (error: any) {
        fixes.push({
          email: attendee.email,
          action: 'process_attendee',
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_attendees: attendees.length,
      unique_emails: processedEmails.size,
      fixes_applied: fixes.filter(f => f.success).length,
      fixes_failed: fixes.filter(f => !f.success).length,
      fixes: fixes,
    });
  } catch (error: any) {
    console.error('Error fixing all guests to members:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
