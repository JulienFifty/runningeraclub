"use client";

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { WellnessCommunity } from '@/components/WellnessCommunity';
import { Experiences } from '@/components/Experiences';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { Events } from '@/components/Events';
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
      <WhyChooseUs />
      <Events />
      <Community />
      <Gallery />
      <Testimonials />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

