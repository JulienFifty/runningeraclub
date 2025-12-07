import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'María González',
    role: 'Miembro desde 2022',
    quote: 'RUNNING ERA cambió mi vida. No solo mejoré como corredora, encontré amigos que se han convertido en familia. Cada entrenamiento es una experiencia inolvidable.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Trail Runner',
    quote: 'Los eventos de trail son espectaculares. La organización, las rutas, la comunidad... todo es de primer nivel. Es el club que siempre busqué.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Ana Lucía Torres',
    role: 'Corredora Urbana',
    quote: 'Empecé como principiante y ahora he corrido mi primer maratón. Los coaches y la comunidad me dieron las herramientas y la motivación para lograrlo.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  },
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 block">
            Testimonios
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground">
            Lo que Dicen <span className="italic">Nuestros Miembros</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-card p-8 shadow-card group hover:shadow-hover transition-all duration-500"
            >
              <Quote className="w-10 h-10 text-muted-foreground/30 mb-6" />
              <p className="text-foreground font-light leading-relaxed mb-8 text-lg">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-display text-foreground font-medium">
                    {testimonial.name}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
