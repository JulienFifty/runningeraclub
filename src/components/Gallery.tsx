"use client";

import { motion } from 'framer-motion';
import { useRef } from 'react';
const heroImage = '/assets/hero-runners.jpg';
const nightRun = '/assets/night-run.jpg';
const trailRun = '/assets/trail-run.jpg';
const community = '/assets/community.jpg';
const urbanRun = '/assets/urban-run.jpg';

const galleryImages = [
  { src: heroImage, alt: 'Corredores al amanecer', span: 'col-span-2 row-span-2' },
  { src: nightRun, alt: 'Night run en la ciudad', span: 'col-span-1 row-span-1' },
  { src: trailRun, alt: 'Trail running en montaña', span: 'col-span-1 row-span-1' },
  { src: community, alt: 'Comunidad RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: urbanRun, alt: 'Entrenamiento urbano', span: 'col-span-1 row-span-1' },
];

export const Gallery = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section id="galeria" ref={sectionRef} className="bg-background py-16 md:py-24">
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
            Galería
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-2xl md:text-3xl lg:text-4xl text-white font-bold tracking-wide uppercase leading-tight"
          >
            Momentos Inolvidables
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 auto-rows-[150px] md:auto-rows-[200px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative overflow-hidden group ${image.span}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
