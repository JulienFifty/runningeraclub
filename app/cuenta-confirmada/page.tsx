"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

function CuentaConfirmadaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventSlug, setEventSlug] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const slug = searchParams?.get('event');
    const title = searchParams?.get('event_title');
    
    if (slug) {
      setEventSlug(slug);
      setEventTitle(title || '');
    }

    setTimeout(() => setLoading(false), 1500);
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

              {eventSlug ? (
                <>
                  {/* Continue to Event */}
                  <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ahora puedes continuar con tu registro en:
                    </p>
                    <p className="text-foreground font-semibold">
                      {eventTitle || 'el evento que seleccionaste'}
                    </p>
                  </div>

                  <button
                    onClick={handleContinueToEvent}
                    disabled={isRegistering}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 mb-4"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Continuar con el Registro
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

