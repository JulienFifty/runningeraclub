"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
const heroImage = '/assets/hero-runners.jpg';

export const Community = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.2, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.7, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  return (
    <section id="comunidad" ref={sectionRef} className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
      {/* Split Layout: Image Left, Content Right */}
      <div className="w-full h-full grid lg:grid-cols-2">
        {/* Left: Full Height Image */}
        <motion.div 
          className="relative h-[50vh] lg:h-full order-2 lg:order-1"
          style={{ scale: imageScale, opacity: imageOpacity }}
        >
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Comunidad RUNNING ERA entrenando"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent lg:from-black/70 lg:via-black/50 lg:to-transparent" />
          </div>
          
          {/* Floating stat card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute bottom-8 left-8 right-8 lg:right-auto lg:left-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 max-w-xs"
          >
            <div className="text-5xl md:text-6xl font-display font-bold text-white mb-2">500+</div>
            <div className="text-white/80 text-xs tracking-[0.2em] uppercase font-light">Miembros Activos</div>
          </motion.div>
        </motion.div>

        {/* Right: Content */}
        <motion.div 
          className="flex items-center justify-center p-8 md:p-12 lg:p-16 order-1 lg:order-2 bg-background"
          style={{ y: textY }}
        >
          <div className="max-w-xl space-y-8">
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block text-foreground/60 text-xs tracking-[0.4em] uppercase font-light"
            >
              Nuestra Comunidad
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-bold leading-[1.1] uppercase tracking-tight"
            >
              Correr es solo
              <br />
              <span className="text-foreground/80">el inicio.</span>
              <br />
              <span className="text-foreground/60">Nuestra comunidad</span>
              <br />
              <span className="text-foreground/80">es lo que nos hace únicos.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-foreground/70 text-base md:text-lg font-light leading-relaxed max-w-lg"
            >
              Cada kilómetro compartido crea lazos que trascienden el deporte. 
              Somos más que corredores, somos una familia que se apoya, celebra y crece junta.
            </motion.p>

            <motion.a
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              href="#contacto"
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-foreground/20 text-foreground text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:border-foreground hover:bg-foreground hover:text-background group"
            >
              Conoce Nuestra Historia
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
