import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

    // Obtener todos los miembros sin límite
    let allMembers: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          email,
          full_name,
          phone,
          instagram,
          membership_type,
          membership_status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json(
          { error: 'Error al obtener miembros', details: error.message },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        allMembers = [...allMembers, ...data];
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    // Obtener conteo de registros para cada miembro
    const membersWithCounts = await Promise.all(
      allMembers.map(async (member) => {
        const { count } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id);

        return {
          ...member,
          _count: {
            registrations: count || 0,
          },
        };
      })
    );

    return NextResponse.json({
      members: membersWithCounts,
      total: membersWithCounts.length,
    });
  } catch (error: any) {
    console.error('Error in admin members API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

