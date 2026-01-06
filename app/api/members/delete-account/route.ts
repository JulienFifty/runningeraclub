import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = user.id;

    console.log('🗑️ Iniciando eliminación de cuenta:', { userId, email: user.email });

    // 1. Eliminar registros de eventos
    const { error: registrationsError } = await supabase
      .from('event_registrations')
      .delete()
      .eq('member_id', userId);

    if (registrationsError) {
      console.error('Error al eliminar registros de eventos:', registrationsError);
      // Continuar con la eliminación aunque falle
    } else {
      console.log('✅ Registros de eventos eliminados');
    }

    // 2. Eliminar conexiones de Strava (si existen)
    const { error: stravaError } = await supabase
      .from('strava_connections')
      .delete()
      .eq('user_id', userId);

    if (stravaError) {
      console.error('Error al eliminar conexiones de Strava:', stravaError);
      // Continuar con la eliminación aunque falle
    } else {
      console.log('✅ Conexiones de Strava eliminadas');
    }

    // 3. Eliminar avatar de Storage (si existe)
    try {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove(filePaths);

        if (storageError) {
          console.error('Error al eliminar avatar:', storageError);
        } else {
          console.log('✅ Avatar eliminado');
        }
      }
    } catch (storageError) {
      console.error('Error al acceder a storage:', storageError);
      // Continuar con la eliminación aunque falle
    }

    // 4. Eliminar perfil de members
    const { error: memberError } = await supabase
      .from('members')
      .delete()
      .eq('id', userId);

    if (memberError) {
      console.error('❌ Error al eliminar perfil de member:', memberError);
      return NextResponse.json(
        { error: 'Error al eliminar perfil', details: memberError.message },
        { status: 500 }
      );
    }

    console.log('✅ Perfil de member eliminado');

    // 5. Eliminar usuario de Auth (esto debe ser lo último)
    // Necesitamos usar el Service Role Client para eliminar usuarios
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('❌ Error al eliminar usuario de Auth:', deleteAuthError);
      return NextResponse.json(
        { error: 'Error al eliminar cuenta de autenticación', details: deleteAuthError.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuario de Auth eliminado');
    console.log('🎉 Cuenta completamente eliminada:', { userId, email: user.email });

    // Cerrar sesión (esto limpia las cookies)
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('💥 Error inesperado al eliminar cuenta:', error);
    return NextResponse.json(
      { error: 'Error al procesar la eliminación', details: error.message },
      { status: 500 }
    );
  }
}

