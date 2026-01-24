import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { event_id, mark_all_with_email = false } = await request.json();

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

    // Obtener información del evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado', details: eventError?.message },
        { status: 404 }
      );
    }

    // Obtener attendees que NO tienen payment_status = 'paid'
    // Primero obtener todos los attendees del evento
    const { data: allAttendees } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event_id);

    // Filtrar los que NO tienen payment_status = 'paid'
    const attendeesToFix = (allAttendees || []).filter((a: any) => {
      if (a.payment_status === 'paid') return false;
      if (mark_all_with_email && !a.email) return false;
      return true;
    });

    let updatedCount = 0;
    const results: any[] = [];

    // Actualizar cada attendee
    for (const attendee of attendeesToFix) {
      try {
        const { error: updateError } = await supabase
          .from('attendees')
          .update({
            payment_status: 'paid',
          })
          .eq('id', attendee.id);

        if (!updateError) {
          updatedCount++;
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
        slug: event.slug,
      },
      summary: {
        total_to_fix: attendeesToFix?.length || 0,
        updated: updatedCount,
        failed: (attendeesToFix?.length || 0) - updatedCount,
      },
      results,
    });
  } catch (error: any) {
    console.error('❌ Error marking attendees as paid:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
