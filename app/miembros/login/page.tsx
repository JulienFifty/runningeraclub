"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Mail, ArrowRight, Instagram } from 'lucide-react';
import { toast } from 'sonner';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Manejar error de confirmación de email
    const confirmationError = searchParams?.get('error');
    if (confirmationError === 'confirmation_failed') {
      toast.error('Error al confirmar el email', {
        description: 'El enlace puede haber expirado. Intenta registrarte nuevamente.',
      });
      window.history.replaceState({}, '', '/miembros/login');
    }

    // Manejar respuestas de Strava
    const stravaError = searchParams?.get('strava_error');
    const stravaSignup = searchParams?.get('strava_signup');

    if (stravaError) {
      const errorMessages: Record<string, string> = {
        cancelled: 'Conexión con Strava cancelada',
        invalid: 'Error en la autorización de Strava',
        config: 'Error de configuración',
        token: 'Error al obtener tokens de Strava',
        signup: 'Error al crear la cuenta con Strava',
        profile: 'Error al crear el perfil',
        signin: 'Error al iniciar sesión',
        unknown: 'Error desconocido',
      };
      toast.error(errorMessages[stravaError] || 'Error con Strava');
    } else if (stravaSignup === 'success') {
      toast.success('¡Cuenta creada con Strava!');
    }
  }, [searchParams]);

  const handleStravaSignup = () => {
    // Redirigir a la API de autenticación de Strava en modo signup
    window.location.href = '/api/strava/auth?mode=signup&return_url=/miembros/dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Manejar error de email no confirmado
        if (error.message.includes('Email not confirmed')) {
          toast.error('Email no confirmado', {
            description: 'Por favor, revisa tu correo y confirma tu cuenta',
          });
          router.push(`/miembros/confirmar-email?email=${encodeURIComponent(email)}`);
          return;
        }
        
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
      // Capturar información del evento desde los query parameters si existe
      const searchParams = new URLSearchParams(window.location.search);
      const eventSlug = searchParams.get('event_slug');
      const eventTitle = searchParams.get('event_title');
      
      // Construir emailRedirectTo con contexto del evento
      let redirectUrl = `${window.location.origin}/auth/callback`;
      if (eventSlug) {
        const callbackParams = new URLSearchParams();
        callbackParams.set('event_slug', eventSlug);
        if (eventTitle) callbackParams.set('event_title', eventTitle);
        redirectUrl += `?${callbackParams.toString()}`;
      }
      
      console.log('🔍 Signup Debug:', {
        eventSlug,
        eventTitle,
        redirectUrl,
        currentUrl: window.location.href
      });

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            instagram: instagram,
          },
        },
      });

      if (authError) {
        // Detectar si el usuario ya existe pero el email no está confirmado
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered')) {
          
          // Intentar reenviar el email automáticamente
          try {
            const resendResponse = await fetch('/api/auth/resend-confirmation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            });

            if (resendResponse.ok) {
              toast.success('Cuenta existente detectada', {
                description: 'Te hemos reenviado el email de confirmación. Revisa tu correo (incluyendo spam).',
                duration: 8000,
              });
            } else {
              toast.error('Esta cuenta ya existe', {
                description: 'Si no confirmaste tu email, ve a la página de confirmación para reenviar el correo',
                duration: 6000,
              });
            }
          } catch (error) {
            toast.error('Esta cuenta ya existe', {
              description: 'Si no confirmaste tu email, ve a la página de confirmación',
              duration: 6000,
            });
          }

          // Redirigir a la página de confirmación
          setTimeout(() => {
            router.push(`/miembros/confirmar-email?email=${encodeURIComponent(email)}`);
          }, 2000);
          return;
        }
        
        toast.error('Error al registrarse', {
          description: authError.message,
        });
        return;
      }

      if (authData.user) {
        // El perfil se creará automáticamente cuando el usuario confirme su email
        // mediante un trigger en la base de datos (ver: create-member-profile-trigger.sql)
        
        // Redirigir a la página de confirmación de email
        toast.success('¡Registro exitoso!', {
          description: 'Revisa tu correo para confirmar tu cuenta',
        });
        
        router.push(`/miembros/confirmar-email?email=${encodeURIComponent(email)}`);
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

          {/* Botón de Strava - Solo para registro - PRÓXIMAMENTE */}
          {!isLogin && (
            <>
              <button
                type="button"
                disabled={true}
                className="w-full px-6 py-3 bg-[#FC4C02]/50 text-white rounded-lg transition-colors opacity-60 cursor-not-allowed flex items-center justify-center gap-3 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Próximamente - Conéctate con Strava
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">O continuar con email</span>
                </div>
              </div>
            </>
          )}

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

export default function MemberLogin() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}

