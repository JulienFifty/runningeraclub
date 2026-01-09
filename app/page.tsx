"use client";

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { WellnessCommunity } from '@/components/WellnessCommunity';
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
      <WellnessCommunity />
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

