import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

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

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      // ✅ EVENTO PRINCIPAL: Cuando el checkout se completa exitosamente
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('✅ Checkout session completed:', session.id);

        // Actualizar transacción
        await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
            payment_method: session.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_session_id', session.id);

        const metadata = session.metadata;
        if (metadata) {
          const { event_id, member_id, attendee_id, is_guest } = metadata;

          if (is_guest === 'true' && attendee_id) {
            // Actualizar attendee
            const { data: updateData, error: updateError } = await supabase
              .from('attendees')
              .update({
                payment_status: 'paid',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency || 'mxn',
                payment_method: session.payment_method_types?.[0] || 'card',
              })
              .eq('id', attendee_id)
              .select();

            if (updateError) {
              console.error('Error updating attendee:', updateError);
            } else {
              console.log('✅ Attendee updated successfully:', updateData);
            }
          } else if (member_id) {
            // Actualizar event_registration
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
              .eq('member_id', member_id)
              .eq('event_id', event_id)
              .select();

            if (updateError) {
              console.error('Error updating event registration:', updateError);
            } else {
              console.log('✅ Event registration updated successfully:', updateData);
            }
          }
        }
        break;
      }

      // ✅ Cuando el pago se procesa exitosamente (backup)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('✅ Payment intent succeeded:', paymentIntent.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            payment_method: paymentIntent.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // ❌ Cuando el pago falla
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('❌ Payment intent failed:', paymentIntent.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // También actualizar el registro si existe
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // 🔄 Cuando se cancela un pago
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log('🔄 Payment intent canceled:', paymentIntent.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // 💰 Cuando se procesa un reembolso
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        console.log('💰 Charge refunded:', charge.id);
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        // Actualizar registros de eventos
        await supabase
          .from('event_registrations')
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        // Actualizar attendees
        await supabase
          .from('attendees')
          .update({
            payment_status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);
        break;
      }

      // 📧 Cuando el checkout está pendiente (ej: OXXO)
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('📧 Async payment succeeded:', session.id);
        
        // Mismo manejo que checkout.session.completed
        const metadata = session.metadata;
        if (metadata) {
          const { event_id, member_id, attendee_id, is_guest } = metadata;

          if (is_guest === 'true' && attendee_id) {
            await supabase
              .from('attendees')
              .update({
                payment_status: 'paid',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
              })
              .eq('id', attendee_id);
          } else if (member_id) {
            await supabase
              .from('event_registrations')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                amount_paid: session.amount_total ? session.amount_total / 100 : 0,
              })
              .eq('member_id', member_id)
              .eq('event_id', event_id);
          }
        }
        break;
      }

      // ❌ Cuando el pago asíncrono falla (ej: OXXO expirado)
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('❌ Async payment failed:', session.id);
        
        const metadata = session.metadata;
        if (metadata) {
          const { event_id, member_id, attendee_id, is_guest } = metadata;

          if (is_guest === 'true' && attendee_id) {
            await supabase
              .from('attendees')
              .update({
                payment_status: 'failed',
              })
              .eq('id', attendee_id);
          } else if (member_id) {
            await supabase
              .from('event_registrations')
              .update({
                payment_status: 'failed',
              })
              .eq('member_id', member_id)
              .eq('event_id', event_id);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}
