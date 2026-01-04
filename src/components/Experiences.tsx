"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Moon, Mountain, Coffee, Users, Handshake, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
const urbanRun = '/assets/urban-run.jpg';
const trailRun = '/assets/trail-run.jpg';
const nightRun = '/assets/night-run.jpg';
const community = '/assets/community.jpg';

const experiences = [
  {
    icon: Moon,
    title: 'Entrenamientos Urbanos',
    description: 'Recorre las calles de Puebla con entrenamientos diseñados para todos los niveles.',
    image: urbanRun,
  },
  {
    icon: Mountain,
    title: 'Trail Runs',
    description: 'Aventuras en montaña con rutas espectaculares y paisajes únicos.',
    image: trailRun,
  },
  {
    icon: Coffee,
    title: 'After Runs & Eventos',
    description: 'Socializa con la comunidad después de cada entrenamiento en nuestros eventos exclusivos.',
    image: nightRun,
  },
  {
    icon: Users,
    title: 'Comunidad & Networking',
    description: 'Conecta con corredores apasionados y crea lazos que van más allá del running.',
    image: community,
  },
  {
    icon: Handshake,
    title: 'Colaboraciones',
    description: 'Acceso exclusivo a eventos con las mejores marcas deportivas del mundo.',
    image: nightRun,
  },
  {
    icon: Heart,
    title: 'Wellness & Recuperación',
    description: 'Sesiones de yoga, stretching y técnicas de recuperación para optimizar tu rendimiento.',
    image: community,
  },
];

export const Experiences = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(2); // Empezamos con el tercer elemento al centro

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % experiences.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + experiences.length) % experiences.length);
  };

  // Auto-play opcional
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="experiencias" className="relative section-padding overflow-hidden" ref={ref}>
      {/* Background Image con Blur - Cambia según el elemento activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 -z-10"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${experiences[activeIndex].image})`,
              filter: 'blur(40px)',
              transform: 'scale(1.1)'
            }}
          />
          <div className="absolute inset-0 bg-black/70" />
        </motion.div>
      </AnimatePresence>

      <div className="container-premium">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-white/70 text-sm tracking-[0.3em] uppercase mb-4 block">
            Lo que ofrecemos
          </span>
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 uppercase">
            Experiencias <span className="italic">RUNNING ERA</span>
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto font-light">
            Descubre todas las formas en que puedes ser parte de nuestra comunidad
            y llevar tu pasión por el running al siguiente nivel.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-3 transition-all duration-300 hidden lg:block"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-3 transition-all duration-300 hidden lg:block"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Cards Carousel */}
          <div className="relative h-[600px] md:h-[650px] flex items-center justify-center overflow-visible">
            {experiences.map((exp, index) => {
              // Calcular la posición relativa al elemento activo
              const offset = index - activeIndex;
              const isActive = index === activeIndex;
              
              // Determinar si la card está visible en el viewport
              const isVisible = Math.abs(offset) <= 2;
              
              if (!isVisible) return null;

              return (
                <motion.div
                  key={exp.title}
                  initial={false}
                  animate={{
                    x: `${offset * 110}%`,
                    scale: isActive ? 1.1 : 0.85,
                    opacity: isActive ? 1 : 0.5,
                    z: isActive ? 10 : 0,
                  }}
                  transition={{ 
                    duration: 0.7, 
                    ease: [0.32, 0.72, 0, 1]
                  }}
                  className="absolute w-[85%] md:w-[400px] cursor-pointer"
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="group bg-white overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500">
                    <div className="relative h-64 md:h-80 overflow-hidden">
                      <img
                        src={exp.image}
                        alt={exp.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <exp.icon className="w-8 h-8 md:w-10 md:h-10 text-white mb-3" />
                        <h3 className="font-display text-xl md:text-2xl text-white font-medium uppercase tracking-wide">
                          {exp.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 bg-white">
                      <p className="text-muted-foreground font-light leading-relaxed mb-6 text-sm md:text-base">
                        {exp.description}
                      </p>
                      <a
                        href="#contacto"
                        className="inline-flex items-center gap-2 text-sm font-medium tracking-wider uppercase text-foreground hover:gap-3 transition-all duration-300"
                      >
                        Más Información
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-12">
            {experiences.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir a experiencia ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
