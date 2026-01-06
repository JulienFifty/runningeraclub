"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
const communityImage = 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661563/_VXV9510-Enhanced-NR_qhsic0.jpg';

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
      <div className="container-premium px-4 md:px-20">
        <motion.div 
          className="relative h-[40vh] md:h-[45vh] flex items-center overflow-hidden border border-black/20"
          style={{ opacity, y, scale }}
        >
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={communityImage}
              alt="Comunidad RUNNING ERA"
              className="w-full h-full object-cover"
              style={{
                objectPosition: 'center bottom',
                transform: 'scale(1.4)',
                width: '100%',
                height: '100%',
              }}
              loading="lazy"
            />
            <motion.div className="absolute inset-0 bg-black/50 border border-gray-300/20" />
          </div>

          {/* Content */}
          <div className="relative px-8 md:px-16 py-12 md:py-16">
            <div className="max-w-lg">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block text-white/50 text-xs italic mb-3"
              >
                Wellness Community
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-xl md:text-2xl lg:text-3xl text-white/90 font-bold tracking-wide uppercase leading-tight mb-3"
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
                className="text-white/60 text-xs md:text-sm font-light leading-relaxed mb-5"
              >
                Más que un club de running, somos una{' '}
                <span className="italic text-white/70">tribu que transforma vidas</span>.
                {' '}Cada kilómetro compartido construye amistades reales, 
                cada entrenamiento nos acerca más a nuestra mejor versión.
              </motion.p>

              <motion.a
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                href="#comunidad"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/90 text-black text-[10px] font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white hover:gap-3"
              >
                Explora la Comunidad
                <ArrowRight className="w-2.5 h-2.5" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
