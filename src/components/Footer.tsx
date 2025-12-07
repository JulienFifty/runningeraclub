import { Instagram, Facebook, Twitter, Youtube, ArrowUp } from 'lucide-react';

const footerLinks = {
  'Sobre Nosotros': [
    { name: 'Nuestra Historia', href: '#comunidad' },
    { name: 'El Equipo', href: '#' },
    { name: 'Valores', href: '#' },
    { name: 'Prensa', href: '#' },
  ],
  'Comunidad': [
    { name: 'Únete al Club', href: '#contacto' },
    { name: 'Miembros', href: '#' },
    { name: 'Testimonios', href: '#' },
    { name: 'Galería', href: '#galeria' },
  ],
  'Eventos': [
    { name: 'Calendario', href: '#eventos' },
    { name: 'Night Runs', href: '#' },
    { name: 'Trail Runs', href: '#' },
    { name: 'Colaboraciones', href: '#' },
  ],
  'Entrenamientos': [
    { name: 'Horarios', href: '#experiencias' },
    { name: 'Ubicaciones', href: '#' },
    { name: 'Coaches', href: '#' },
    { name: 'Programas', href: '#' },
  ],
};

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/runningera', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container-premium py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <a href="#inicio" className="inline-block mb-6">
              <span className="font-display text-2xl font-semibold tracking-tight">
                RUNNING <span className="font-light italic">ERA</span>
              </span>
            </a>
            <p className="text-primary-foreground/70 text-sm font-light leading-relaxed mb-6 max-w-xs">
              La nueva era del running en Puebla. Comunidad, entrenamientos premium
              y experiencias deportivas exclusivas.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-medium tracking-widest uppercase mb-6">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/70 text-sm font-light hover:text-primary-foreground transition-colors link-underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-premium py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-xs tracking-wider">
            © 2024 RUNNING ERA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-primary-foreground/50 text-xs tracking-wider hover:text-primary-foreground transition-colors"
            >
              Privacidad
            </a>
            <a
              href="#"
              className="text-primary-foreground/50 text-xs tracking-wider hover:text-primary-foreground transition-colors"
            >
              Términos
            </a>
            <button
              onClick={scrollToTop}
              className="w-10 h-10 border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground hover:text-primary transition-all duration-300"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
