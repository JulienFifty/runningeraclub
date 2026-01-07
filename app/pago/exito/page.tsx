import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    notFound();
  }

  const supabase = await createClient();

  // Primero intentar obtener de la BD
  let transaction: any = null;
  let eventTitle = 'Evento';
  let eventSlug: string | null = null;
  let amount = 0;
  let currency = 'mxn';
  let status = 'succeeded';
  let eventId: string | null = null;
  let memberId: string | null = null;

  const { data: dbTransaction } = await supabase
    .from('payment_transactions')
    .select('*, events(title, slug)')
    .eq('stripe_session_id', sessionId)
    .single();

  if (dbTransaction) {
    transaction = dbTransaction;
    eventTitle = dbTransaction.events?.title || 'Evento';
    eventSlug = dbTransaction.events?.slug || null;
    amount = Number(dbTransaction.amount);
    currency = dbTransaction.currency || 'mxn';
    status = dbTransaction.status;
  } else {
    // Si no está en BD, obtener directamente de Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        amount = session.amount_total ? session.amount_total / 100 : 0;
        currency = session.currency?.toUpperCase() || 'MXN';
        status = 'succeeded';
        eventId = session.metadata?.event_id || null;
        memberId = session.metadata?.member_id || null;

        // Intentar obtener información del evento desde metadata
        if (session.metadata?.event_id) {
          const { data: event } = await supabase
            .from('events')
            .select('title, slug')
            .eq('id', session.metadata.event_id)
            .single();

          if (event) {
            eventTitle = event.title;
            eventSlug = event.slug;
          }
        }

        // ✅ ACTUALIZAR REGISTRO INMEDIATAMENTE si el pago está completo
        // Esto asegura que el registro esté actualizado antes de que el webhook se ejecute
        if (memberId && eventId) {
          console.log('🔄 Actualizando registro inmediatamente después del pago...');
          
          const { error: updateError } = await supabase
            .from('event_registrations')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              stripe_session_id: sessionId,
              stripe_payment_intent_id: session.payment_intent as string,
              amount_paid: amount,
              currency: currency.toLowerCase(),
              payment_method: session.payment_method_types?.[0] || 'card',
            })
            .eq('member_id', memberId)
            .eq('event_id', eventId);

          if (updateError) {
            console.error('⚠️ Error actualizando registro (no crítico, webhook lo hará):', updateError);
          } else {
            console.log('✅ Registro actualizado inmediatamente');
          }
        }
      } else {
        // Si el pago no está completo, redirigir
        notFound();
      }
    } catch (error) {
      console.error('Error retrieving Stripe session:', error);
      notFound();
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="section-padding">
        <div className="container-premium max-w-2xl">
          <div className="text-center space-y-8">
            {/* Icono de éxito */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light">
                ¡Pago Exitoso!
              </h1>
              <p className="text-xl text-muted-foreground">
                Tu registro ha sido confirmado
              </p>
            </div>

            {/* Detalles del pago */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 text-left">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Evento</span>
                <span className="text-foreground font-medium">
                  {eventTitle}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Monto</span>
                <span className="text-foreground font-medium">
                  ${amount.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  Pagado
                </span>
              </div>
            </div>

            {/* Mensaje adicional */}
            <p className="text-muted-foreground">
              Recibirás un correo de confirmación con todos los detalles del evento.
            </p>

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
                href="/miembros/dashboard?payment_success=true"
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-sm font-medium tracking-wider uppercase"
              >
                Ir al Dashboard
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

