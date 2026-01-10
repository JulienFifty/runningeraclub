import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario es admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id es requerido' },
        { status: 400 }
      );
    }

    // Usar service role key para crear la transacción de visita
    const supabaseAdmin = createSupabaseClient(
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
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, slug, price')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información del admin/miembro que está visitando
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const adminName = member?.full_name || member?.email || user.email || 'Admin';
    const eventPrice = event.price || 'Gratis';

    // Crear registro de visita en payment_transactions con status 'pending' pero type 'checkin_visit'
    // Esto permitirá rastrear las visitas sin crear notificaciones de "intento de pago"
    // Usaremos el campo metadata para indicar que es una visita
    const { error: trackError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        event_id: event_id,
        member_id: user.id,
        status: 'pending',
        amount: 0, // Visita, no pago
        currency: 'mxn',
        metadata: {
          type: 'checkin_visit',
          admin_name: adminName,
          event_title: event.title,
          event_price: eventPrice,
        },
      });

    if (trackError) {
      console.error('Error tracking check-in visit:', trackError);
      // No fallar si no se puede registrar, es solo tracking
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in track-checkin-visit:', error);
    // No fallar, es solo tracking
    return NextResponse.json({ success: true });
  }
}
