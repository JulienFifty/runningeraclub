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

    // 2. Nuevos registros de eventos CON PAGO COMPLETADO (últimas 24 horas)
    // SOLO mostrar inscripciones donde el pago ya está completado (payment_status = 'paid')
    const { data: newRegistrations } = await supabase
      .from('event_registrations')
      .select(`
        id,
        registration_date,
        payment_status,
        amount_paid,
        currency,
        members(full_name, email),
        events(id, title, slug, price)
      `)
      .eq('payment_status', 'paid') // SOLO pagos completados
      .gte('registration_date', last24Hours.toISOString())
      .order('registration_date', { ascending: false })
      .limit(10);

    if (newRegistrations) {
      newRegistrations.forEach((reg: any) => {
        const memberName = reg.members?.full_name || reg.members?.email || 'Usuario';
        const eventTitle = reg.events?.title || 'Evento';
        const eventPrice = reg.events?.price || reg.amount_paid ? `$${reg.amount_paid || 0} ${reg.currency?.toUpperCase() || 'MXN'}` : 'Gratis';
        notifications.push({
          id: `registration-${reg.id}`,
          type: 'new_registration',
          title: 'Nueva inscripción',
          message: `${memberName} se inscribió a "${eventTitle}" - ${eventPrice}`,
          timestamp: reg.registration_date,
          link: reg.events?.slug ? `/eventos/${reg.events.slug}` : undefined,
        });
      });
    }

    // 3. Transacciones de pago COMPLETADAS Y visitas a check-in (últimas 24 horas)
    // Mostrar pagos exitosos, fallidos, reembolsados Y visitas a check-in (pending con metadata.type = 'checkin_visit')
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('id, status, amount, created_at, member_id, event_id, metadata')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    // Filtrar transacciones: excluir 'pending' que NO sean visitas de check-in
    const validTransactions = (transactions || []).filter((t: any) => {
      // Incluir pagos completados (succeeded, failed, refunded)
      if (['succeeded', 'failed', 'refunded'].includes(t.status)) {
        return true;
      }
      // Incluir 'pending' solo si es una visita de check-in
      if (t.status === 'pending' && t.metadata?.type === 'checkin_visit') {
        return true;
      }
      // Excluir todos los demás 'pending' (intentos de pago sin completar)
      return false;
    });

    if (validTransactions.length > 0) {
      // Obtener información de miembros y eventos por separado
      const memberIds = [...new Set(validTransactions.map((t: any) => t.member_id).filter(Boolean))];
      const eventIds = [...new Set(validTransactions.map((t: any) => t.event_id).filter(Boolean))];

      const { data: membersData } = memberIds.length > 0
        ? await supabase
            .from('members')
            .select('id, full_name, email')
            .in('id', memberIds)
        : { data: [] };

      const { data: eventsData } = eventIds.length > 0
        ? await supabase
            .from('events')
            .select('id, title, slug, price')
            .in('id', eventIds)
        : { data: [] };

      const membersMap = new Map((membersData || []).map((m: any) => [m.id, m]));
      const eventsMap = new Map((eventsData || []).map((e: any) => [e.id, e]));

      validTransactions.forEach((transaction: any) => {
        const member = transaction.member_id ? membersMap.get(transaction.member_id) : null;
        const event = transaction.event_id ? eventsMap.get(transaction.event_id) : null;
        
        // Si es una visita de check-in (pending con metadata.type = 'checkin_visit')
        if (transaction.status === 'pending' && transaction.metadata?.type === 'checkin_visit') {
          const adminName = transaction.metadata?.admin_name || member?.full_name || member?.email || 'Admin';
          const eventTitle = transaction.metadata?.event_title || event?.title || 'Evento';
          const eventPrice = transaction.metadata?.event_price || event?.price || 'Gratis';

          notifications.push({
            id: `checkin-visit-${transaction.id}`,
            type: 'payment_pending', // Usar este tipo para visitas de check-in
            title: 'Visita de la página de check-in',
            message: `${adminName} visitó el check-in de "${eventTitle}" - ${eventPrice}`,
            timestamp: transaction.created_at,
            link: event?.slug ? `/admin/check-in?event=${event.id}` : '/admin/check-in',
          });
          return;
        }

        // Para pagos completados (succeeded, failed, refunded)
        const memberName = member?.full_name || member?.email || 'Usuario';
        const eventTitle = event?.title || 'Evento';
        const eventPrice = event?.price || (transaction.amount ? `$${Number(transaction.amount).toFixed(2)} MXN` : '');
        const amount = transaction.amount ? `$${Number(transaction.amount).toFixed(2)}` : '';

        let type: Notification['type'] = 'payment_success';
        let title = 'Pago exitoso';
        let message = `${memberName} pagó ${amount} por "${eventTitle}" - ${eventPrice}`;

        if (transaction.status === 'failed') {
          type = 'payment_failed';
          title = 'Pago fallido';
          message = `${memberName} - Pago de ${amount} falló para "${eventTitle}" - ${eventPrice}`;
        } else if (transaction.status === 'refunded') {
          type = 'refund';
          title = 'Reembolso procesado';
          message = `Reembolso de ${amount} para ${memberName} - "${eventTitle}" - ${eventPrice}`;
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

