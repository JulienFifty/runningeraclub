import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Gift, Handshake, ShoppingBag, Users, Image as ImageIcon, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-runners.jpg';

const categoryItems = [
  { icon: Dumbbell, label: 'Entrenamientos', href: '#experiencias' },
  { icon: Calendar, label: 'Eventos', href: '#eventos' },
  { icon: Gift, label: 'Beneficios', href: '#experiencias' },
  { icon: Handshake, label: 'Marcas &', sublabel: 'Patrocinios', href: '#experiencias' },
  { icon: ShoppingBag, label: 'Merch', href: '#experiencias' },
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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center pt-32 pb-20">
        <div className="container-premium">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-white/80 text-sm tracking-[0.3em] uppercase mb-6"
            >
              Club de Running Premium • Puebla
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-light leading-[0.95] mb-6"
            >
              La Nueva Era
              <br />
              <span className="italic font-normal">del Running</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white/90 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-10"
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
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-4"
              >
                Unirme al Club
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#eventos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/50 text-white text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/10 hover:border-white"
              >
                Próximo Evento
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Category Bar - Four Seasons Style */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative bg-background border-t border-border/30"
      >
        <div className="container-premium py-10">
          {/* Scroll to Discover */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[2px] h-4 bg-foreground" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Scroll para descubrir más
            </span>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8">
            {categoryItems.map((item, index) => (
              <CategoryItem key={item.label} item={item} index={index} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const CategoryItem = ({ item, index }: { item: typeof categoryItems[0]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col items-center text-center relative"
    >
      {/* Hover indicator line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-foreground origin-center"
      />

      {/* Icon */}
      <div className="mb-4">
        <Icon
          className={`w-8 h-8 transition-all duration-300 ${
            isHovered ? 'text-foreground' : 'text-muted-foreground'
          }`}
          strokeWidth={1}
        />
      </div>

      {/* Label */}
      <span
        className={`text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
          isHovered ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {item.label}
      </span>
      {item.sublabel && (
        <span
          className={`text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
            isHovered ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {item.sublabel}
        </span>
      )}
    </a>
  );
};
