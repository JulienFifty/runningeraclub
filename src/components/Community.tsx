"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import { optimizeCloudinaryUrl } from '@/lib/image-optimizer';

const heroImage = 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661563/_VXV9510-Enhanced-NR_qhsic0.jpg';

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
    <section id="comunidad" ref={sectionRef} className="relative h-screen flex items-center overflow-hidden bg-background">
      {/* Split Layout: Image Left, Content Right */}
      <div className="w-full h-full grid lg:grid-cols-2">
        {/* Left: Full Height Image */}
        <motion.div 
          className="relative h-[40vh] lg:h-full order-2 lg:order-1"
          style={{ scale: imageScale, opacity: imageOpacity }}
        >
          <div className="absolute inset-0">
            <Image
              src={optimizeCloudinaryUrl(heroImage, {
                width: 1200,
                height: 1600,
                quality: 85,
                format: 'auto',
                crop: 'fill',
              })}
              alt="Comunidad RUNNING ERA entrenando"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent lg:from-black/70 lg:via-black/50 lg:to-transparent" />
          </div>
          
          {/* Floating stat card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute bottom-4 left-4 right-4 lg:right-auto lg:left-8 lg:bottom-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 lg:p-6 max-w-xs"
          >
            <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-1 lg:mb-2">500+</div>
            <div className="text-white/80 text-[10px] lg:text-xs tracking-[0.2em] uppercase font-light">Miembros Activos</div>
          </motion.div>
        </motion.div>

        {/* Right: Content */}
        <motion.div 
          className="flex items-center justify-center p-6 md:p-8 lg:p-12 order-1 lg:order-2 bg-background"
          style={{ y: textY }}
        >
          <div className="max-w-xl space-y-4 lg:space-y-6">
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block text-foreground/60 text-[10px] lg:text-xs tracking-[0.4em] uppercase font-light"
            >
              Nuestra Comunidad
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-foreground font-bold leading-[1.1] uppercase tracking-tight"
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
              className="text-foreground/70 text-sm md:text-base lg:text-lg font-light leading-relaxed max-w-lg"
            >
              Cada kilómetro compartido crea lazos que trascienden el deporte. 
              Somos más que corredores, somos una familia que se apoya, celebra y crece junta.
            </motion.p>

            <motion.a
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 border-2 border-foreground/20 text-foreground text-xs lg:text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:border-foreground/40 hover:bg-foreground/5 opacity-75 cursor-not-allowed"
              title="Próximamente"
            >
              Conoce Nuestra Historia
              <span className="text-[10px] lg:text-xs ml-1 opacity-70">(Próximamente)</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
