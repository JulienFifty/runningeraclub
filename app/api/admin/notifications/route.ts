import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface Notification {
  id: string;
  type: 'new_member' | 'new_registration' | 'payment_success' | 'payment_failed' | 'payment_pending' | 'refund';
  title: string;
  message: string;
  timestamp: string;
  link?: string;
}

export async function GET() {
  try {
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

    const notifications: Notification[] = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Nuevos miembros (últimas 24 horas)
    const { data: newMembers } = await supabase
      .from('members')
      .select('id, full_name, email, created_at')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (newMembers) {
      newMembers.forEach((member) => {
        notifications.push({
          id: `member-${member.id}`,
          type: 'new_member',
          title: 'Nueva cuenta creada',
          message: `${member.full_name || member.email} se ha registrado`,
          timestamp: member.created_at,
          link: `/admin/miembros`,
        });
      });
    }

    // 2. Nuevos registros de eventos (últimas 24 horas)
    const { data: newRegistrations } = await supabase
      .from('event_registrations')
      .select(`
        id,
        registration_date,
        members(full_name, email),
        events(title, slug)
      `)
      .gte('registration_date', last24Hours.toISOString())
      .order('registration_date', { ascending: false })
      .limit(10);

    if (newRegistrations) {
      newRegistrations.forEach((reg: any) => {
        const memberName = reg.members?.full_name || reg.members?.email || 'Usuario';
        const eventTitle = reg.events?.title || 'Evento';
        notifications.push({
          id: `registration-${reg.id}`,
          type: 'new_registration',
          title: 'Nueva inscripción',
          message: `${memberName} se inscribió a "${eventTitle}"`,
          timestamp: reg.registration_date,
          link: reg.events?.slug ? `/eventos/${reg.events.slug}` : undefined,
        });
      });
    }

    // 3. Transacciones de pago (últimas 24 horas)
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('id, status, amount, created_at, member_id, event_id')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (transactions) {
      // Obtener información de miembros y eventos por separado
      const memberIds = [...new Set(transactions.map((t: any) => t.member_id).filter(Boolean))];
      const eventIds = [...new Set(transactions.map((t: any) => t.event_id).filter(Boolean))];

      const { data: membersData } = memberIds.length > 0
        ? await supabase
            .from('members')
            .select('id, full_name, email')
            .in('id', memberIds)
        : { data: [] };

      const { data: eventsData } = eventIds.length > 0
        ? await supabase
            .from('events')
            .select('id, title, slug')
            .in('id', eventIds)
        : { data: [] };

      const membersMap = new Map((membersData || []).map((m: any) => [m.id, m]));
      const eventsMap = new Map((eventsData || []).map((e: any) => [e.id, e]));

      transactions.forEach((transaction: any) => {
        const member = transaction.member_id ? membersMap.get(transaction.member_id) : null;
        const event = transaction.event_id ? eventsMap.get(transaction.event_id) : null;
        
        const memberName = member?.full_name || member?.email || 'Usuario';
        const eventTitle = event?.title || 'Evento';
        const amount = transaction.amount ? `$${Number(transaction.amount).toFixed(2)}` : '';

        let type: Notification['type'] = 'payment_pending';
        let title = 'Intento de pago';
        let message = `${memberName} intentó pagar ${amount} por "${eventTitle}"`;

        if (transaction.status === 'succeeded') {
          type = 'payment_success';
          title = 'Pago exitoso';
          message = `${memberName} pagó ${amount} por "${eventTitle}"`;
        } else if (transaction.status === 'failed') {
          type = 'payment_failed';
          title = 'Pago fallido';
          message = `${memberName} - Pago de ${amount} falló para "${eventTitle}"`;
        } else if (transaction.status === 'refunded') {
          type = 'refund';
          title = 'Reembolso procesado';
          message = `Reembolso de ${amount} para ${memberName} - "${eventTitle}"`;
        }

        notifications.push({
          id: `payment-${transaction.id}`,
          type,
          title,
          message,
          timestamp: transaction.created_at,
          link: event?.slug ? `/eventos/${event.slug}` : undefined,
        });
      });
    }

    // Ordenar por timestamp (más recientes primero)
    notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limitar a las 30 más recientes
    const recentNotifications = notifications.slice(0, 30);

    return NextResponse.json({
      notifications: recentNotifications,
      count: recentNotifications.length,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones', details: error.message },
      { status: 500 }
    );
  }
}

