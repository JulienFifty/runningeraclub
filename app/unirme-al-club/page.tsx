"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Star, 
  Handshake, 
  Zap, 
  Calendar, 
  Gift, 
  Shield,
  CheckCircle,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Instagram
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

const benefits = [
  {
    icon: Trophy,
    title: 'Entrenadores Expertos',
    description: 'Coaches certificados que te guiarán en cada paso de tu entrenamiento.',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Más de 500 miembros activos compartiendo tu pasión por el running.',
  },
  {
    icon: Star,
    title: 'Eventos Premium',
    description: 'Acceso exclusivo a las mejores carreras y eventos deportivos de México.',
  },
  {
    icon: Calendar,
    title: 'Entrenamientos Programados',
    description: 'Rutinas estructuradas adaptadas a tu nivel y objetivos personales.',
  },
  {
    icon: Gift,
    title: 'Descuentos Exclusivos',
    description: 'Beneficios especiales en marcas deportivas y eventos patrocinados.',
  },
  {
    icon: Shield,
    title: 'Seguro y Seguimiento',
    description: 'Monitoreo de tu progreso y apoyo constante en tu jornada deportiva.',
  },
];

export default function UnirmeAlClub() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    instagram: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear cuenta
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone || null,
            instagram: formData.instagram || null,
          },
          emailRedirectTo: `${window.location.origin}/cuenta-confirmada`,
        },
      });

      if (authError) {
        toast.error('Error al crear cuenta', {
          description: authError.message,
        });
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Error al crear cuenta');
        setLoading(false);
        return;
      }

      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Revisa tu email para confirmar tu cuenta.',
      });

      // Redirigir a página de confirmación
      router.push('/miembros/confirmar-email');
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-card to-black py-20 md:py-32">
        <div className="container-premium max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-5xl md:text-7xl text-foreground font-light mb-6">
              Únete a <span className="italic">RUNNING ERA</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              La nueva era del running en Puebla. Comunidad, entrenamientos premium
              y experiencias deportivas exclusivas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-card">
        <div className="container-premium max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
              Beneficios Exclusivos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre todo lo que RUNNING ERA tiene para ofrecerte
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-background border border-border rounded-lg p-6 hover:border-foreground/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-display text-xl text-foreground font-medium mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="section-padding bg-background">
        <div className="container-premium max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg"
          >
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-4">
                Crea tu Cuenta
              </h2>
              <p className="text-muted-foreground">
                Únete a nuestra comunidad y comienza tu viaje
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Nombre Completo */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="222 123 4567"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-foreground mb-2">
                    Instagram (Opcional)
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                      placeholder="@tu_usuario"
                    />
                  </div>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-4 px-6 rounded-lg font-display font-medium tracking-wider uppercase hover:bg-foreground/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/miembros/login" className="text-foreground hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

