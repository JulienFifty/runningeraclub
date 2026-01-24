import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle, Mail, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function RegistrationConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    notFound();
  }

  const supabase = await createClient();

  let eventTitle = 'Evento';
  let eventSlug: string | null = null;
  let eventDate: string | null = null;
  let eventLocation: string | null = null;
  let amount = 0;
  let currency = 'mxn';
  let guestName = '';
  let guestEmail = '';
  let eventId: string | null = null;

  // Obtener información de la sesión de Stripe
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer_details'],
    });

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      notFound();
    }

    // Obtener datos del guest desde metadata
    const metadata = session.metadata || {};
    eventId = metadata.event_id || null;
    guestName = metadata.guest_name || session.customer_details?.name || 'Invitado';
    guestEmail = metadata.guest_email || session.customer_details?.email || '';
    amount = session.amount_total ? session.amount_total / 100 : 0;
    currency = session.currency?.toUpperCase() || 'MXN';

    // Obtener información del evento
    if (eventId) {
      const { data: event } = await supabase
        .from('events')
        .select('title, slug, date, location')
        .eq('id', eventId)
        .single();

      if (event) {
        eventTitle = event.title;
        eventSlug = event.slug;
        eventDate = event.date;
        eventLocation = event.location;
      }
    }
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="section-padding">
        <div className="container-premium max-w-2xl">
          <div className="text-center space-y-8">
            {/* Icono de éxito */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light">
                ¡Registro Confirmado!
              </h1>
              <p className="text-xl text-muted-foreground">
                Te has registrado exitosamente al evento
              </p>
            </div>

            {/* Información del registro */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 text-left">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Evento</p>
                    <p className="text-foreground font-medium text-lg">{eventTitle}</p>
                  </div>
                </div>

                {eventDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="text-foreground font-medium">{eventDate}</p>
                    </div>
                  </div>
                )}

                {eventLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="text-foreground font-medium">{eventLocation}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Registrado a nombre de</p>
                    <p className="text-foreground font-medium">{guestName}</p>
                    {guestEmail && (
                      <p className="text-muted-foreground text-sm mt-1">{guestEmail}</p>
                    )}
                  </div>
                </div>

                {amount > 0 && (
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-muted-foreground">Monto pagado</span>
                    <span className="text-foreground font-semibold text-lg">
                      ${amount.toFixed(2)} {currency}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mensaje importante */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Importante:</strong> Recibirás un correo de confirmación con todos los detalles del evento. 
                Guarda este correo para tener acceso a la información del evento.
              </p>
            </div>

            {/* Información adicional */}
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                ¿Quieres crear una cuenta para gestionar tus registros?
              </p>
              <p className="text-muted-foreground text-xs">
                Con una cuenta podrás ver todos tus eventos registrados, actualizar tu perfil y más.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {eventSlug && (
                <Link
                  href={`/eventos/${eventSlug}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-sm font-medium tracking-wider uppercase"
                >
                  Ver Evento
                </Link>
              )}
              <Link
                href="/miembros/login?signup=true"
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-sm font-medium tracking-wider uppercase"
              >
                Crear Cuenta
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-sm font-medium tracking-wider uppercase"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
