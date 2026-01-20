"use client";

import { useEffect, useLayoutEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Experiences } from '@/components/Experiences';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { Events } from '@/components/Events';
import { LeaderboardsSection } from '@/components/LeaderboardsSection';
import { Community } from '@/components/Community';
import { Reviews } from '@/components/Reviews';
import { Gallery } from '@/components/Gallery';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { SEOHead } from '@/components/SEOHead';

export default function Home() {
  // Forzar tema oscuro en el home page, independientemente de la preferencia del usuario
  useLayoutEffect(() => {
    const htmlElement = document.documentElement;
    
    // Forzar clase dark inmediatamente
    htmlElement.classList.add('dark');
    
    // Observer para mantener la clase dark incluso si el ThemeProvider intenta cambiarla
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Si se removió la clase dark, volverla a agregar
          if (!htmlElement.classList.contains('dark')) {
            htmlElement.classList.add('dark');
          }
        }
      });
    });
    
    // Observar cambios en el atributo class del elemento html
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // También verificar periódicamente (por si acaso)
    const interval = setInterval(() => {
      if (!htmlElement.classList.contains('dark')) {
        htmlElement.classList.add('dark');
      }
    }, 100);
    
    // Limpiar cuando se desmonte el componente
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title="RUNNING ERA | Club de Running Premium en Puebla"
        description="RUNNING ERA es el club de running más exclusivo de Puebla. Comunidad, entrenamientos profesionales, eventos únicos y experiencias deportivas premium. Únete a la nueva era del running."
        image="/assets/hero-runners.jpg"
        url="https://runningera.mx"
      />
      <Header />
      <Hero />
      <Events />
      <Community />
      <LeaderboardsSection />
      <WhyChooseUs />
      <Gallery />
      <Reviews />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

