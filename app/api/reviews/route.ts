import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET - Obtener reseñas aprobadas
export async function GET() {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Error al obtener reseñas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reviews: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reseña
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Debes estar autenticado para crear una reseña' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment, full_name } = body;

    if (!rating || !comment || !full_name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: rating, comment, full_name' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Obtener datos del miembro si existe
    const { data: member } = await supabase
      .from('members')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        member_id: user.id,
        full_name: full_name || member?.full_name || user.email?.split('@')[0] || 'Usuario',
        email: member?.email || user.email || null,
        rating: parseInt(rating),
        comment: comment.trim(),
        status: 'approved', // Auto-aprobar para que aparezca inmediatamente
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Error al crear reseña', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error('Error in create review API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

