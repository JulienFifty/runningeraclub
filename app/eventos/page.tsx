"use client";

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Calendar, MapPin, Search, Filter, X, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  short_description: string;
  image: string;
  button_text: 'REGÍSTRATE' | 'VER EVENTO';
  price?: string | null;
  category?: string | null;
  spots_available?: number | null;
}

type SortOption = 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'title_asc';

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        return;
      }

      if (data) {
        const transformedEvents = data.map(event => ({
          id: event.id,
          slug: event.slug,
          title: event.title,
          date: event.date,
          location: event.location,
          short_description: event.short_description,
          image: event.image,
          button_text: event.button_text as 'REGÍSTRATE' | 'VER EVENTO',
          price: event.price || null,
          category: event.category || null,
          spots_available: event.spots_available !== undefined ? event.spots_available : null,
        }));
        setEvents(transformedEvents);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener valores únicos para filtros
  const categories = useMemo(() => {
    const cats = Array.from(new Set(events.map(e => e.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [events]);

  const locations = useMemo(() => {
    const locs = Array.from(new Set(events.map(e => e.location).filter(Boolean))) as string[];
    return locs.sort();
  }, [events]);

  // Filtrar y ordenar eventos
  useEffect(() => {
    let filtered = [...events];

    // Búsqueda por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.short_description?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      );
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filtro por ubicación
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(event => event.location === selectedLocation);
    }

    // Filtro por precio
    if (priceFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.price) return priceFilter === 'free';
        const priceStr = event.price.toString().toLowerCase();
        if (priceStr === 'gratis' || priceStr === 'free' || priceStr === '0') {
          return priceFilter === 'free';
        }
        const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''));
        if (isNaN(priceNum)) return false;
        switch (priceFilter) {
          case 'free':
            return priceNum === 0;
          case 'low':
            return priceNum > 0 && priceNum <= 500;
          case 'medium':
            return priceNum > 500 && priceNum <= 1000;
          case 'high':
            return priceNum > 1000;
          default:
            return true;
        }
      });
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(event => {
        try {
          const eventDate = new Date(event.date);
          if (isNaN(eventDate.getTime())) return true;
          
          switch (dateFilter) {
            case 'today':
              return eventDate.toDateString() === now.toDateString();
            case 'this_week':
              const weekFromNow = new Date(now);
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return eventDate >= now && eventDate <= weekFromNow;
            case 'this_month':
              return eventDate >= now && eventDate.getMonth() === now.getMonth();
            case 'upcoming':
              return eventDate >= now;
            case 'past':
              return eventDate < now;
            default:
              return true;
          }
        } catch {
          return true;
        }
      });
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'price_asc': {
          const priceA = a.price ? parseInt(a.price.toString().replace(/[^0-9]/g, '')) || 0 : 0;
          const priceB = b.price ? parseInt(b.price.toString().replace(/[^0-9]/g, '')) || 0 : 0;
          return priceA - priceB;
        }
        case 'price_desc': {
          const priceA = a.price ? parseInt(a.price.toString().replace(/[^0-9]/g, '')) || 0 : 0;
          const priceB = b.price ? parseInt(b.price.toString().replace(/[^0-9]/g, '')) || 0 : 0;
          return priceB - priceA;
        }
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedCategory, selectedLocation, priceFilter, dateFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setPriceFilter('all');
    setDateFilter('all');
    setSortBy('date_asc');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return 'GRATIS';
    const priceStr = price.toString().toLowerCase();
    if (priceStr === 'gratis' || priceStr === 'free' || priceStr === '0') {
      return 'GRATIS';
    }
    if (priceStr.includes('$')) {
      return price;
    }
    return `$${price}`;
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedLocation !== 'all') count++;
    if (priceFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  }, [selectedCategory, selectedLocation, priceFilter, dateFilter]);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-black via-black/95 to-background pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-4 uppercase tracking-tight">
              Todos los Eventos
            </h1>
            <p className="text-white/70 text-lg md:text-xl font-light max-w-2xl mx-auto">
              Descubre nuestros eventos exclusivos y únete a la comunidad de corredores más vibrante de Puebla.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar eventos por nombre, ubicación o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:border-white/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Filters Toggle & Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto"
          >
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-white/70 text-sm">
                Ordenar por:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="date_asc" className="bg-background text-foreground">Fecha (Próximos primero)</option>
                <option value="date_desc" className="bg-background text-foreground">Fecha (Recientes primero)</option>
                <option value="title_asc" className="bg-background text-foreground">Nombre (A-Z)</option>
                <option value="price_asc" className="bg-background text-foreground">Precio (Menor a mayor)</option>
                <option value="price_desc" className="bg-background text-foreground">Precio (Mayor a menor)</option>
              </select>
            </div>
          </motion.div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-4xl mx-auto mt-6 p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Categoría */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors"
                  >
                    <option value="all" className="bg-background text-foreground">Todas</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-background text-foreground">
                        {cat.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Ubicación</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors"
                  >
                    <option value="all" className="bg-background text-foreground">Todas</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc} className="bg-background text-foreground">
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Precio</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors"
                  >
                    <option value="all" className="bg-background text-foreground">Todos</option>
                    <option value="free" className="bg-background text-foreground">Gratis</option>
                    <option value="low" className="bg-background text-foreground">$0 - $500</option>
                    <option value="medium" className="bg-background text-foreground">$501 - $1000</option>
                    <option value="high" className="bg-background text-foreground">$1000+</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Fecha</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:border-white/50 transition-colors"
                  >
                    <option value="all" className="bg-background text-foreground">Todas</option>
                    <option value="upcoming" className="bg-background text-foreground">Próximos</option>
                    <option value="today" className="bg-background text-foreground">Hoy</option>
                    <option value="this_week" className="bg-background text-foreground">Esta semana</option>
                    <option value="this_month" className="bg-background text-foreground">Este mes</option>
                    <option value="past" className="bg-background text-foreground">Pasados</option>
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-white/70 hover:text-white text-sm underline transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="section-padding bg-background">
        <div className="container-premium">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-display text-foreground mb-4">
                No se encontraron eventos
              </p>
              <p className="text-muted-foreground mb-6">
                {searchQuery || activeFiltersCount > 0
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'No hay eventos disponibles en este momento'}
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Mostrando {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link href={`/eventos/${event.slug}`}>
                      <div className="group bg-white border border-border overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col cursor-pointer">
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                            {event.category && (
                              <span className="inline-block bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold text-black uppercase tracking-wider shadow-sm">
                                {event.category.replace(/_/g, ' ')}
                              </span>
                            )}
                            {event.spots_available !== null && event.spots_available !== undefined && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${
                                event.spots_available > 10 
                                  ? 'bg-green-500 text-white'
                                  : event.spots_available > 0 
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-red-500 text-white'
                              }`}>
                                {event.spots_available > 0 ? `${event.spots_available}` : 'AGOTADO'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6 flex-1 flex flex-col">
                          <h3 className="font-display text-lg md:text-xl text-black font-bold mb-2 leading-tight group-hover:text-black/80 transition-colors line-clamp-2">
                            {event.title}
                          </h3>

                          <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
                            {event.short_description}
                          </p>

                          {/* Info */}
                          <div className="space-y-2 mb-4 pb-4 border-b border-border">
                            <div className="flex items-center gap-2 text-muted-foreground/70 text-xs">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground/70 text-xs">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center justify-between gap-3">
                            {event.price && (
                              <span className="text-base md:text-lg font-bold text-black whitespace-nowrap">
                                {formatPrice(event.price)}
                              </span>
                            )}
                            {!event.price && (
                              <span className="text-base md:text-lg font-bold text-green-600 whitespace-nowrap">
                                GRATIS
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              Ver más
                              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
