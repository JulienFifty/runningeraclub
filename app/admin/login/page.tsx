"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Lock, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Iniciar sesión con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error('Error al iniciar sesión', {
          description: authError.message,
        });
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Verificar que el usuario sea admin
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', authData.user.email)
        .single();

      if (adminError || !admin) {
        // No es admin, cerrar sesión
        await supabase.auth.signOut();
        toast.error('Acceso denegado', {
          description: 'No tienes permisos de administrador',
        });
        setLoading(false);
        return;
      }

      // Éxito - redirigir al dashboard
      toast.success('Bienvenido, ' + admin.email);
      router.push('/admin');
      router.refresh();
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a la página web</span>
        </Link>
        
        <div className="bg-card border border-border p-8 rounded-lg">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-foreground mx-auto mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-2">
              Acceso de Administrador
            </h1>
            <p className="text-muted-foreground text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  placeholder="admin@ejemplo.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sistema de autenticación seguro con Supabase
          </p>
        </div>
      </div>
    </main>
  );
}
