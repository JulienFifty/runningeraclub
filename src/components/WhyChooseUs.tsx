"use client";

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Trophy, Users, Star, Handshake, Zap } from 'lucide-react';
const communityImg = '/assets/community.jpg';

const benefits = [
  {
    icon: Trophy,
    title: 'Entrenadores Expertos',
    description: 'Coaches certificados que te guiarán en cada paso.',
    number: '01',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Más de 500 miembros activos compartiendo tu pasión.',
    number: '02',
  },
  {
    icon: Star,
    title: 'Eventos Premium',
    description: 'Acceso exclusivo a las mejores carreras de México.',
    number: '03',
  },
  {
    icon: Handshake,
    title: 'Marcas Líderes',
    description: 'Colaboraciones con Nike, Adidas, Lululemon y más.',
    number: '04',
  },
  {
    icon: Zap,
    title: 'Ambiente Motivador',
    description: 'Cada entrenamiento te impulsa a ser mejor.',
    number: '05',
  },
];

export const WhyChooseUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section-padding bg-card relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-card to-black opacity-50" />
      
      <div className="container-premium relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block text-foreground/60 text-xs tracking-[0.4em] uppercase font-light"
            >
              Por qué elegirnos
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground font-bold leading-[1.1] uppercase tracking-tight"
            >
              Más que un Club,
              <br />
              <span className="text-foreground/80">una Familia</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-foreground/70 text-base md:text-lg font-light leading-relaxed max-w-lg"
            >
              En RUNNING ERA creemos que correr es solo el inicio. Lo que realmente
              nos define es la comunidad, las experiencias compartidas y el crecimiento
              que logramos juntos.
            </motion.p>
          </motion.div>

          {/* Right: Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="group relative"
              >
                <div className="flex items-start gap-6 p-6 border border-foreground/10 hover:border-foreground/30 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:bg-card/80">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center border border-foreground/20 bg-foreground/5 group-hover:bg-foreground/10 transition-all duration-500">
                    <span className="text-foreground/40 font-display text-xl font-bold group-hover:text-foreground/60 transition-colors">
                      {benefit.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <benefit.icon className="w-5 h-5 text-foreground/60 group-hover:text-foreground transition-colors" />
                      <h3 className="font-display text-lg md:text-xl text-foreground font-bold">
                        {benefit.title}
                      </h3>
                    </div>
                    <p className="text-foreground/60 text-sm font-light leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
