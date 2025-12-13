import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-display mb-4">404</h1>
          <p className="text-xl mb-8">Página no encontrada</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-foreground text-background uppercase tracking-wider hover:bg-foreground/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}

