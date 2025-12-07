import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import heroImage from '@/assets/hero-runners.jpg';
import nightRun from '@/assets/night-run.jpg';
import trailRun from '@/assets/trail-run.jpg';
import community from '@/assets/community.jpg';
import urbanRun from '@/assets/urban-run.jpg';

const galleryImages = [
  { src: heroImage, alt: 'Corredores al amanecer', span: 'col-span-2 row-span-2' },
  { src: nightRun, alt: 'Night run en la ciudad', span: 'col-span-1 row-span-1' },
  { src: trailRun, alt: 'Trail running en montaña', span: 'col-span-1 row-span-1' },
  { src: community, alt: 'Comunidad RUNNING ERA', span: 'col-span-1 row-span-1' },
  { src: urbanRun, alt: 'Entrenamiento urbano', span: 'col-span-1 row-span-1' },
];

export const Gallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="galeria" className="section-padding bg-background" ref={ref}>
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 block">
            Galería
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground">
            Momentos <span className="italic">Inolvidables</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative overflow-hidden group ${image.span}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
