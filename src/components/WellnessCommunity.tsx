"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
const communityImage = '/assets/community.jpg';

export const WellnessCommunity = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.5, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

  return (
    <section ref={sectionRef} className="bg-background py-16 md:py-24 overflow-hidden">
      <div className="container-premium">
        <motion.div 
          className="relative h-[40vh] md:h-[45vh] flex items-center overflow-hidden border border-black/20"
          style={{ opacity, y, scale }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={communityImage}
              alt="Comunidad RUNNING ERA"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Content */}
          <div className="relative px-6 md:px-12 py-8">
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block text-white/70 text-sm italic mb-4"
              >
                Wellness Community
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-2xl md:text-3xl lg:text-4xl text-white font-semibold tracking-wide uppercase leading-tight mb-4"
              >
                Una Nueva Forma
                <br />
                de Conectar
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white/80 text-sm md:text-base font-light leading-relaxed mb-6"
              >
                Más que un club de running, somos una{' '}
                <span className="italic text-white">tribu que transforma vidas</span>.
                {' '}Cada kilómetro compartido construye amistades reales, 
                cada entrenamiento nos acerca más a nuestra mejor versión.
              </motion.p>

              <motion.a
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                href="#comunidad"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-xs font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-3"
              >
                Explora la Comunidad
                <ArrowRight className="w-3 h-3" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
