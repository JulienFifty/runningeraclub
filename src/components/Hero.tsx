import { motion } from 'framer-motion';
import { Calendar, Users, Dumbbell, Image as ImageIcon, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-runners.jpg';

const categoryItems = [
  { icon: Calendar, label: 'Eventos', href: '#eventos' },
  { icon: Dumbbell, label: 'Entrenamientos', href: '#experiencias' },
  { icon: Users, label: 'Comunidad', href: '#comunidad' },
  { icon: ImageIcon, label: 'Galería', href: '#galeria' },
];

export const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex flex-col">
      {/* Hero Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Corredores de RUNNING ERA al amanecer"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-primary/20" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center pt-32 pb-20">
        <div className="container-premium">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-primary-foreground/80 text-sm tracking-[0.3em] uppercase mb-6"
            >
              Club de Running Premium • Puebla
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-primary-foreground font-light leading-[0.95] mb-6"
            >
              La Nueva Era
              <br />
              <span className="italic font-normal">del Running</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-primary-foreground/90 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-10"
            >
              Comunidad, estilo de vida y experiencias deportivas exclusivas en Puebla.
              Únete a la comunidad de corredores más vibrante de México.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-foreground text-primary text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-primary-foreground/90 hover:gap-4"
              >
                Unirme al Club
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#eventos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary-foreground/50 text-primary-foreground text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-primary-foreground/10 hover:border-primary-foreground"
              >
                Próximo Evento
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Category Bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative bg-background"
      >
        <div className="container-premium">
          <div className="grid grid-cols-2 md:grid-cols-4 -mt-16 md:-mt-12">
            {categoryItems.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className="group bg-card hover:bg-primary transition-all duration-500 p-6 md:p-8 flex flex-col items-center justify-center gap-3 border-r border-b border-border last:border-r-0 md:last:border-r-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-500" />
                <span className="text-xs font-medium tracking-widest uppercase text-foreground group-hover:text-primary-foreground transition-colors duration-500">
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
