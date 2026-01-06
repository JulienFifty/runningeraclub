import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { getEventBySlug, getAllEventSlugs } from '@/data/events-supabase';
import { Calendar, MapPin, Clock, Route, TrendingUp, Users, DollarSign, CheckCircle, ArrowLeft, MessageCircle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { EventRegistrationButton } from '@/components/EventRegistrationButton';

// Forzar renderizado dinámico para obtener datos actualizados
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Obtener datos dinámicos actualizados
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: 'Evento no encontrado',
    };
  }

  return {
    title: `${event.title} | RUNNING ERA`,
    description: event.description,
    openGraph: {
      title: `${event.title} | RUNNING ERA`,
      description: event.description,
      images: [event.image],
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  // Obtener datos actualizados directamente de Supabase
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
        </div>

        <div className="relative z-10 h-full flex items-end">
          <div className="container-premium w-full pb-12 md:pb-16">
            <Link
              href="/#eventos"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors text-sm font-medium tracking-wider uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Eventos
            </Link>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 text-xs font-medium tracking-wider uppercase">
                <Calendar className="w-4 h-4" />
                {event.date}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 text-xs font-medium tracking-wider uppercase">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 text-xs font-medium tracking-wider uppercase">
                {event.category}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-light mb-4 leading-tight">
              {event.title}
            </h1>
            
            <p className="text-white/90 text-lg md:text-xl font-light max-w-3xl leading-relaxed">
              {event.shortDescription || event.description}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-background pb-24 md:pb-16">
        <div className="container-premium">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              {event.description && (
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-6">
                    Sobre este Evento
                  </h2>
                  <div className="text-foreground leading-relaxed whitespace-pre-line">
                    {event.description}
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div>
                <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-6">
                  Detalles del Evento
                </h2>
                <div className="space-y-4">
                  {event.duration && (
                    <div className="flex items-start gap-4">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Duración</p>
                        <p className="text-foreground font-medium">{event.duration}</p>
                      </div>
                    </div>
                  )}
                  {event.distance && (
                    <div className="flex items-start gap-4">
                      <Route className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Distancia</p>
                        <p className="text-foreground font-medium">{event.distance}</p>
                      </div>
                    </div>
                  )}
                  {event.difficulty && (
                    <div className="flex items-start gap-4">
                      <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                          {Array.isArray(event.difficulty) && event.difficulty.length > 1 ? 'Niveles' : 'Nivel'}
                        </p>
                        <p className="text-foreground font-medium">
                          {Array.isArray(event.difficulty) 
                            ? event.difficulty.join(', ') 
                            : event.difficulty}
                        </p>
                      </div>
                    </div>
                  )}
                  {event.maxParticipants && (
                    <div className="flex items-start gap-4">
                      <Users className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Cupo</p>
                        <p className="text-foreground font-medium">{event.maxParticipants} participantes</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              {event.schedule && event.schedule.length > 0 && (
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-6">
                    Programa
                  </h2>
                  <div className="space-y-4">
                    {event.schedule.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-border last:border-0">
                        <div className="flex-shrink-0 w-20">
                          <p className="text-foreground font-medium">{item.time}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{item.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {event.highlights && event.highlights.length > 0 && (
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-6">
                    Lo que Incluye
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {event.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-foreground">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && event.requirements.length > 0 && (
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground font-light mb-6">
                    Requisitos
                  </h2>
                  <ul className="space-y-3">
                    {event.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-foreground mt-1.5">•</span>
                        <p className="text-foreground">{requirement}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Registration Card */}
                <div className="bg-card border border-border p-6 space-y-6">
                  {event.price && (
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Precio</p>
                      <p className="text-2xl font-display text-foreground">
                        {(() => {
                          const priceStr = event.price.toString().toLowerCase();
                          // Si es "gratis" o ya tiene "$", no agregar nada
                          if (priceStr === 'gratis' || priceStr.includes('$')) {
                            return event.price;
                          }
                          // Si es solo un número, agregar "$"
                          return `$${event.price}`;
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 hidden md:block">
                    <EventRegistrationButton eventId={event.id} eventSlug={event.slug} buttonText={event.buttonText} eventTitle={event.title} eventPrice={event.price} />
                  </div>

                  {/* Contact Info */}
                  {event.contactInfo && (
                    <div className="pt-6 border-t border-border space-y-4">
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">Contacto</p>
                      {event.contactInfo.email && (
                        <a
                          href={`mailto:${event.contactInfo.email}`}
                          className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{event.contactInfo.email}</span>
                        </a>
                      )}
                      {event.contactInfo.whatsapp && (
                        <a
                          href={`https://wa.me/${event.contactInfo.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">WhatsApp</span>
                        </a>
                      )}
                      {event.contactInfo.phone && (
                        <a
                          href={`tel:${event.contactInfo.phone}`}
                          className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{event.contactInfo.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="bg-card border border-border p-6 space-y-4">
                  <h3 className="font-display text-xl text-foreground font-light">Información Rápida</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="text-foreground font-medium">{event.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicación</span>
                      <span className="text-foreground font-medium">{event.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría</span>
                      <span className="text-foreground font-medium">{event.category}</span>
                    </div>
                    {event.difficulty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {Array.isArray(event.difficulty) && event.difficulty.length > 1 ? 'Niveles' : 'Nivel'}
                        </span>
                        <span className="text-foreground font-medium">
                          {Array.isArray(event.difficulty) 
                            ? event.difficulty.join(', ') 
                            : event.difficulty}
                        </span>
                      </div>
                    )}
                    {event.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración</span>
                        <span className="text-foreground font-medium">{event.duration}</span>
                      </div>
                    )}
                    {event.distance && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distancia</span>
                        <span className="text-foreground font-medium">{event.distance}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
      
      {/* Botón de registro fijo en mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-background border-t border-border p-4 shadow-lg">
        <EventRegistrationButton 
          eventId={event.id} 
          eventSlug={event.slug} 
          buttonText={event.buttonText} 
          eventTitle={event.title} 
          eventPrice={event.price} 
        />
      </div>
    </main>
  );
}
