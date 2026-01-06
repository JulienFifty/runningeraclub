import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function checkAdminAuth() {
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/admin/login');
  }

  // Verificar que sea admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .single();

  if (adminError || !admin) {
    // No es admin, cerrar sesión y redirigir
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  return { user, admin };
}



