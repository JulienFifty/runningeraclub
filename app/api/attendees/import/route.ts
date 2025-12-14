import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface AttendeeData {
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
}

export async function POST(request: Request) {
  try {
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

    // Usar service role key si está disponible (bypass RLS para operaciones administrativas)
    const supabase = supabaseServiceKey
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { attendees, event_id } = await request.json();

    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron asistentes' },
        { status: 400 }
      );
    }

    // Preparar datos para inserción
    const attendeesToInsert = attendees.map((attendee: AttendeeData) => ({
      name: attendee.name,
      email: attendee.email || null,
      phone: attendee.phone || null,
      tickets: attendee.tickets || 1,
      status: 'pending',
      event_id: event_id || null,
    }));

    // Insertar asistentes
    const { data, error } = await supabase
      .from('attendees')
      .insert(attendeesToInsert)
      .select();

    if (error) {
      console.error('Error inserting attendees:', error);
      return NextResponse.json(
        { 
          error: 'Error al importar asistentes', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      attendees: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

