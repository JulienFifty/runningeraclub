"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Dumbbell, Calendar, Gift, Handshake, ShoppingBag, Users, Image as ImageIcon, ArrowRight } from 'lucide-react';
const heroImage = '/assets/hero-runners.jpg';
const logoRunningEra = '/assets/logo-running-era.png';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [itemPositions, setItemPositions] = useState<Array<{ left: number; width: number }>>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.3, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const updatePositions = () => {
      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll('[data-category-item]');
        const positions = Array.from(items).map((item) => {
          const rect = item.getBoundingClientRect();
          const gridRect = gridRef.current!.getBoundingClientRect();
          return {
            left: rect.left - gridRect.left + rect.width / 2,
            width: rect.width
          };
        });
        setItemPositions(positions);
      }
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, []);

  return (
    <section ref={heroRef} id="inicio" className="relative h-screen flex flex-col overflow-hidden">
      {/* Hero Image with Zoom Effect */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ 
          opacity,
          scale,
          y
        }}
        transition={{ 
          duration: 1.5, 
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: { duration: 1.2 }
        }}
      >
        <motion.img
          src={heroImage}
          alt="Corredores de RUNNING ERA al amanecer"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.4, filter: "blur(10px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 2,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
        <motion.div 
          className="absolute inset-0 bg-black/60"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
      </motion.div>

      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />

      {/* Content */}
      <div className="relative flex-1 flex items-center pt-16 pb-8">
        <div className="container-premium">
          <div className="max-w-3xl">
            {/* Logo with dramatic entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative"
            >
              <motion.img
                src={logoRunningEra}
                alt="RUNNING ERA Logo"
                className="w-16 md:w-20 mb-4"
                whileHover={{ 
                  scale: 1.15, 
                  rotate: 3,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 20,
                    duration: 0.3
                  }
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20,
                  duration: 0.3
                }}
              />
            </motion.div>

            {/* Subtitle with slide and fade */}
            <motion.span
              initial={{ opacity: 0, x: -50, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-block text-white/80 text-xs tracking-[0.3em] uppercase mb-4"
            >
              Club de Running Premium • Puebla
            </motion.span>

            {/* Main Title with powerful reveal */}
            <motion.h1
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1,
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-light leading-[0.95] mb-4"
            >
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="block"
              >
                Running Era Club
              </motion.span>
            </motion.h1>

            {/* Description with fade and slide */}
            <motion.p
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ 
                duration: 1,
                delay: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="text-white/90 text-base md:text-lg font-light leading-relaxed max-w-xl mb-6"
            >
              Comunidad, estilo de vida y experiencias deportivas exclusivas en Puebla.
              Únete a la comunidad de corredores más vibrante de México.
            </motion.p>

            {/* Buttons with stagger effect */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                delay: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.a
                href="#contacto"
                className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white text-black text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-4"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                Unirme al Club
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#eventos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/50 text-white text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/10 hover:border-white"
                whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.8)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                Próximo Evento
              </motion.a>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Category Bar - Inside Hero */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 1,
          delay: 1.1,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="relative pb-6"
      >
        <div className="container-premium">
          {/* Scroll to Discover - Más arriba */}
          <motion.div 
            className="flex items-center gap-3 mb-12"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <motion.div 
              className="w-[2px] h-3 bg-white"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            />
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/60">
              Scroll para descubrir más
            </span>
          </motion.div>

          {/* Category Grid */}
          <div className="relative">
            {/* Línea fina continua arriba de todos los iconos */}
            <div
              className="absolute -top-8 left-0 right-0 h-[1px] bg-white/30"
            />
            
            {/* Línea gruesa que se mueve en hover - misma posición que la línea fina */}
            {itemPositions.length > 0 && (
              <motion.div
                animate={{ 
                  scaleX: hoveredIndex !== null ? 1 : 0,
                  opacity: hoveredIndex !== null ? 1 : 0,
                }}
                transition={{ 
                  scaleX: { duration: 0.1 },
                  opacity: { duration: 0.1 }
                }}
                className="absolute -top-8 h-[2px] bg-white origin-center z-10"
                style={{ 
                  width: '3rem',
                  left: hoveredIndex !== null && itemPositions[hoveredIndex]
                    ? `${itemPositions[hoveredIndex].left}px`
                    : itemPositions[0] ? `${itemPositions[0].left}px` : '0px',
                  transform: 'translateX(-50%)',
                  transition: 'left 0.15s ease-out'
                }}
              />
            )}
            
            <div 
              ref={gridRef}
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8 relative"
            >
              {categoryItems.map((item, index) => (
                <CategoryItem 
                  key={item.label} 
                  item={item} 
                  index={index}
                  isHovered={hoveredIndex === index}
                  onHoverChange={(hovered) => setHoveredIndex(hovered ? index : null)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const CategoryItem = ({ 
  item, 
  index, 
  isHovered, 
  onHoverChange 
}: { 
  item: typeof categoryItems[0]; 
  index: number;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) => {
  const Icon = item.icon;

  return (
    <motion.a
      href={item.href}
      data-category-item
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className="group flex flex-col items-center text-center relative"
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6,
        delay: 1.3 + (index * 0.1),
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -5, 
        scale: 1.05,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 20,
          duration: 0.3
        }
      }}
    >

      {/* Icon */}
      <motion.div 
        className="mb-3 flex items-center justify-center"
        animate={{ 
          rotate: isHovered ? 8 : 0,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 15
        }}
      >
        <Icon
          className={`w-7 h-7 transition-all duration-300 ${
            isHovered ? 'text-white' : 'text-white/60'
          }`}
          strokeWidth={1}
        />
      </motion.div>

      {/* Label */}
      <span
        className={`text-[9px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
          isHovered ? 'text-white' : 'text-white/60'
        }`}
      >
        {item.label}
      </span>
      {item.sublabel && (
        <span
          className={`text-[9px] tracking-[0.2em] uppercase font-medium transition-colors duration-300 ${
            isHovered ? 'text-white' : 'text-white/60'
          }`}
        >
          {item.sublabel}
        </span>
      )}
    </motion.a>
  );
};
