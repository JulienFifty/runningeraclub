"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CancelRegistrationModal } from '@/components/CancelRegistrationModal';

interface EventRegistration {
  id: string;
  event_id: string;
  registration_date: string;
  status: string;
  payment_status: string;
  event: {
    id: string;
    slug: string;
    title: string;
    date: string;
    location: string;
    image: string;
    category: string;
    price?: string;
  };
}

export default function MisEventosPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/miembros/login');
        return;
      }

      await loadRegistrations();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/miembros/login');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          event_id,
          registration_date,
          status,
          payment_status,
          event:events (
            id,
            slug,
            title,
            date,
            location,
            image,
            category,
            price
          )
        `)
        .eq('member_id', user.id)
        .order('registration_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Transformar los datos para que event sea un objeto único en lugar de array
      const transformedData: EventRegistration[] = (data || []).map((reg: any) => ({
        id: reg.id,
        event_id: reg.event_id,
        registration_date: reg.registration_date,
        status: reg.status,
        payment_status: reg.payment_status,
        event: Array.isArray(reg.event) && reg.event.length > 0 
          ? reg.event[0] 
          : (reg.event || null),
      })).filter((reg: EventRegistration) => reg.event !== null);

      setRegistrations(transformedData);
    } catch (error: any) {
      console.error('Error loading registrations:', error);
      toast.error('Error al cargar eventos', {
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; icon: any; className: string }> = {
      registered: { 
        label: 'Registrado', 
        icon: CheckCircle,
        className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' 
      },
      confirmed: { 
        label: 'Confirmado', 
        icon: CheckCircle,
        className: 'bg-green-500/20 text-green-600 border-green-500/30' 
      },
      cancelled: { 
        label: 'Cancelado', 
        icon: XCircle,
        className: 'bg-red-500/20 text-red-600 border-red-500/30' 
      },
      attended: { 
        label: 'Asistió', 
        icon: CheckCircle,
        className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' 
      },
    };

    const variant = variants[status] || variants.registered;
    const Icon = variant.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variant.className}`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      paid: { 
        label: 'Pagado', 
        className: 'bg-green-500/20 text-green-600 border-green-500/30' 
      },
      pending: { 
        label: 'Pendiente', 
        className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' 
      },
      failed: { 
        label: 'Fallido', 
        className: 'bg-red-500/20 text-red-600 border-red-500/30' 
      },
      refunded: { 
        label: 'Reembolsado', 
        className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' 
      },
    };

    const variant = variants[status] || variants.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const handleCancelClick = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
    setCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    loadRegistrations();
    setCancelModalOpen(false);
    setSelectedRegistration(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando eventos...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-0 md:p-8">
      <div className="max-w-7xl mx-auto md:container-premium">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground font-light mb-2">
            Mis Eventos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus registros y eventos
          </p>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              Aún no te has registrado en ningún evento
            </p>
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Explorar Eventos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-foreground/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Image */}
                  <div className="relative w-full md:w-48 h-48 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={reg.event.image}
                      alt={reg.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl md:text-2xl text-foreground font-semibold mb-2 break-words">
                          {reg.event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {reg.event.date ? (() => {
                                try {
                                  const date = new Date(reg.event.date);
                                  if (isNaN(date.getTime())) {
                                    return reg.event.date;
                                  }
                                  return format(date, "d 'de' MMMM, yyyy", { locale: es });
                                } catch (error) {
                                  return reg.event.date;
                                }
                              })() : 'Fecha no disponible'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{reg.event.location || 'Ubicación no disponible'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {getStatusBadge(reg.status)}
                      {getPaymentBadge(reg.payment_status)}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/eventos/${reg.event.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        Ver Detalles
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      {reg.status !== 'cancelled' && reg.status !== 'attended' && (
                        <button
                          onClick={() => handleCancelClick(reg)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar Registro
                        </button>
                      )}
                    </div>

                    {/* Registration Date */}
                    <p className="text-xs text-muted-foreground mt-3">
                      Registrado el {reg.registration_date ? (() => {
                        try {
                          const date = new Date(reg.registration_date);
                          if (isNaN(date.getTime())) {
                            return reg.registration_date;
                          }
                          return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
                        } catch (error) {
                          return reg.registration_date;
                        }
                      })() : 'Fecha no disponible'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Cancelación */}
        {selectedRegistration && (
          <CancelRegistrationModal
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false);
              setSelectedRegistration(null);
            }}
            registration={selectedRegistration}
            onCancelSuccess={handleCancelSuccess}
          />
        )}
      </div>
    </main>
  );
}

