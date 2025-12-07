import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

const contactInfo = [
  {
    icon: Phone,
    label: 'Teléfono',
    value: '+52 222 123 4567',
    href: 'tel:+522221234567',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hola@runningera.mx',
    href: 'mailto:hola@runningera.mx',
  },
  {
    icon: MapPin,
    label: 'Ubicación',
    value: 'Puebla City, México',
    href: '#',
  },
  {
    icon: Clock,
    label: 'Horarios',
    value: 'Lun-Sáb: 6:00 - 20:00',
    href: '#',
  },
];

export const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Mensaje enviado! Te contactaremos pronto.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contacto" className="section-padding bg-muted" ref={ref}>
      <div className="container-premium">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-4 block">
              Contacto
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-6">
              ¿Listo para unirte
              <br />
              <span className="italic">a la Era?</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-10">
              Contáctanos para conocer más sobre nuestros entrenamientos, eventos
              y cómo puedes ser parte de la comunidad de corredores más vibrante de Puebla.
            </p>

            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">
                      {item.label}
                    </p>
                    <p className="text-foreground font-medium">
                      {item.value}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="bg-card p-8 md:p-10 shadow-card">
              <h3 className="font-display text-2xl text-foreground mb-8">
                Envíanos un mensaje
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-foreground transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-foreground transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border text-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                    placeholder="¿Cómo podemos ayudarte?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-premium flex items-center justify-center gap-3"
                >
                  <Send className="w-4 h-4" />
                  Enviar Mensaje
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
