import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id es requerido' },
        { status: 400 }
      );
    }

    console.log('🔄 Sincronizando pago desde Stripe:', session_id);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'customer'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'El pago no está completado', payment_status: session.payment_status },
        { status: 400 }
      );
    }

    const metadata = session.metadata;
    if (!metadata || !metadata.event_id || !metadata.member_id) {
      return NextResponse.json(
        { error: 'Metadata incompleta en la sesión de Stripe' },
        { status: 400 }
      );
    }

    const { event_id, member_id } = metadata;

    console.log('📋 Sincronizando registro:', { event_id, member_id, session_id });

    // Verificar si el registro existe
    const { data: existingRegistration, error: findError } = await supabase
      .from('event_registrations')
      .select('id, payment_status')
      .eq('member_id', member_id)
      .eq('event_id', event_id)
      .maybeSingle();

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
        console.error('❌ Error updating registration:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar registro', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('✅ Registro actualizado:', updateData);
      return NextResponse.json({
        success: true,
        message: 'Registro actualizado exitosamente',
        registration: updateData,
      });
    } else {
      // Crear nuevo registro
      const { data: newRegistration, error: createError } = await supabase
        .from('event_registrations')
        .insert({
          member_id: member_id,
          event_id: event_id,
          status: 'confirmed',
          payment_status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'mxn',
          payment_method: session.payment_method_types?.[0] || 'card',
        })
        .select();

      if (createError) {
        console.error('❌ Error creating registration:', createError);
        return NextResponse.json(
          { error: 'Error al crear registro', details: createError.message },
          { status: 500 }
        );
      }

      console.log('✅ Registro creado:', newRegistration);
      return NextResponse.json({
        success: true,
        message: 'Registro creado exitosamente',
        registration: newRegistration,
      });
    }
  } catch (error: any) {
    console.error('❌ Error syncing payment:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar pago', details: error.message },
      { status: 500 }
    );
  }
}

