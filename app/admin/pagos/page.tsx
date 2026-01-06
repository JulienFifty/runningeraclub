import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Verificar que sea admin
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error || !admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administra y revisa todas las transacciones de pago
          </p>
        </div>

        <PaymentsDashboard />
      </div>
    </div>
  );
}



