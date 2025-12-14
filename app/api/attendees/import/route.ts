import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface AttendeeData {
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Verificar autenticación (opcional, puede ser público para importación)
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'No autenticado' },
    //     { status: 401 }
    //   );
    // }

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
        { error: 'Error al importar asistentes', details: error.message },
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

