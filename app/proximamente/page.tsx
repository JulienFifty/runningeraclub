"use client";

import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ProximamentePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="min-h-[90vh] flex items-center justify-center py-20">
        <div className="container-premium text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-8"
            >
              <Clock className="w-12 h-12 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 uppercase tracking-tight"
            >
              Próximamente
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed mb-8 max-w-xl mx-auto"
            >
              Estamos trabajando en esta sección para brindarte la mejor experiencia. 
              Muy pronto estará disponible.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-primary/90 hover:gap-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Inicio
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}






