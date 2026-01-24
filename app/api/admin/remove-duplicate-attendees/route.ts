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

    // Obtener TODOS los attendees del evento
    const { data: allAttendees, error: attendeesError } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false });

    if (attendeesError) {
      return NextResponse.json(
        { error: 'Error al obtener attendees', details: attendeesError.message },
        { status: 500 }
      );
    }

    // Identificar duplicados
    // Un duplicado es cuando dos o más attendees tienen:
    // - El mismo email (si ambos tienen email)
    // - O el mismo nombre (si no tienen email pero tienen el mismo nombre)
    const duplicates: { [key: string]: any[] } = {};
    const seen: Set<string> = new Set();

    for (const attendee of allAttendees || []) {
      // Crear una clave única para identificar duplicados
      let key: string | null = null;
      
      if (attendee.email) {
        // Si tiene email, usar email normalizado como clave
        key = `email:${attendee.email.toLowerCase().trim()}`;
      } else if (attendee.name) {
        // Si no tiene email pero tiene nombre, usar nombre normalizado
        key = `name:${attendee.name.toLowerCase().trim()}`;
      }

      if (key) {
        if (!seen.has(key)) {
          seen.add(key);
          duplicates[key] = [attendee];
        } else {
          duplicates[key].push(attendee);
        }
      }
    }

    // Filtrar solo los que realmente son duplicados (más de 1)
    const actualDuplicates: { [key: string]: any[] } = {};
    for (const [key, attendees] of Object.entries(duplicates)) {
      if (attendees.length > 1) {
        actualDuplicates[key] = attendees;
      }
    }

    // Para cada grupo de duplicados, mantener el más reciente (o el que tenga más información)
    // y eliminar los demás
    let deletedCount = 0;
    const deleted: any[] = [];
    const kept: any[] = [];

    for (const [key, duplicateGroup] of Object.entries(actualDuplicates)) {
      // Ordenar por:
      // 1. El que tiene más información (email, phone, stripe_session_id)
      // 2. El más reciente
      duplicateGroup.sort((a, b) => {
        const aScore = (a.email ? 10 : 0) + (a.phone ? 5 : 0) + (a.stripe_session_id ? 3 : 0) + (a.stripe_payment_intent_id ? 2 : 0);
        const bScore = (b.email ? 10 : 0) + (b.phone ? 5 : 0) + (b.stripe_session_id ? 3 : 0) + (b.stripe_payment_intent_id ? 2 : 0);
        
        if (aScore !== bScore) {
          return bScore - aScore; // Mayor score primero
        }
        
        // Si tienen el mismo score, usar fecha de creación (más reciente primero)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Mantener el primero (el mejor)
      const toKeep = duplicateGroup[0];
      const toDelete = duplicateGroup.slice(1);

      kept.push({
        key,
        attendee: {
          id: toKeep.id,
          email: toKeep.email,
          name: toKeep.name,
          created_at: toKeep.created_at,
        },
      });

      // Eliminar los duplicados
      for (const attendeeToDelete of toDelete) {
        const { error: deleteError } = await supabase
          .from('attendees')
          .delete()
          .eq('id', attendeeToDelete.id);

        if (!deleteError) {
          deletedCount++;
          deleted.push({
            id: attendeeToDelete.id,
            email: attendeeToDelete.email,
            name: attendeeToDelete.name,
            created_at: attendeeToDelete.created_at,
            reason: `Duplicado de ${toKeep.email || toKeep.name}`,
          });
        } else {
          deleted.push({
            id: attendeeToDelete.id,
            email: attendeeToDelete.email,
            name: attendeeToDelete.name,
            error: deleteError.message,
          });
        }
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
        total_attendees: allAttendees?.length || 0,
        duplicate_groups: Object.keys(actualDuplicates).length,
        duplicates_found: Object.values(actualDuplicates).reduce((sum, group) => sum + group.length, 0),
        deleted: deletedCount,
        kept: kept.length,
      },
      duplicates: actualDuplicates,
      kept,
      deleted,
    });
  } catch (error: any) {
    console.error('❌ Error removing duplicate attendees:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
