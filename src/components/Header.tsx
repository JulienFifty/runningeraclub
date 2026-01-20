"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, LayoutDashboard, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Inicio', href: '/' },
  { name: 'Comunidad', href: '/comunidad' },
  { name: 'Eventos', href: '/eventos' },
  { name: 'Beneficios', href: '/beneficios' },
  { name: 'Marcas', href: '/marcas' },
  { name: 'Galería', href: '/galeria' },
  { name: 'Contacto', href: 'https://wa.me/522215815902', external: true },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [memberData, setMemberData] = useState<{
    full_name?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Detectar si estamos en la homepage
  const isHomepage = pathname === '/';

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // En la homepage, no mostrar header cuando está en el top (para hero full screen)
      if (isHomepage) {
        if (currentScrollY === 0) {
          setIsVisible(false);
        } 
        // Si se hace scroll hacia arriba, mostrar
        else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        } 
        // Si se hace scroll hacia abajo, ocultar
        else if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        }
      } else {
        // En otras páginas, mostrar header cuando está en el top
        if (currentScrollY === 0) {
          setIsVisible(true);
        } 
        // Si se hace scroll hacia arriba (pero no está en el top), mostrar
        else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        } 
        // Si se hace scroll hacia abajo, ocultar
        else if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        }
      }
      
      lastScrollY = currentScrollY;
    };

    // Inicializar el estado basado en la posición actual
    if (isHomepage) {
      setIsVisible(false); // En homepage, oculto por defecto
    } else {
      if (window.scrollY === 0) {
        setIsVisible(true);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomepage]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // Si hay error de auth o no hay usuario, simplemente no hacer nada
      if (authError || !user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Obtener información del miembro
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!memberError && member) {
        setMemberData(member);
      } else {
        // Si no existe en members, usar datos del auth
        setMemberData({
          email: user.email,
        });
      }
    } catch (error) {
      // Silenciar errores de auth en usuarios no autenticados
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

  return (
    <>
      <AnimatePresence>
        {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          {/* Main Header */}
          <div className="bg-background/95 backdrop-blur-md border-b border-border/30">
            <div className="container-premium py-2.5 flex items-center justify-between">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2">
                <span className="font-display text-xl md:text-2xl font-semibold tracking-tight">
                  RUNNING <span className="font-light italic">ERA</span>
                </span>
              </a>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors link-underline"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>

              {/* CTA + Mobile Menu */}
              <div className="flex items-center gap-4">
                {!loading && (
                  <>
                    {isAuthenticated ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="bg-foreground text-background text-xs">
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{getUserName()}</span>
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
                        className="hidden md:inline-flex btn-premium text-xs py-2 px-4"
                      >
                        Iniciar Sesión
                      </a>
                    )}
                  </>
                )}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 hover:bg-muted rounded-sm transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-background border-b border-border overflow-hidden"
              >
                <nav className="container-premium py-6 flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-lg font-medium tracking-wider text-foreground hover:text-muted-foreground transition-colors py-2"
                    >
                      {link.name}
                    </a>
                  ))}
                  {isAuthenticated ? (
                    <>
                      <a
                        href="/miembros/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-medium tracking-wider text-foreground hover:text-muted-foreground transition-colors py-2"
                      >
                        Dashboard
                      </a>
                      <a
                        href="/miembros/perfil"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-medium tracking-wider text-foreground hover:text-muted-foreground transition-colors py-2"
                      >
                        Mi Perfil
                      </a>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="text-lg font-medium tracking-wider text-foreground hover:text-muted-foreground transition-colors py-2 text-left"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <a
                      href="/miembros/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn-premium mt-4 text-center"
                    >
                      Iniciar Sesión
                    </a>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
      </AnimatePresence>
    </>
  );
};
