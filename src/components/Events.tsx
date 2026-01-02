"use client";

import { motion, useInView } from 'framer-motion';
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
}

export const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
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
        .select('id, slug, title, date, location, short_description, image, button_text')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
        // Fallback a datos estáticos si hay error
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

  const itemsPerView = 1; // En móvil muestra 1, en desktop se ajustará
  const totalPages = Math.ceil(events.length / itemsPerView);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => scrollElement.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('[data-event-card]')?.clientWidth || 0;
      const gap = 24; // gap-6 = 24px
      const scrollAmount = (cardWidth + gap) * (window.innerWidth >= 1024 ? 1 : 1);
      
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('[data-event-card]')?.clientWidth || 0;
      const gap = 24;
      const newIndex = Math.round(scrollRef.current.scrollLeft / (cardWidth + gap));
      setCurrentIndex(newIndex);
      updateScrollButtons();
    }
  };

  return (
    <section id="eventos" className="section-padding bg-background relative overflow-hidden" ref={ref}>
      {/* Background overlay similar to the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      
      <div className="container-premium relative z-10">
        {/* Header - Similar to Featured Properties */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6 uppercase">
            Eventos Mensuales
          </h2>
          
          <p className="text-white/70 text-base md:text-lg font-light max-w-2xl mx-auto mb-8">
            Descubre nuestros eventos exclusivos y únete a la comunidad de corredores más vibrante de Puebla.
          </p>

          <motion.a
            href="#contacto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 text-white/80 text-sm font-medium tracking-wider uppercase hover:text-white hover:gap-3 transition-all duration-300"
          >
            VER TODOS LOS EVENTOS
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>

        {/* Events Carousel */}
        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white p-3 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards Container */}
          {loading ? (
            <div className="text-center text-white/80 py-12">
              Cargando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-white/80 py-12">
              No hay eventos disponibles
            </div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide scroll-smooth"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {events.map((event, index) => (
              <Link
                key={event.title}
                href={`/eventos/${event.slug}`}
                className="flex-shrink-0 w-[85%] md:w-[60%] lg:w-[calc(33.333%-16px)] xl:w-[calc(33.333%-16px)] snap-start group block"
              >
                <motion.div
                  data-event-card
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative h-[500px] md:h-[550px] lg:h-[500px] overflow-hidden bg-black/40 border border-white/10 cursor-pointer"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    {/* Date Badge */}
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium tracking-wider uppercase">
                          {event.date}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-title text-3xl md:text-4xl lg:text-5xl text-white font-[500] mb-4 leading-tight">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/80 text-sm md:text-base font-light leading-relaxed mb-6 max-w-md">
                      {event.shortDescription}
                    </p>

                    {/* Location */}
                    <p className="text-white/60 text-xs tracking-widest uppercase mb-6">
                      {event.location}
                    </p>

                    {/* Button */}
                    <div className="w-full md:w-auto bg-white text-black px-8 py-4 text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 inline-block text-center">
                      {event.buttonText}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center gap-2 mt-8"
          >
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/80 text-sm font-light tracking-wider px-4">
              {currentIndex + 1} / {events.length}
            </span>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-30"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
