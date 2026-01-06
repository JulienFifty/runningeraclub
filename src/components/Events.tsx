"use client";

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  shortDescription: string;
  image: string;
  buttonText: 'REGÍSTRATE' | 'VER EVENTO';
  price?: string;
  category?: string;
  spots_available?: number;
}

export const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
        setEvents([]);
        return;
      }

      if (data) {
        const transformedEvents = data.map(event => ({
          id: event.id,
          slug: event.slug,
          title: event.title,
          date: event.date,
          location: event.location,
          shortDescription: event.short_description,
          image: event.image,
          buttonText: event.button_text as 'REGÍSTRATE' | 'VER EVENTO',
          price: event.price || null,
          category: event.category || null,
          spots_available: event.spots_available !== undefined ? event.spots_available : null,
        }));
        setEvents(transformedEvents);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      console.error('Error fetching events:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        error: error,
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  // Auto-play
  useEffect(() => {
    if (events.length > 0) {
      const interval = setInterval(nextSlide, 6000);
      return () => clearInterval(interval);
    }
  }, [events.length]);

  return (
    <section id="eventos" className="relative section-padding overflow-hidden" ref={ref}>
      {/* Background Image con Blur - Cambia según el evento activo */}
      {events.length > 0 && events[activeIndex]?.image && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${events[activeIndex].image})`,
                filter: 'blur(20px)',
                transform: 'scale(1.1)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-transparent" />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Fallback background si no hay eventos o está cargando */}
      {(!events.length || loading) && (
        <div className="absolute inset-0 z-0 bg-black" />
      )}
      
      <div className="container-premium relative z-10">
        {/* Section Header - Siempre visible */}
        <div className="text-center mb-16 relative z-20">
          <motion.h2 
          initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6 uppercase"
        >
            Eventos Mensuales
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/70 text-base md:text-lg font-light max-w-2xl mx-auto mb-8"
          >
            Descubre nuestros eventos exclusivos y únete a la comunidad de corredores más vibrante de Puebla.
          </motion.p>

          <motion.a
            href="#contacto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 text-white/80 text-sm font-medium tracking-wider uppercase hover:text-white hover:gap-3 transition-all duration-300"
          >
            VER TODOS LOS EVENTOS
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>

        {/* Carousel Container */}
          {loading ? (
            <div className="text-center text-white/80 py-12">
              Cargando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-white/80 py-12">
              No hay eventos disponibles
            </div>
          ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-2 md:p-3 transition-all duration-300 rounded-full"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            
            <button
              onClick={nextSlide}
              className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-2 md:p-3 transition-all duration-300 rounded-full"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Cards Carousel */}
            <div className="relative h-[650px] md:h-[700px] flex items-center justify-center overflow-visible">
              {events.map((event, index) => {
                const offset = index - activeIndex;
                const isActive = index === activeIndex;
                const isVisible = Math.abs(offset) <= 2;
                
                if (!isVisible) return null;

                return (
                <motion.div
                    key={event.id}
                    initial={false}
                    animate={{
                      x: `${offset * 110}%`,
                      scale: isActive ? 1.15 : 0.85,
                      opacity: isActive ? 1 : 0.4,
                      z: isActive ? 10 : 0,
                    }}
                    transition={{ 
                      duration: 0.7, 
                      ease: [0.32, 0.72, 0, 1]
                    }}
                    className="absolute w-[85%] md:w-[380px] cursor-pointer"
                    onClick={() => setActiveIndex(index)}
                  >
                    <Link href={`/eventos/${event.slug}`}>
                      <div className="group bg-white border border-border overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                        {/* Background Image */}
                        <div className="relative h-48 md:h-56 overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                          {/* Badges Top */}
                          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                            {/* Date Badge */}
                            <div className="inline-flex items-center gap-1.5 bg-white backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                              <Calendar className="w-3.5 h-3.5 text-black" />
                              <span className="text-xs font-semibold text-black">
                                {event.date}
                              </span>
                            </div>
                            
                            {/* Price Badge */}
                            {event.price && (
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                event.price.toLowerCase() === 'gratis' || event.price === '$0'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-black text-white'
                              }`}>
                                {event.price.toLowerCase() === 'gratis' ? 'GRATIS' : event.price}
                              </div>
                            )}
                          </div>

                          {/* Category Badge Bottom Left */}
                          {event.category && (
                            <div className="absolute bottom-4 left-4">
                              <span className="inline-block bg-white backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-black uppercase tracking-wider shadow-sm">
                                {event.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          {/* Title */}
                          <h3 className="font-display text-xl md:text-2xl text-black font-bold mb-3 leading-tight group-hover:text-black/80 transition-colors">
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                            {event.shortDescription}
                          </p>

                          {/* Location & Spots */}
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                            <p className="text-muted-foreground/70 text-xs tracking-wider uppercase">
                              {event.location}
                            </p>
                            {event.spots_available !== undefined && event.spots_available !== null && (
                              <span className={`text-xs font-medium ${
                                event.spots_available > 10 
                                  ? 'text-green-600' 
                                  : event.spots_available > 0 
                                    ? 'text-orange-600' 
                                    : 'text-red-600'
                              }`}>
                                {event.spots_available > 0 
                                  ? `${event.spots_available} cupos` 
                                  : 'Agotado'
                                }
                              </span>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="w-full bg-foreground text-background px-6 py-3 text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:bg-foreground/90 text-center group-hover:gap-2 flex items-center justify-center">
                            {event.buttonText}
                            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                </motion.div>
                );
              })}
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-12">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Ir a evento ${index + 1}`}
                />
            ))}
            </div>
        </div>
        )}
      </div>
    </section>
  );
};
