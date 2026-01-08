import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, Users, CreditCard, FileCheck, Tag, ExternalLink } from 'lucide-react';
import { AdminNotifications } from '@/components/admin/AdminNotifications';

export default async function AdminDashboard() {
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

  const adminSections = [
    {
      href: '/admin/eventos',
      icon: Calendar,
      label: 'Eventos',
      description: 'Gestionar eventos y calendario',
    },
    {
      href: '/admin/miembros',
      icon: Users,
      label: 'Miembros',
      description: 'Gestionar miembros registrados',
    },
    {
      href: '/admin/check-in',
      icon: FileCheck,
      label: 'Check-in',
      description: 'Registro de asistencia',
    },
    {
      href: '/admin/pagos',
      icon: CreditCard,
      label: 'Pagos',
      description: 'Transacciones y reembolsos',
    },
    {
      href: '/admin/cupones',
      icon: Tag,
      label: 'Cupones',
      description: 'Gestionar cupones de descuento',
    },
    {
      href: '/',
      icon: ExternalLink,
      label: 'Ver Sitio',
      description: 'Ir al sitio principal',
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="section-padding">
        <div className="container-premium max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-light mb-4">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground text-lg">
              Bienvenido, {admin.email}
            </p>
          </div>

          {/* Notificaciones */}
          <div className="mb-16">
            <AdminNotifications />
          </div>

          {/* Grid de Secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group relative bg-card border border-border rounded-lg p-8 hover:border-foreground/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-xl text-foreground font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {section.label}
                      </h3>
                      <p className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 rounded-full bg-foreground/20"></div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Acceso Rápido */}
          <div className="border-t border-border pt-12">
            <h2 className="font-display text-2xl md:text-3xl text-foreground font-light mb-6">
              Accesos Rápidos
            </h2>
            <Link
              href="/admin/eventos/nuevo"
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors duration-300">
                <Calendar className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground font-light group-hover:opacity-70 transition-opacity">
                  Crear Nuevo Evento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Agrega un nuevo evento al calendario
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
