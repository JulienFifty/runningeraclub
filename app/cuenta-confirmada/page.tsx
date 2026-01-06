"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  image: string;
  price: string;
  category: string;
  description?: string;
}

function CuentaConfirmadaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventSlug, setEventSlug] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const loadEventData = async () => {
      // Buscar event_slug en los parámetros (puede venir como 'event' o 'event_slug')
      const slug = searchParams?.get('event_slug') || searchParams?.get('event');
      
      if (slug) {
        setEventSlug(slug);
        setLoadingEvent(true);
        
        // Cargar información completa del evento
        const { data: eventData, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && eventData) {
          setEvent(eventData);
        }
        
        setLoadingEvent(false);
      }

      setTimeout(() => setLoading(false), 1500);
    };

    loadEventData();
  }, [searchParams]);

  const handleContinueToEvent = () => {
    if (eventSlug) {
      router.push(`/eventos/${eventSlug}`);
    } else {
      router.push('/miembros/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
          {loading ? (
            <>
              {/* Loading State */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="font-display text-2xl text-foreground mb-4">
                Confirmando tu cuenta...
              </h1>
              <p className="text-muted-foreground">
                Estamos validando tu información
              </p>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <h1 className="font-display text-3xl text-foreground mb-4">
                ¡Cuenta Confirmada! 🎉
              </h1>

              <p className="text-muted-foreground mb-6">
                Tu email ha sido verificado exitosamente.
              </p>

              {eventSlug && event ? (
                <>
                  {/* Event Card */}
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Continúa con tu registro en:
                    </p>
                    
                    <div className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Event Image */}
                      {event.image && (
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="inline-block bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-black uppercase">
                              {event.category?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Event Info */}
                      <div className="p-4 text-left">
                        <h3 className="font-display text-lg font-bold text-black mb-3 leading-tight">
                          {event.title}
                        </h3>
                        
                        <div className="space-y-2">
                          {/* Date */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(event.date), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                          
                          {/* Price */}
                          {event.price && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-black">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-lg">
                                {event.price.toLowerCase() === 'gratis' 
                                  ? 'GRATIS' 
                                  : event.price.includes('$') 
                                    ? event.price 
                                    : `$${event.price}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleContinueToEvent}
                    disabled={isRegistering}
                    className="w-full bg-black text-white py-4 rounded-lg hover:bg-black/90 transition-colors font-medium flex items-center justify-center gap-2 mb-4"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Seguir con mi Registro
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <Link
                    href="/miembros/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    O ir al dashboard →
                  </Link>
                </>
              ) : eventSlug && loadingEvent ? (
                <>
                  {/* Loading Event */}
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cargando información del evento...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Go to Dashboard */}
                  <button
                    onClick={() => router.push('/miembros/dashboard')}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 mb-4"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <Link
                    href="/#eventos"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver eventos disponibles →
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Info Box */}
        {!loading && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda?{' '}
              <a
                href="mailto:support@runningeraclub.com"
                className="text-primary hover:underline font-medium"
              >
                Contáctanos
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CuentaConfirmada() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CuentaConfirmadaContent />
    </Suspense>
  );
}

