"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Dumbbell, Calendar, Gift, Handshake, ShoppingBag, Users, Image as ImageIcon, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, Trophy, LogOut } from 'lucide-react';
const heroImage = '/assets/hero-runners.jpg';
// CDN Cloudinary - Video optimizado con transformaciones automáticas
// MP4 con optimización automática
const heroVideoMP4 = 'https://res.cloudinary.com/dhqq37qlu/video/upload/f_auto,q_auto:low,w_1920/v1767493735/Creaci%C3%B3n_de_Video_Din%C3%A1mico_para_Social_Club_lqyunz.mp4';
// WebM para mejor compresión (navegadores modernos)
const heroVideoWebM = 'https://res.cloudinary.com/dhqq37qlu/video/upload/f_webm,q_auto:low,w_1920/v1767493735/Creaci%C3%B3n_de_Video_Din%C3%A1mico_para_Social_Club_lqyunz.mp4';
const logoRunningEra = '/assets/logo-running-era.png';

const categoryItems = [
  { icon: Dumbbell, label: 'Entrenamientos', href: '/entrenamientos' },
  { icon: Calendar, label: 'Eventos', href: '#eventos' },
  { icon: Gift, label: 'Beneficios', href: '/beneficios' },
  { icon: Handshake, label: 'Marcas &', sublabel: 'Patrocinios', href: '/marcas' },
  { icon: ShoppingBag, label: 'Tienda', href: '/tienda' },
  { icon: Users, label: 'Comunidad', href: '/comunidad' },
];

export const Hero = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [itemPositions, setItemPositions] = useState<Array<{ left: number; width: number }>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberData, setMemberData] = useState<{
    full_name?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (!memberError && member) {
        setMemberData(member);
      } else {
        setMemberData({
          email: user.email,
        });
      }
    } catch (error) {
      setIsAuthenticated(false);
      setMemberData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setMemberData(null);
    router.push('/');
    router.refresh();
  };

  const getInitials = () => {
    if (memberData?.full_name) {
      const names = memberData.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return memberData.full_name[0].toUpperCase();
    }
    if (memberData?.email) {
      return memberData.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (memberData?.full_name) {
      return memberData.full_name;
    }
    if (memberData?.email) {
      return memberData.email.split('@')[0];
    }
    return 'Usuario';
  };
  
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
        const gridRect = gridRef.current.getBoundingClientRect();
        const positions = Array.from(items).map((item) => {
          // Usar el ancho del bloque completo (el <a>)
          const itemRect = item.getBoundingClientRect();
          return {
            left: itemRect.left - gridRect.left + itemRect.width / 2,
            width: itemRect.width
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
      {/* Hero Video/Image with Zoom Effect */}
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
        <motion.video
          poster={heroImage}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          initial={{ scale: 1.4, filter: "blur(10px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 2,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {/* WebM - Mejor compresión, carga más rápida */}
          <source src={heroVideoWebM} type="video/webm" />
          {/* MP4 - Fallback para compatibilidad */}
          <source src={heroVideoMP4} type="video/mp4" />
          {/* Fallback a imagen si el video no carga */}
          <img
            src={heroImage}
            alt="Corredores de RUNNING ERA"
            className="w-full h-full object-cover"
          />
        </motion.video>
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

      {/* Minimalist Links - Top Right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute top-4 right-4 md:top-6 md:right-8 z-10 flex items-center gap-3 md:gap-4"
      >
        <a
          href="#eventos"
          className="text-xs tracking-wider uppercase text-white/80 hover:text-white transition-colors hidden sm:inline"
        >
          TODOS LOS EVENTOS
        </a>
        {!loading && (
          <>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Avatar className="w-full h-full">
                      <AvatarFallback className="bg-white/20 text-white text-[10px] md:text-xs border-0">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{getUserName()}</p>
                      {memberData?.email && (
                        <p className="text-xs text-muted-foreground">{memberData.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/miembros/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/leaderboard')}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/miembros/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a
                href="/miembros/login"
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                title="Iniciar Sesión"
              >
                <User className="w-4 h-4 text-white" />
              </a>
            )}
          </>
        )}
      </motion.div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-8 md:pt-12 pb-8">
        <div className="container-premium w-full">
          <div className="max-w-3xl mt-8 md:mt-12 mx-auto text-center">
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
              className="relative flex justify-center"
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
              Social Running Club
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
              className="font-title text-4xl md:text-6xl lg:text-7xl text-white font-bold leading-[0.95] mb-4 uppercase tracking-tight"
            >
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="block font-title text-4xl md:text-6xl lg:text-7xl text-white font-[700] leading-[0.95] uppercase tracking-tight"
              >
                Running Era Club
              </motion.span>
            </motion.h1>

            {/* Buttons with stagger effect */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8,
                delay: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12 justify-center items-center"
            >
              <motion.a
                href="/unirme-al-club"
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

          {/* Category Bar - Inside Hero, right after content */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1,
              delay: 1.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="relative pb-6 mt-20 md:mt-32"
          >
            {/* Category Grid */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-5xl mx-auto">
                {/* Línea fina continua arriba de todos los iconos */}
                <div
                  className="absolute -top-8 left-0 right-0 h-[1px] bg-white/30"
                />
                
                {/* Línea gruesa que se mueve en hover - ancho del icono */}
                {itemPositions.length > 0 && hoveredIndex !== null && itemPositions[hoveredIndex] && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="absolute -top-8 h-[2px] bg-white z-10"
                    style={{ 
                      width: `${itemPositions[hoveredIndex].width}px`,
                      left: `${itemPositions[hoveredIndex].left}px`,
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
                
                <div 
                  ref={gridRef}
                  className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8 relative justify-items-center w-full"
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

            {/* Scroll to Discover - Debajo del menú */}
            <motion.div 
              className="flex items-center gap-3 mt-8 md:mt-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
            >
              <motion.div 
                className="w-[2px] h-3 bg-white"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              />
              <span className="text-[9px] tracking-[0.3em] uppercase text-white/60">
                Scroll para descubrir más
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
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
        data-category-icon
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
          className="w-7 h-7 text-white transition-all duration-300"
          strokeWidth={1}
        />
      </motion.div>

      {/* Label */}
      <span
        className="text-[9px] tracking-[0.2em] uppercase font-medium text-white transition-colors duration-300"
      >
        {item.label}
      </span>
      {item.sublabel && (
        <span
          className="text-[9px] tracking-[0.2em] uppercase font-medium text-white transition-colors duration-300"
        >
          {item.sublabel}
        </span>
      )}
    </motion.a>
  );
};
