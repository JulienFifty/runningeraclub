"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Settings, Image, MessageSquare, Users, BarChart3, FileText, Mail, Globe } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticación simple (en producción usar Supabase Auth)
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona los eventos y contenido de RUNNING ERA
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/eventos"
            className="bg-card border border-border p-6 rounded-lg hover:border-foreground/50 transition-colors group"
          >
            <Calendar className="w-8 h-8 text-foreground mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-display text-2xl text-foreground mb-2">Eventos</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona todos los eventos del club
            </p>
          </Link>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <Image className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Galería</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <MessageSquare className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Testimonios</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <Users className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Miembros</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <BarChart3 className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Estadísticas</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <FileText className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Contenido</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <Mail className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Mensajes</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <Globe className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">SEO</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg opacity-50 cursor-not-allowed">
            <Settings className="w-8 h-8 text-foreground mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Configuración</h2>
            <p className="text-muted-foreground text-sm">
              Próximamente
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

