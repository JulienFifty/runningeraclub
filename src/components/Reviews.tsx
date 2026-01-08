"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { Star, MessageSquare, Send, User, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface Review {
  id: string;
  full_name: string;
  rating: number;
  comment: string;
  created_at: string;
  member_id?: string;
}

export const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    full_name: '',
  });
  const supabase = createClient();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    checkAuth();
    fetchReviews();
    // Refrescar cada 10 segundos para ver nuevas reseñas
    const interval = setInterval(fetchReviews, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        
        // Obtener nombre del miembro
        const { data: member } = await supabase
          .from('members')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (member?.full_name) {
          setMemberName(member.full_name);
          setFormData(prev => ({ ...prev, full_name: member.full_name }));
        } else {
          setFormData(prev => ({ ...prev, full_name: user.email?.split('@')[0] || '' }));
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) {
        throw new Error('Error al cargar reseñas');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Por favor escribe un comentario');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: formData.rating,
          comment: formData.comment.trim(),
          full_name: formData.full_name || memberName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reseña');
      }

      toast.success('¡Reseña publicada!');
      
      // Limpiar formulario
      setFormData({
        rating: 5,
        comment: '',
        full_name: formData.full_name,
      });
      setShowForm(false);

      // Recargar reseñas para mostrar la nueva
      fetchReviews();
    } catch (error: any) {
      toast.error('Error al publicar reseña', {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-none text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <section ref={sectionRef} id="reseñas" className="section-padding bg-card relative overflow-hidden">
      <div className="container-premium relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block text-foreground/60 text-xs tracking-[0.4em] uppercase font-light mb-4"
          >
            Reseñas
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground font-light mb-6"
          >
            Lo que Dicen Nuestros Miembros
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Comparte tu experiencia y ayuda a otros a conocer RUNNING ERA
          </motion.p>
        </motion.div>

        {/* Formulario de Reseña */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          {!showForm ? (
            <div className="text-center">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all duration-300 font-display font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Dejar una Reseña
                </button>
              ) : (
                <Link
                  href="/miembros/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all duration-300 font-display font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  Inicia Sesión para Dejar una Reseña
                </Link>
              )}
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="bg-background border border-border rounded-lg p-6 md:p-8 max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Calificación
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-none text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                    Tu Reseña *
                  </label>
                  <textarea
                    id="comment"
                    required
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Comparte tu experiencia con RUNNING ERA..."
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all duration-300 font-display font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Publicar Reseña
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        rating: 5,
                        comment: '',
                        full_name: formData.full_name,
                      });
                    }}
                    className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Lista de Reseñas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-background border border-border p-6 md:p-8 rounded-lg hover:border-foreground/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-4">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-foreground/80 font-light leading-relaxed mb-6 text-sm md:text-base">
                    "{review.comment}"
                  </p>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-display text-foreground font-semibold text-sm md:text-base">
                        {review.full_name}
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {new Date(review.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

