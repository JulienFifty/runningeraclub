import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import nightRun from '@/assets/night-run.jpg';
import trailRun from '@/assets/trail-run.jpg';
import urbanRun from '@/assets/urban-run.jpg';
import community from '@/assets/community.jpg';

const events = [
  {
    title: 'Night Run',
    date: '15 Dic 2024',
    location: 'Centro Histórico',
    description: 'Corre bajo las estrellas por las calles iluminadas de Puebla.',
    image: nightRun,
  },
  {
    title: 'Trail Pietra',
    date: '22 Dic 2024',
    location: 'Sierra de Puebla',
    description: 'Aventura en montaña con vistas espectaculares.',
    image: trailRun,
  },
  {
    title: 'FIKA Social Run',
    date: '28 Dic 2024',
    location: 'Angelópolis',
    description: 'Run + café + networking con la comunidad.',
    image: community,
  },
  {
    title: 'Lululemon Collab',
    date: '5 Ene 2025',
    location: 'Lululemon Store',
    description: 'Entrenamiento exclusivo con la marca premium.',
    image: urbanRun,
  },
];

export const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="eventos" className="section-padding bg-primary text-primary-foreground" ref={ref}>
      <div className="container-premium">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-primary-foreground/60 text-sm tracking-[0.3em] uppercase mb-4 block">
              Próximos Eventos
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-light">
              Nuestros <span className="italic">Eventos</span>
            </h2>
          </div>
          <a
            href="#contacto"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 text-sm font-medium tracking-wider uppercase text-primary-foreground/80 hover:text-primary-foreground hover:gap-3 transition-all duration-300"
          >
            Ver Calendario Completo
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Events Slider */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex-shrink-0 w-[85%] md:w-[45%] lg:w-[30%] snap-start group"
            >
              <div className="relative h-80 overflow-hidden mb-6">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent opacity-60" />
                <div className="absolute top-4 left-4 bg-primary-foreground text-primary px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
                    <Calendar className="w-3 h-3" />
                    {event.date}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs tracking-widest uppercase mb-2">
                  {event.location}
                </p>
                <h3 className="font-display text-2xl text-primary-foreground mb-3">
                  {event.title}
                </h3>
                <p className="text-primary-foreground/80 font-light text-sm leading-relaxed mb-4">
                  {event.description}
                </p>
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-primary-foreground hover:gap-3 transition-all duration-300"
                >
                  Reservar Lugar
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
