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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
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

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'succeeded',
            payment_method: paymentIntent.payment_method_types?.[0] || 'card',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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




