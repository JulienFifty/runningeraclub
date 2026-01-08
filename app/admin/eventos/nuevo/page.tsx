"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface EventFormData {
  slug: string;
  title: string;
  date: string;
  location: string;
  description: string;
  short_description: string;
  image: string;
  button_text: 'REGÍSTRATE' | 'VER EVENTO';
  category: string;
  duration?: string;
  distance?: string;
  difficulty?: string[]; // Array de niveles permitidos
  price?: string;
  max_participants?: number;
  requirements: string[];
  schedule: Array<{ time: string; activity: string }>;
  highlights: string[];
  contact_info: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
}

export default function NewEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const supabase = createClient();
  const [formData, setFormData] = useState<EventFormData>({
    slug: '',
    title: '',
    date: '',
    location: '',
    description: '',
    short_description: '',
    image: '',
    button_text: 'REGÍSTRATE',
    category: '',
    duration: '',
    distance: '',
    difficulty: [],
    price: '',
    max_participants: undefined,
    requirements: [''],
    schedule: [{ time: '', activity: '' }],
    highlights: [''],
    contact_info: {
      email: '',
      phone: '',
      whatsapp: '',
    },
  });

  useEffect(() => {
    checkAdminAuth();
  }, [router]);

  const checkAdminAuth = async () => {
    try {
      // 1. Verificar autenticación de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);

      // 2. Verificar que es admin en la tabla admins
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        toast.error('Acceso denegado. No tienes permisos de administrador.');
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin auth:', error);
      router.push('/admin/login');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        schedule: formData.schedule.filter(s => s.time && s.activity),
        highlights: formData.highlights.filter(h => h.trim() !== ''),
        difficulty: formData.difficulty && formData.difficulty.length > 0 ? formData.difficulty : null,
        max_participants: formData.max_participants || null,
        duration: formData.duration || null,
        distance: formData.distance || null,
        price: formData.price || null,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Mostrar animación de éxito
        setShowSuccess(true);
        toast.success('¡Evento creado exitosamente!', {
          description: 'El evento ha sido guardado correctamente',
          icon: '✅',
          duration: 2000,
        });
        
        // Redirigir después de la animación
        setTimeout(() => {
          router.push('/admin/eventos');
        }, 1500);
      } else {
        const error = await response.json();
        toast.error('Error al crear evento', {
          description: error.error || 'Hubo un problema al guardar el evento',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear evento', {
        description: 'Hubo un problema al guardar el evento. Por favor intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verificando autenticación...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8 relative">
      {/* Animación de éxito */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-card border border-border rounded-lg p-8 text-center max-w-md mx-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <h3 className="font-sans text-2xl text-foreground mb-2">
                ¡Evento Creado!
              </h3>
              <p className="text-muted-foreground mb-4">
                El evento ha sido guardado exitosamente
              </p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="inline-block"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="container-premium max-w-4xl">
        <Link
          href="/admin/eventos"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a eventos
        </Link>

        <h1 className="font-sans text-4xl md:text-5xl text-foreground font-light mb-8">
          Nuevo Evento
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-6">
            <h2 className="font-sans text-2xl text-foreground mb-4">Información Básica</h2>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fecha *
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  placeholder="Selecciona una fecha"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Categoría *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Carrera Urbana, Trail Running, etc."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción Corta *
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción Completa *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Imagen del Evento *
              </label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Texto del Botón *
              </label>
              <select
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value as 'REGÍSTRATE' | 'VER EVENTO' })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="REGÍSTRATE">REGÍSTRATE</option>
                <option value="VER EVENTO">VER EVENTO</option>
              </select>
            </div>
          </div>

          {/* Detalles Adicionales */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-6">
            <h2 className="font-sans text-2xl text-foreground mb-4">Detalles Adicionales</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duración
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="1.5 horas"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Distancia
                </label>
                <input
                  type="text"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="5K - 10K"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Niveles
                </label>
                <div className="space-y-2">
                  {['Principiante', 'Intermedio', 'Avanzado'].map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.difficulty?.includes(level) || false}
                        onChange={(e) => {
                          const currentLevels = formData.difficulty || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              difficulty: [...currentLevels, level],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              difficulty: currentLevels.filter((l) => l !== level),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-border text-foreground focus:ring-2 focus:ring-foreground"
                      />
                      <span className="text-foreground">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Precio
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Gratis para miembros"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cupo Máximo
                </label>
                <input
                  type="number"
                  value={formData.max_participants || ''}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h2 className="font-sans text-2xl text-foreground mb-4">Requisitos</h2>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...formData.requirements];
                    newReqs[index] = e.target.value;
                    setFormData({ ...formData, requirements: newReqs });
                  }}
                  placeholder="Requisito"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newReqs = formData.requirements.filter((_, i) => i !== index);
                      setFormData({ ...formData, requirements: newReqs });
                    }}
                    className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, requirements: [...formData.requirements, ''] })}
              className="text-sm text-foreground hover:text-muted-foreground"
            >
              + Agregar requisito
            </button>
          </div>

          {/* Programa */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h2 className="font-sans text-2xl text-foreground mb-4">Programa</h2>
            {formData.schedule.map((item, index) => (
              <div key={index} className="grid md:grid-cols-3 gap-2">
                <input
                  type="time"
                  value={item.time}
                  onChange={(e) => {
                    const newSchedule = [...formData.schedule];
                    newSchedule[index].time = e.target.value;
                    setFormData({ ...formData, schedule: newSchedule });
                  }}
                  className="px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
                <input
                  type="text"
                  value={item.activity}
                  onChange={(e) => {
                    const newSchedule = [...formData.schedule];
                    newSchedule[index].activity = e.target.value;
                    setFormData({ ...formData, schedule: newSchedule });
                  }}
                  placeholder="Actividad"
                  className="md:col-span-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
                {formData.schedule.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newSchedule = formData.schedule.filter((_, i) => i !== index);
                      setFormData({ ...formData, schedule: newSchedule });
                    }}
                    className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, schedule: [...formData.schedule, { time: '', activity: '' }] })}
              className="text-sm text-foreground hover:text-muted-foreground"
            >
              + Agregar actividad
            </button>
          </div>

          {/* Highlights */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h2 className="font-sans text-2xl text-foreground mb-4">Lo que Incluye</h2>
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => {
                    const newHighlights = [...formData.highlights];
                    newHighlights[index] = e.target.value;
                    setFormData({ ...formData, highlights: newHighlights });
                  }}
                  placeholder="Highlight"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
                {formData.highlights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newHighlights = formData.highlights.filter((_, i) => i !== index);
                      setFormData({ ...formData, highlights: newHighlights });
                    }}
                    className="px-4 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, highlights: [...formData.highlights, ''] })}
              className="text-sm text-foreground hover:text-muted-foreground"
            >
              + Agregar highlight
            </button>
          </div>

          {/* Contacto */}
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h2 className="font-sans text-2xl text-foreground mb-4">Información de Contacto</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.contact_info.email || ''}
                onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, email: e.target.value } })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.contact_info.phone || ''}
                  onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, phone: e.target.value } })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.contact_info.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, whatsapp: e.target.value } })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
            <Link
              href="/admin/eventos"
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

