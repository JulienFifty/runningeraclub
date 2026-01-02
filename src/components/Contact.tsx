"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
const contactImage = '/assets/community.jpg';

export const Contact = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.5, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Mensaje enviado! Te contactaremos pronto.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contacto" ref={sectionRef} className="bg-background py-16 md:py-24 overflow-hidden">
      <div className="container-premium">
        <motion.div 
          className="relative h-[50vh] md:h-[55vh] flex items-center overflow-hidden border border-black/20"
          style={{ opacity, y, scale }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={contactImage}
              alt="Contacto RUNNING ERA"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <motion.div className="absolute inset-0 bg-black/60 border border-gray-300/20" />
          </div>

          {/* Content */}
          <div className="relative px-6 md:px-12 py-8 w-full">
            <div className="max-w-2xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block text-white/70 text-sm italic mb-4"
              >
                Contacto
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-2xl md:text-3xl lg:text-4xl text-white font-bold tracking-wide uppercase leading-tight mb-4"
              >
                ¿Listo para unirte
                <br />
                a la Era?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-white/80 text-sm md:text-base font-light leading-relaxed mb-8"
              >
                Contáctanos para conocer más sobre nuestros entrenamientos, eventos
                y cómo puedes ser parte de la comunidad de corredores más vibrante de Puebla.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors resize-none"
                    placeholder="¿Cómo podemos ayudarte?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-xs font-medium tracking-wider uppercase transition-all duration-300 hover:bg-white/90 hover:gap-3"
                >
                  <Send className="w-3 h-3" />
                  Enviar Mensaje
                </button>
              </motion.form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
