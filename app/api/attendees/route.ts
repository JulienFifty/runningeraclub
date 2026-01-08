import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Usar service role key si está disponible (bypass RLS)
    const supabase = supabaseServiceKey
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { name, email, phone, tickets, event_id, registration_type } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Determinar payment_status basado en registration_type
    // Si es staff o cortesía, marcar como 'paid' para que cuente en el cupo
    const paymentStatus = (registration_type === 'staff' || registration_type === 'cortesia') 
      ? 'paid' 
      : null;

    // Crear el asistente
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        tickets: tickets || 1,
        status: 'pending',
        event_id: event_id || null,
        payment_status: paymentStatus,
        notes: registration_type === 'staff' 
          ? 'Staff - Registro manual' 
          : registration_type === 'cortesia' 
          ? 'Cortesía - Registro manual'
          : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear el asistente', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendee: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Usar service role key si está disponible (bypass RLS)
    const supabase = supabaseServiceKey
      ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    let query = supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al cargar asistentes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendees: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}

