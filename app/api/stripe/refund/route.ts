import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id, transaction_id, reason } = await request.json();

    if (!payment_intent_id || !transaction_id) {
      return NextResponse.json(
        { error: 'payment_intent_id y transaction_id son requeridos' },
        { status: 400 }
      );
    }

    // Procesar reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      reason: 'requested_by_customer',
    });

    // Actualizar base de datos con service role key
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

    // Actualizar transacción
    await supabase
      .from('payment_transactions')
      .update({
        status: 'refunded',
        refund_reason: reason || 'Reembolso solicitado',
      })
      .eq('id', transaction_id);

    // Obtener información de la transacción para actualizar registros
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('event_id, member_id, attendee_id')
      .eq('id', transaction_id)
      .single();

    if (transaction) {
      // Actualizar event_registrations si es un miembro
      if (transaction.member_id) {
        await supabase
          .from('event_registrations')
          .update({ payment_status: 'refunded' })
          .eq('member_id', transaction.member_id)
          .eq('event_id', transaction.event_id);
      }

      // Actualizar attendees si es un invitado
      if (transaction.attendee_id) {
        await supabase
          .from('attendees')
          .update({ payment_status: 'refunded' })
          .eq('id', transaction.attendee_id);
      }
    }

    return NextResponse.json({
      success: true,
      refund_id: refund.id,
      status: refund.status,
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Error al procesar reembolso', details: error.message },
      { status: 500 }
    );
  }
}





