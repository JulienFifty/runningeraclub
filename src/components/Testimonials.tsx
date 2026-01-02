"use client";

import { motion } from 'framer-motion';
import { useRef } from 'react';

const testimonials = [
  {
    name: 'María González',
    role: 'Miembro desde 2022',
    quote: 'RUNNING ERA cambió mi vida. No solo mejoré como corredora, encontré amigos que se han convertido en familia. Cada entrenamiento es una experiencia inolvidable.',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Trail Runner',
    quote: 'Los eventos de trail son espectaculares. La organización, las rutas, la comunidad... todo es de primer nivel. Es el club que siempre busqué.',
  },
  {
    name: 'Ana Lucía Torres',
    role: 'Corredora Urbana',
    quote: 'Empecé como principiante y ahora he corrido mi primer maratón. Los coaches y la comunidad me dieron las herramientas y la motivación para lograrlo.',
  },
];

export const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="bg-background py-16 md:py-24">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block text-white/70 text-sm italic mb-4"
          >
            Testimonios
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-2xl md:text-3xl lg:text-4xl text-white font-bold tracking-wide uppercase leading-tight"
          >
            Lo que Dicen Nuestros Miembros
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="border border-white/10 p-6 md:p-8 bg-black/20 backdrop-blur-sm"
            >
              <p className="text-white/80 font-light leading-relaxed mb-6 text-sm md:text-base">
                "{testimonial.quote}"
              </p>
              <div>
                <h4 className="font-display text-white font-bold text-sm md:text-base mb-1">
                  {testimonial.name}
                </h4>
                <p className="text-white/60 text-xs">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
