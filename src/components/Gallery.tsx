"use client";

import { motion } from 'framer-motion';
import { useRef } from 'react';

const galleryImages = [
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661557/_VXV9636_fogsaj.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-2 row-span-2' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661552/_VXV8999_eaxz2q.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661563/_VXV9510-Enhanced-NR_qhsic0.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661540/L1520021_ehg2da.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661534/_VXV9755_pmsbcw.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661535/_VXV9830_vz1kqh.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661533/_VXV9754_kzjobb.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661536/BLANCA-NIETO-blancaanj_q7buwy.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661532/_VXV9490_fpqmv4.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661530/_VXV9402_m6ah2y.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: 'https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661528/_VXV8993_adgaf4.jpg', alt: 'Momentos RUNNING ERA', span: 'col-span-1 row-span-1' },
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
