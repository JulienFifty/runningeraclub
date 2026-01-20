"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Mail, ArrowRight, Instagram, Phone, Trophy, Users, Calendar, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const benefits = [
  { icon: Trophy, text: 'Entrenadores Expertos' },
  { icon: Users, text: 'Comunidad Activa' },
  { icon: Calendar, text: 'Eventos Premium' },
  { icon: Zap, text: 'Ambiente Motivador' },
];

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

    // Detectar si se debe mostrar el formulario de registro
    const signupParam = searchParams?.get('signup');
    if (signupParam === 'true') {
      setIsLogin(false);
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

          // Redirigir a la página de confirmación con contexto del evento
          setTimeout(() => {
            const confirmUrl = new URL('/miembros/confirmar-email', window.location.origin);
            confirmUrl.searchParams.set('email', email);
            if (eventSlug) {
              confirmUrl.searchParams.set('event_slug', eventSlug);
            }
            if (eventTitle) {
              confirmUrl.searchParams.set('event_title', eventTitle);
            }
            router.push(confirmUrl.toString());
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
        
        // Redirigir a la página de confirmación de email con contexto del evento
        toast.success('¡Registro exitoso!', {
          description: 'Revisa tu correo para confirmar tu cuenta',
        });
        
        // Construir URL con parámetros del evento si existen
        const confirmUrl = new URL('/miembros/confirmar-email', window.location.origin);
        confirmUrl.searchParams.set('email', email);
        if (eventSlug) {
          confirmUrl.searchParams.set('event_slug', eventSlug);
        }
        if (eventTitle) {
          confirmUrl.searchParams.set('event_title', eventTitle);
        }
        
        router.push(confirmUrl.toString());
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
    <main className="min-h-screen bg-background flex">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link href="/" className="inline-block">
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                RUNNING <span className="font-light italic">ERA</span>
              </span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {isLogin ? 'Bienvenido de vuelta' : 'Únete al Club'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Accede a tu cuenta de miembro' 
                : 'Comienza tu viaje con RUNNING ERA'}
            </p>
          </motion.div>

          {/* Strava Button - Solo para registro */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
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
                  <span className="px-4 bg-background text-muted-foreground">O continúa con email</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-5"
          >
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
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                      placeholder="+52 222 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-foreground mb-2">
                    Instagram <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="instagram"
                      type="text"
                      value={instagram}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value.startsWith('@')) {
                          value = value.substring(1);
                        }
                        setInstagram(value);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                      placeholder="tuusuario"
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
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
          </motion.form>

          {/* Toggle Login/Signup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-center"
          >
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
                ? '¿No tienes cuenta? ' 
                : '¿Ya tienes cuenta? '}
              <span className="font-medium underline">
                {isLogin ? 'Crear una aquí' : 'Iniciar sesión'}
              </span>
            </button>
          </motion.div>

          {/* Back to home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              ← Volver al inicio
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Benefits & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661563/_VXV9510-Enhanced-NR_qhsic0.jpg"
            alt="RUNNING ERA"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Más que un Club,
              <br />
              <span className="text-white/80">una Familia</span>
            </h2>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              Únete a la comunidad de running más exclusiva de Puebla. 
              Entrenamientos premium, eventos únicos y experiencias que transforman vidas.
            </p>

            {/* Benefits List */}
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/90 text-base font-medium">{benefit.text}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-2 gap-6 pt-8 border-t border-white/20"
            >
              <div>
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-white/70 text-sm">Miembros Activos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">50+</div>
                <div className="text-white/70 text-sm">Eventos al Año</div>
              </div>
            </motion.div>
          </motion.div>
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
