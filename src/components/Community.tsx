"use client";

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Play } from 'lucide-react';
const heroImage = '/assets/hero-runners.jpg';

export const Community = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="comunidad" className="relative min-h-[80vh] flex items-center" ref={ref}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Comunidad RUNNING ERA entrenando"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
      </div>

      {/* Content */}
      <div className="relative container-premium py-20">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-white/60 text-sm tracking-[0.3em] uppercase mb-6 block"
          >
            Nuestra Comunidad
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-8"
          >
            Correr es solo el inicio.
            <br />
            <span className="italic">Nuestra comunidad</span>
            <br />
            es lo que nos hace únicos.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/80 text-lg font-light leading-relaxed mb-10 max-w-xl"
          >
            Cada kilómetro compartido crea lazos que trascienden el deporte. 
            Somos más que corredores, somos una familia que se apoya, celebra y crece junta.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-4"
            >
              Conoce Nuestra Historia
              <ArrowRight className="w-4 h-4" />
            </a>
            <button className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/50 text-white text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/10">
              <Play className="w-4 h-4" />
              Ver Video
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
