import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_title, event_id } = await request.json();

    if (!event_title && !event_id) {
      return NextResponse.json(
        { error: 'event_title o event_id es requerido' },
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

    // 1. Obtener el evento
    let finalEventId = event_id;
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
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', finalEventId)
      .single();

    // 2. Buscar todas las transacciones de pago exitosas para este evento
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false });

    // 3. Buscar todos los attendees para este evento
    const { data: attendees } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    // 4. Buscar todos los registros en event_registrations
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', finalEventId)
      .eq('payment_status', 'paid')
      .order('registration_date', { ascending: false });

    // 5. Buscar en Stripe directamente todas las sesiones de checkout completadas para este evento
    // Usar los payment_intent_ids de las transacciones para buscar en Stripe
    let stripeSessions: any[] = [];
    try {
      // Obtener todos los payment_intent_ids de las transacciones
      const paymentIntentIds = (transactions || [])
        .map(t => t.stripe_payment_intent_id)
        .filter(Boolean) as string[];

      // Buscar cada payment intent en Stripe para obtener la sesión
      for (const paymentIntentId of paymentIntentIds) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.metadata?.event_id === finalEventId || 
              paymentIntent.metadata?.event_id === event?.id) {
            // Buscar la sesión de checkout asociada
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntentId,
              limit: 1,
              expand: ['data.customer_details'],
            });
            
            if (sessions.data.length > 0 && sessions.data[0].payment_status === 'paid') {
              stripeSessions.push(sessions.data[0]);
            }
          }
        } catch (piError) {
          console.error(`Error retrieving payment intent ${paymentIntentId}:`, piError);
        }
      }

      // También buscar sesiones recientes y filtrar por metadata
      const recentSessions = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        expand: ['data.customer_details'],
      });

      // Filtrar por metadata.event_id y agregar si no están ya en la lista
      recentSessions.data.forEach((session: any) => {
        const metadata = session.metadata || {};
        if (metadata.event_id === finalEventId && 
            session.payment_status === 'paid' &&
            !stripeSessions.find(s => s.id === session.id)) {
          stripeSessions.push(session);
        }
      });
    } catch (stripeError) {
      console.error('Error fetching Stripe sessions:', stripeError);
    }

    // 6. Comparar y encontrar discrepancias
    const transactionPaymentIntents = new Set(
      (transactions || [])
        .map(t => t.stripe_payment_intent_id)
        .filter(Boolean)
    );

    const attendeePaymentIntents = new Set(
      (attendees || [])
        .map(a => a.stripe_payment_intent_id)
        .filter(Boolean)
    );

    const stripePaymentIntents = new Set(
      stripeSessions
        .map(s => s.payment_intent)
        .filter(Boolean)
    );

    // Encontrar pagos en Stripe que no tienen attendee
    const missingAttendees = stripeSessions.filter((session: any) => {
      const paymentIntent = session.payment_intent;
      return paymentIntent && !attendeePaymentIntents.has(paymentIntent);
    });

    // Encontrar pagos en Stripe que no tienen transaction
    const missingTransactions = stripeSessions.filter((session: any) => {
      const paymentIntent = session.payment_intent;
      return paymentIntent && !transactionPaymentIntents.has(paymentIntent);
    });

    // Encontrar pagos en Stripe que no tienen registration
    const missingRegistrations = stripeSessions.filter((session: any) => {
      const metadata = session.metadata || {};
      const memberId = metadata.member_id;
      const guestEmail = metadata.guest_email || session.customer_details?.email;
      
      if (memberId) {
        // Verificar si existe registro para este miembro
        const hasRegistration = (registrations || []).some(
          r => r.member_id === memberId && r.event_id === finalEventId
        );
        return !hasRegistration;
      } else if (guestEmail) {
        // Verificar si el email corresponde a un miembro y tiene registro
        const memberReg = (registrations || []).find(
          r => {
            // Necesitamos buscar el miembro por email
            return false; // Por ahora, retornamos false
          }
        );
        return false; // Por ahora
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      event: event,
      summary: {
        transactions_in_db: transactions?.length || 0,
        attendees_in_db: attendees?.length || 0,
        registrations_in_db: registrations?.length || 0,
        stripe_sessions_paid: stripeSessions.length,
        missing_attendees: missingAttendees.length,
        missing_transactions: missingTransactions.length,
      },
      transactions: transactions || [],
      attendees: attendees || [],
      registrations: registrations || [],
      stripe_sessions: stripeSessions.map(s => ({
        id: s.id,
        payment_intent: s.payment_intent,
        payment_status: s.payment_status,
        amount_total: s.amount_total,
        customer_email: s.customer_details?.email || s.customer_email,
        customer_name: s.customer_details?.name,
        metadata: s.metadata,
        created: s.created,
      })),
      missing_attendees: missingAttendees.map(s => ({
        session_id: s.id,
        payment_intent: s.payment_intent,
        customer_email: s.customer_details?.email || s.customer_email,
        customer_name: s.customer_details?.name,
        amount_total: s.amount_total,
        metadata: s.metadata,
      })),
      missing_transactions: missingTransactions.map(s => ({
        session_id: s.id,
        payment_intent: s.payment_intent,
        customer_email: s.customer_details?.email || s.customer_email,
        amount_total: s.amount_total,
      })),
    });
  } catch (error: any) {
    console.error('Error verifying event payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
