import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import CouponsManagement from '@/components/admin/CouponsManagement';

export default async function AdminCouponsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/miembros/login');
  }

  // Verificar si es admin
  const { data: adminData } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email)
    .single();

  if (!adminData) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="section-padding">
        <div className="container-premium max-w-7xl">
          <CouponsManagement />
        </div>
      </section>
      <Footer />
    </main>
  );
}

