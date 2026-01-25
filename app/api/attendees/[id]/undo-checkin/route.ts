import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Función para validar si es un UUID válido
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Usar service role key si está disponible, sino usar cliente normal
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase incompleta' },
        { status: 500 }
      );
    }

    // Usar service role key si está disponible (bypass RLS)
    const supabase = supabaseServiceKey
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createSupabaseClient(supabaseUrl, supabaseAnonKey);

    // Verificar si el ID es un UUID válido o un ID compuesto de miembro
    if (isValidUUID(id)) {
      // Es un UUID válido, actualizar directamente en attendees
      const { data, error } = await supabase
        .from('attendees')
        .update({
          status: 'pending',
          checked_in_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Error al deshacer el check-in', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        attendee: data,
      });
    } else if (id.startsWith('member_')) {
      // Es un ID compuesto de miembro (member_memberId_eventId)
      const parts = id.replace('member_', '').split('_');
      if (parts.length !== 2) {
        return NextResponse.json(
          { error: 'ID de miembro inválido', details: 'Formato esperado: member_memberId_eventId' },
          { status: 400 }
        );
      }

      const [memberId, eventId] = parts;

      // Validar que ambos sean UUIDs válidos
      if (!isValidUUID(memberId) || !isValidUUID(eventId)) {
        return NextResponse.json(
          { error: 'ID de miembro o evento inválido', details: 'Los IDs deben ser UUIDs válidos' },
          { status: 400 }
        );
      }

      // Obtener información del miembro
      const { data: member } = await supabase
        .from('members')
        .select('email')
        .eq('id', memberId)
        .single();

      // Buscar si existe un attendee con este email y event_id
      let attendee = null;
      if (member?.email) {
        const { data: existingAttendee } = await supabase
          .from('attendees')
          .select('*')
          .eq('email', member.email)
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingAttendee) {
          attendee = existingAttendee;
        }
      }

      if (attendee) {
        // Actualizar el attendee existente
        const { data: updatedAttendee, error: updateError } = await supabase
          .from('attendees')
          .update({
            status: 'pending',
            checked_in_at: null,
          })
          .eq('id', attendee.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: 'Error al deshacer el check-in', details: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          attendee: updatedAttendee,
        });
      } else {
        // Si no existe attendee, simplemente retornar éxito (el check-in se deshizo virtualmente)
        return NextResponse.json({
          success: true,
          message: 'Check-in deshecho (registro de miembro)',
        });
      }
    } else {
      return NextResponse.json(
        { error: 'ID inválido', details: 'El ID debe ser un UUID válido o un ID de miembro' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}









