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
        registration_date,
        status,
        payment_status,
        events:event_id (
          id,
          title,
          slug,
          date,
          location,
          price
        )
      `)
      .eq('member_id', memberId)
      .order('registration_date', { ascending: false });

    // Obtener transacciones
    const { data: transactionsData, error: transError } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        currency,
        status,
        created_at,
        events:event_id (
          title
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    // Transformar datos de registros
    const registrations = (registrationsData || []).map((reg: any) => ({
      id: reg.id,
      registration_date: reg.registration_date,
      status: reg.status,
      payment_status: reg.payment_status,
      event: Array.isArray(reg.events) && reg.events.length > 0 
        ? reg.events[0] 
        : reg.events || null,
    }));

    // Transformar datos de transacciones
    const transactions = (transactionsData || []).map((trans: any) => ({
      id: trans.id,
      amount: trans.amount,
      currency: trans.currency,
      status: trans.status,
      created_at: trans.created_at,
      event: Array.isArray(trans.events) && trans.events.length > 0
        ? trans.events[0]
        : trans.events || null,
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

