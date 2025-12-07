import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, MapPin, Instagram } from 'lucide-react';

const navLinks = [
  { name: 'Inicio', href: '#inicio' },
  { name: 'Comunidad', href: '#comunidad' },
  { name: 'Eventos', href: '#eventos' },
  { name: 'Experiencias', href: '#experiencias' },
  { name: 'Galería', href: '#galeria' },
  { name: 'Contacto', href: '#contacto' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar */}
      <div className="bg-card border-b border-border/30">
        <div className="container-premium py-2 flex items-center justify-between text-xs tracking-wider text-foreground">
          <div className="hidden md:flex items-center gap-6">
            <a href="tel:+522221234567" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Phone className="w-3 h-3" />
              <span>+52 222 123 4567</span>
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>Puebla, México</span>
            </span>
          </div>
          <div className="flex items-center gap-4 mx-auto md:mx-0">
            <a 
              href="https://instagram.com/runningera" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <span className="hidden sm:inline">Síguenos @runningera</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="container-premium py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-2">
            <span className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              RUNNING <span className="font-light italic">ERA</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors link-underline"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA + Mobile Menu */}
          <div className="flex items-center gap-4">
            <a
              href="#contacto"
              className="hidden md:inline-flex btn-premium text-xs py-3 px-6"
            >
              Únete al Club
            </a>
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
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-medium tracking-wider text-foreground hover:text-muted-foreground transition-colors py-2"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setIsMenuOpen(false)}
                className="btn-premium mt-4 text-center"
              >
                Únete al Club
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
