import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let query = supabase
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
      `);

    // Si se proporciona un email, filtrar por él
    if (email) {
      query = query.ilike('email', `%${email}%`).limit(10);
    } else {
      query = query.order('created_at', { ascending: false }).limit(100);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Error al obtener miembros', details: error.message },
        { status: 500 }
      );
    }

    // Si no hay filtro por email, obtener conteo de registros para cada miembro
    let membersWithCounts = members || [];
    if (!email) {
      membersWithCounts = await Promise.all(
        (members || []).map(async (member) => {
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
    }

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

