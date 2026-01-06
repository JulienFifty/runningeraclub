import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Eliminar conexión de Strava
    const { error } = await supabase
      .from('strava_connections')
      .delete()
      .eq('member_id', user.id);

    if (error) {
      console.error('Error disconnecting Strava:', error);
      return NextResponse.json(
        { error: 'Error al desconectar Strava' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Strava desconectado exitosamente',
    });
  } catch (error: any) {
    console.error('Error in disconnect:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}



