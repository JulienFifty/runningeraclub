"use client";

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { WellnessCommunity } from '@/components/WellnessCommunity';
import { Experiences } from '@/components/Experiences';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { Events } from '@/components/Events';
import { LeaderboardsSection } from '@/components/LeaderboardsSection';
import { Community } from '@/components/Community';
import { Testimonials } from '@/components/Testimonials';
import { Gallery } from '@/components/Gallery';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <WellnessCommunity />
      <Events />
      <Community />
      <LeaderboardsSection />
      <WhyChooseUs />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

