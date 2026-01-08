import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { registration_id } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: 'registration_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el registro
    const { data: registration, error: registrationError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        member_id,
        event_id,
        status,
        payment_status,
        stripe_session_id,
        stripe_payment_intent_id,
        amount_paid,
        registration_date,
        event:events (
          id,
          title,
          date,
          price
        )
      `)
      .eq('id', registration_id)
      .eq('member_id', user.id)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no esté ya cancelado
    if (registration.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Este registro ya está cancelado' },
        { status: 400 }
      );
    }

    // Verificar que no haya asistido
    if (registration.status === 'attended') {
      return NextResponse.json(
        { error: 'No se puede cancelar un evento al que ya asististe' },
        { status: 400 }
      );
    }

    // Obtener información del evento
    const event = Array.isArray(registration.event) ? registration.event[0] : registration.event;
    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Calcular política de reembolso
    let refundPercentage = 0;
    let refundAmount = 0;
    let canRefund = false;

    if (registration.payment_status === 'paid' && registration.stripe_payment_intent_id) {
      try {
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Política de reembolso:
        // - 100% si cancela >7 días antes
        // - 50% si cancela 3-7 días antes
        // - 0% si cancela <3 días antes
        if (daysUntilEvent > 7) {
          refundPercentage = 100;
          canRefund = true;
        } else if (daysUntilEvent >= 3) {
          refundPercentage = 50;
          canRefund = true;
        } else {
          refundPercentage = 0;
          canRefund = false;
        }

        if (canRefund && registration.amount_paid) {
          refundAmount = Math.round((registration.amount_paid * refundPercentage / 100) * 100) / 100; // Redondear a 2 decimales
        }
      } catch (dateError) {
        console.error('Error calculando fecha:', dateError);
        // Si hay error con la fecha, no reembolsar por seguridad
        canRefund = false;
      }
    }

    // Crear cliente con Service Role Key para bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Procesar reembolso si aplica
    let refundId = null;
    let refundStatus = null;

    if (canRefund && refundAmount > 0 && registration.stripe_payment_intent_id) {
      try {
        // Procesar reembolso en Stripe
        const refund = await stripe.refunds.create({
          payment_intent: registration.stripe_payment_intent_id,
          amount: refundAmount > 0 ? Math.round(refundAmount * 100) : undefined, // Stripe usa centavos
          reason: 'requested_by_customer',
        });

        refundId = refund.id;
        refundStatus = refund.status;

        // Actualizar transacción de pago
        const { data: transaction } = await supabaseAdmin
          .from('payment_transactions')
          .select('id')
          .eq('stripe_payment_intent_id', registration.stripe_payment_intent_id)
          .single();

        if (transaction) {
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: refundPercentage === 100 ? 'refunded' : 'partially_refunded',
              refund_reason: `Cancelación de registro - ${refundPercentage}% reembolsado`,
            })
            .eq('id', transaction.id);
        }
      } catch (refundError: any) {
        console.error('Error procesando reembolso:', refundError);
        // Si el reembolso falla, aún cancelamos el registro pero no actualizamos el estado de pago
        return NextResponse.json(
          { 
            error: 'Error al procesar reembolso', 
            details: refundError.message || 'No se pudo procesar el reembolso en Stripe',
            hint: 'El registro se cancelará pero el reembolso deberá procesarse manualmente'
          },
          { status: 500 }
        );
      }
    }

    // Actualizar el registro a cancelado
    const { error: updateError } = await supabaseAdmin
      .from('event_registrations')
      .update({
        status: 'cancelled',
        payment_status: canRefund && refundPercentage === 100 ? 'refunded' : registration.payment_status,
      })
      .eq('id', registration_id);

    if (updateError) {
      console.error('Error actualizando registro:', updateError);
      return NextResponse.json(
        { error: 'Error al cancelar registro', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: refundPercentage > 0 
        ? `Registro cancelado. Se reembolsará el ${refundPercentage}% ($${refundAmount.toFixed(2)} MXN) a tu método de pago original en 5-10 días hábiles.`
        : 'Registro cancelado exitosamente.',
      refund_percentage: refundPercentage,
      refund_amount: refundAmount,
      refund_id: refundId,
      refund_status: refundStatus,
      can_refund: canRefund,
    });
  } catch (error: any) {
    console.error('Error en cancel-registration:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

