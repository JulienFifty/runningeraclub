import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import communityImage from '@/assets/community.jpg';

export const WellnessCommunity = () => {
  return (
    <section className="relative h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={communityImage}
          alt="Comunidad RUNNING ERA"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative container-premium">
        <div className="max-w-2xl">
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
            className="font-display text-3xl md:text-4xl lg:text-5xl text-white font-semibold tracking-wide uppercase leading-tight mb-6"
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
            className="text-white/80 text-base md:text-lg font-light leading-relaxed mb-8"
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
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-4"
          >
            Explora la Comunidad
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </section>
  );
};
