import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID de miembro es requerido' },
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

    // Obtener miembro
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: 'Miembro no encontrado', details: memberError?.message },
        { status: 404 }
      );
    }

    // Obtener registros de eventos
    const { data: registrationsData, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        event_id,
        registration_date,
        status,
        payment_status
      `)
      .eq('member_id', memberId)
      .order('registration_date', { ascending: false });

    // Obtener IDs de eventos únicos
    const eventIds = [...new Set((registrationsData || []).map((r: any) => r.event_id).filter(Boolean))];
    
    // Obtener datos de eventos
    let eventsMap = new Map();
    if (eventIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, slug, date, location, price')
        .in('id', eventIds);
      
      if (eventsData) {
        eventsMap = new Map(eventsData.map((e: any) => [e.id, e]));
      }
    }

    // Obtener transacciones
    const { data: transactionsData, error: transError } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        event_id,
        amount,
        currency,
        status,
        created_at
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    // Obtener IDs de eventos de transacciones
    const transactionEventIds = [...new Set((transactionsData || []).map((t: any) => t.event_id).filter(Boolean))];
    
    // Obtener datos de eventos para transacciones
    let transactionEventsMap = new Map();
    if (transactionEventIds.length > 0) {
      const { data: transactionEventsData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', transactionEventIds);
      
      if (transactionEventsData) {
        transactionEventsMap = new Map(transactionEventsData.map((e: any) => [e.id, e]));
      }
    }

    // Transformar datos de registros
    const registrations = (registrationsData || []).map((reg: any) => ({
      id: reg.id,
      event_id: reg.event_id,
      registration_date: reg.registration_date,
      status: reg.status,
      payment_status: reg.payment_status,
      event: reg.event_id ? eventsMap.get(reg.event_id) || null : null,
    }));

    // Transformar datos de transacciones
    const transactions = (transactionsData || []).map((trans: any) => ({
      id: trans.id,
      amount: trans.amount,
      currency: trans.currency,
      status: trans.status,
      created_at: trans.created_at,
      event: trans.event_id ? transactionEventsMap.get(trans.event_id) || null : null,
    }));

    return NextResponse.json({
      member: memberData,
      registrations,
      transactions,
    });
  } catch (error: any) {
    console.error('Error in admin member detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

