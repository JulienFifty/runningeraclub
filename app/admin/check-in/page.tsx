"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Upload } from 'lucide-react';
import { ImportAttendeesModal } from '@/components/admin/ImportAttendeesModal';
import { CheckinDashboard } from '@/components/admin/CheckinDashboard';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Forzar renderizado dinámico (evita prerender durante build)
export const dynamic = 'force-dynamic';

interface Event {
  id: string;
  title: string;
  date: string;
  slug: string;
}

export default function AdminCheckIn() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAdminAuth();
  }, [router]);

  const checkAdminAuth = async () => {
    try {
      // 1. Verificar autenticación de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);

      // 2. Verificar que es admin en la tabla admins
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

      // 3. Cargar eventos
      loadEvents();
    } catch (error) {
      console.error('Error checking admin auth:', error);
      router.push('/admin/login');
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, slug')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleImportComplete = () => {
    setRefreshKey((prev) => prev + 1);
    setIsImportModalOpen(false);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verificando autenticación...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Link>

          <div className="mb-6">
            <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
              Gestión de Check-in
            </h1>
            <p className="text-muted-foreground">
              Importa asistentes y gestiona la entrada a eventos
            </p>
          </div>

          {/* Selector de evento */}
          <div className="bg-card border border-border p-6 rounded-lg mb-6">
            <label htmlFor="event-select" className="block text-sm font-medium text-foreground mb-2">
              Filtrar por evento (opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                id="event-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Todos los eventos</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.date}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Botón para importar */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Importar desde Excel/CSV</span>
          </button>
        </div>

        {/* Dashboard de check-in */}
        <div key={refreshKey}>
          <CheckinDashboard eventId={selectedEventId || undefined} />
        </div>

        {/* Modal de importación */}
        <ImportAttendeesModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={handleImportComplete}
          eventId={selectedEventId || undefined}
        />
      </div>
    </main>
  );
}

