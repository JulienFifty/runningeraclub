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
    description: 'Coaches certificados que te guiarán en cada paso de tu evolución.',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Más de 500 miembros activos que comparten tu misma pasión.',
  },
  {
    icon: Star,
    title: 'Eventos Premium',
    description: 'Acceso exclusivo a las mejores carreras y eventos de México.',
  },
  {
    icon: Handshake,
    title: 'Marcas Líderes',
    description: 'Colaboraciones con Nike, Adidas, Lululemon y más.',
  },
  {
    icon: Zap,
    title: 'Ambiente Motivador',
    description: 'Cada entrenamiento es una experiencia que te impulsa a ser mejor.',
  },
];

export const WhyChooseUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding bg-card" ref={ref}>
      <div className="container-premium">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 block">
              Por qué elegirnos
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
              Más que un Club,
              <br />
              <span className="italic">una Familia</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-10">
              En RUNNING ERA creemos que correr es solo el inicio. Lo que realmente
              nos define es la comunidad, las experiencias compartidas y el crecimiento
              que logramos juntos.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm font-light">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden">
              <img
                src={communityImg}
                alt="Comunidad RUNNING ERA"
                className="w-full h-[600px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-8 -left-8 bg-foreground text-background p-8 shadow-premium">
              <div className="text-5xl font-display font-light mb-2">500+</div>
              <div className="text-sm tracking-widest uppercase opacity-80">Miembros Activos</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
