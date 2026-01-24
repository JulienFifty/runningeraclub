import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
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

    // Verificar que el evento es gratis
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    const priceStr = event.price?.toString().toLowerCase() || '';
    const isFreeEvent = !event.price || 
      event.price === '0' || 
      priceStr.includes('gratis') ||
      priceStr.includes('free');

    if (!isFreeEvent) {
      return NextResponse.json(
        { error: 'Este endpoint solo debe usarse para eventos gratuitos' },
        { status: 400 }
      );
    }

    // Obtener todos los attendees del evento que tienen payment_status = 'paid'
    // pero NO tienen stripe_session_id ni stripe_payment_intent_id
    // (estos son los que se marcaron incorrectamente como 'paid')
    const { data: attendeesToReset, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event_id)
      .eq('payment_status', 'paid')
      .is('stripe_session_id', null)
      .is('stripe_payment_intent_id', null);

    if (attendeesError) {
      return NextResponse.json(
        { error: 'Error al obtener attendees', details: attendeesError.message },
        { status: 500 }
      );
    }

    let resetCount = 0;
    const results: any[] = [];

    // Resetear payment_status a null para eventos gratuitos sin pago real
    for (const attendee of attendeesToReset || []) {
      try {
        const { error: updateError } = await supabase
          .from('attendees')
          .update({
            payment_status: null, // null para eventos gratuitos
          })
          .eq('id', attendee.id);

        if (!updateError) {
          resetCount++;
          results.push({
            attendee_id: attendee.id,
            email: attendee.email,
            name: attendee.name,
            success: true,
          });
        } else {
          results.push({
            attendee_id: attendee.id,
            email: attendee.email,
            name: attendee.name,
            success: false,
            error: updateError.message,
          });
        }
      } catch (error: any) {
        results.push({
          attendee_id: attendee.id,
          email: attendee.email,
          name: attendee.name,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        price: event.price,
      },
      summary: {
        total_to_reset: attendeesToReset?.length || 0,
        reset: resetCount,
        failed: (attendeesToReset?.length || 0) - resetCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('❌ Error resetting free event attendees:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
