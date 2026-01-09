"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { PushNotificationsSettings } from '@/components/admin/PushNotificationsSettings';
import { ManualPushNotification } from '@/components/admin/ManualPushNotification';
import { Loader2 } from 'lucide-react';

export default function NotificacionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/admin/login');
        return;
      }

      // Verificar que sea admin
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        toast.error('Acceso denegado. No tienes permisos de administrador.');
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin auth:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="font-sans text-2xl md:text-3xl font-bold text-foreground mb-2">
            Gestión de Notificaciones Push
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestiona las notificaciones automáticas y envía notificaciones manuales
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* Configuración de Notificaciones Automáticas */}
          <PushNotificationsSettings />

          {/* Enviar Notificación Manual */}
          <ManualPushNotification />
        </div>
      </div>
    </main>
  );
}

