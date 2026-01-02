"use client";

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Moon, Mountain, Coffee, Users, Handshake, Heart } from 'lucide-react';
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

  return (
    <section id="experiencias" className="section-padding bg-background" ref={ref}>
      <div className="container-premium">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 block">
            Lo que ofrecemos
          </span>
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 uppercase">
            Experiencias <span className="italic">RUNNING ERA</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
            Descubre todas las formas en que puedes ser parte de nuestra comunidad
            y llevar tu pasión por el running al siguiente nivel.
          </p>
        </motion.div>

        {/* Experience Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group card-premium"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <exp.icon className="w-8 h-8 text-primary-foreground mb-3" />
                  <h3 className="font-display text-xl text-primary-foreground font-medium">
                    {exp.title}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground font-light leading-relaxed mb-4">
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
