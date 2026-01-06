import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="section-padding">
        <div className="container-premium max-w-2xl">
          <div className="text-center space-y-8">
            {/* Icono de cancelación */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-orange-600" />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light">
                Pago Cancelado
              </h1>
              <p className="text-xl text-muted-foreground">
                No se completó el proceso de pago
              </p>
            </div>

            {/* Mensaje */}
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground">
                No te preocupes, no se realizó ningún cargo. Puedes intentar registrarte nuevamente cuando estés listo.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#eventos"
                className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-sm font-medium tracking-wider uppercase"
              >
                Ver Eventos
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-sm font-medium tracking-wider uppercase"
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




