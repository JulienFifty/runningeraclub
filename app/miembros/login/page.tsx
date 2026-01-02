"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Mail, ArrowRight, Instagram } from 'lucide-react';
import { toast } from 'sonner';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default function MemberLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Error al iniciar sesión', {
          description: error.message,
        });
        return;
      }

      if (data.user) {
        toast.success('¡Bienvenido de nuevo!', {
          description: 'Has iniciado sesión correctamente',
        });
        router.push('/miembros/dashboard');
      }
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al iniciar sesión',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            instagram: instagram,
          },
        },
      });

      if (authError) {
        toast.error('Error al registrarse', {
          description: authError.message,
        });
        return;
      }

      if (authData.user) {
        // Crear perfil de miembro
        const { error: profileError } = await supabase
          .from('members')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone: phone || null,
            instagram: instagram || null,
            membership_type: 'regular',
            membership_status: 'active',
          });

        if (profileError) {
          // Si el perfil ya existe o hay otro error, intentamos continuar
          // El perfil se puede crear después desde el dashboard
          toast.warning('Cuenta creada, pero hubo un problema al crear el perfil', {
            description: 'Serás redirigido al dashboard donde podrás completar tu perfil',
          });
        } else {
          toast.success('¡Registro exitoso!', {
            description: 'Tu cuenta ha sido creada correctamente',
          });
        }

        // Auto-login después del registro
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginData.user) {
          router.push('/miembros/dashboard');
        }
      }
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al registrarse',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border p-8 rounded-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground/10 rounded-full mb-4">
              <User className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="font-display text-3xl text-foreground mb-2">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin 
                ? 'Accede a tu cuenta de miembro' 
                : 'Únete a RUNNING ERA Club'}
            </p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    placeholder="Juan Pérez"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

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
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono (Opcional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    placeholder="+52 222 123 4567"
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-foreground mb-2">
                    Instagram (Opcional)
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remover @ si el usuario lo agrega manualmente
                        if (value.startsWith('@')) {
                          value = value.substring(1);
                        }
                        setInstagram(value);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="@tuusuario"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo el nombre de usuario (sin @)
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Cargando...'
              ) : (
                <>
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setFullName('');
                setPhone('');
                setInstagram('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin 
                ? '¿No tienes cuenta? Crear una aquí' 
                : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

