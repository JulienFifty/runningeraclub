"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, Calendar, Clock, CheckCircle, Filter, X, List, LayoutGrid, Search } from 'lucide-react';

interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  description: string;
  short_description: string;
  image: string;
  button_text: 'REGÍSTRATE' | 'VER EVENTO';
  category: string;
  duration?: string;
  distance?: string;
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
  price?: string;
  max_participants?: number;
}

export default function AdminEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(event => event.id !== id));
      } else {
        alert('Error al eliminar el evento');
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      alert('Error al eliminar el evento');
    }
  };

  // Obtener categorías únicas de los eventos
  const categories = Array.from(new Set(events.map(event => event.category))).sort();

  // Generar lista de meses disponibles (últimos 6 meses y próximos 12 meses)
  const getAvailableMonths = () => {
    const months: { value: string; label: string }[] = [];
    const today = new Date();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Agregar últimos 6 meses
    for (let i = 6; i > 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${monthNames[date.getMonth()]} ${year}`;
      months.push({ value, label });
    }

    // Agregar próximos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `${monthNames[date.getMonth()]} ${year}`;
      months.push({ value, label });
    }

    return months;
  };

  const availableMonths = getAvailableMonths();

  // Función para parsear fecha en formato "15 Dic 2024" a Date
  const parseEventDate = (dateString: string): Date | null => {
    const months: { [key: string]: number } = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };

    try {
      const parts = dateString.toLowerCase().split(' ');
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0]);
      const month = months[parts[1].substring(0, 3)];
      const year = parseInt(parts[2]);

      if (isNaN(day) || month === undefined || isNaN(year)) return null;

      return new Date(year, month, day);
    } catch (error) {
      return null;
    }
  };

  // Filtrar eventos según los filtros
  const filteredEvents = events.filter(event => {
    // Filtro por categoría
    if (filterCategory && event.category !== filterCategory) {
      return false;
    }

    // Filtro por mes
    if (filterMonth) {
      const eventDate = parseEventDate(event.date);
      
      if (eventDate) {
        // Formato filterMonth es "YYYY-MM"
        const [filterYear, filterMonthNum] = filterMonth.split('-').map(Number);
        const eventYear = eventDate.getFullYear();
        const eventMonth = eventDate.getMonth() + 1; // getMonth() devuelve 0-11
        
        if (eventYear !== filterYear || eventMonth !== filterMonthNum) {
          return false;
        }
      } else {
        return false; // Si no se puede parsear la fecha, excluir el evento
      }
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = `
        ${event.title}
        ${event.description}
        ${event.short_description}
        ${event.location}
        ${event.category}
      `.toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilterMonth('');
    setFilterCategory('');
    setSearchQuery('');
  };

  // Función para determinar si un evento ya pasó o está por venir
  const getEventStatus = (dateString: string) => {
    // Parsear fecha en formato "15 Dic 2024"
    const months: { [key: string]: number } = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };

    try {
      const parts = dateString.toLowerCase().split(' ');
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0]);
      const month = months[parts[1].substring(0, 3)];
      const year = parseInt(parts[2]);

      if (isNaN(day) || month === undefined || isNaN(year)) return null;

      const eventDate = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        return 'past';
      } else {
        return 'upcoming';
      }
    } catch (error) {
      return null;
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
                Gestión de Eventos
              </h1>
              <p className="text-muted-foreground">
                Administra todos los eventos del club
              </p>
            </div>
            <Link
              href="/admin/eventos/nuevo"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </Link>
          </div>
        </div>

        {/* Filtros */}
        {events.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <select
                id="filter-month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Todos los meses</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {(filterMonth || filterCategory || searchQuery) && (
                <>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    title="Limpiar filtros"
                  >
                    <X className="w-4 h-4" />
                    Limpiar
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {filteredEvents.length} de {events.length}
                  </span>
                </>
              )}
            </div>
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground w-full md:w-64"
              />
            </div>
          </div>
        )}

        {/* Selector de vista y lista de eventos */}
        {events.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-lg text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay eventos registrados</p>
            <Link
              href="/admin/eventos/nuevo"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg hover:bg-foreground/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primer evento
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de vista */}
            <div className="flex items-center justify-end mb-6">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title="Vista lista"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'card'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title="Vista tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vista Lista */}
            {viewMode === 'list' && (
              <div className="grid gap-4">
                {filteredEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/eventos/${event.id}`}
                    className="bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/50 transition-colors flex cursor-pointer group"
                  >
                    {/* Imagen del evento */}
                    <div className="relative w-48 md:w-64 h-32 md:h-40 flex-shrink-0">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          (e.target as HTMLImageElement).src = '/assets/hero-runners.jpg';
                        }}
                      />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-6 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <h3 className="font-display text-2xl text-foreground group-hover:text-foreground/80 transition-colors">
                            {event.title}
                          </h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {event.category}
                          </span>
                          {getEventStatus(event.date) === 'past' && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-1 rounded">
                              <CheckCircle className="w-3 h-3" />
                              Pasado
                            </span>
                          )}
                          {getEventStatus(event.date) === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                              <Clock className="w-3 h-3" />
                              Próximo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{event.date}</span>
                          <span>•</span>
                          <span>{event.location}</span>
                        </div>
                        {event.short_description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {event.short_description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Vista Card */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/eventos/${event.id}`}
                    className="bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/50 transition-all cursor-pointer group flex flex-col"
                  >
                    {/* Imagen del evento */}
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          (e.target as HTMLImageElement).src = '/assets/hero-runners.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="p-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background rounded-lg transition-colors"
                          title="Editar"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/admin/eventos/${event.id}`);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                          className="p-2 bg-background/80 backdrop-blur-sm text-destructive hover:bg-background rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-3 left-3">
                        {getEventStatus(event.date) === 'past' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-muted-foreground/90 backdrop-blur-sm text-background px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Pasado
                          </span>
                        )}
                        {getEventStatus(event.date) === 'upcoming' && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-500/90 backdrop-blur-sm text-background px-2 py-1 rounded">
                            <Clock className="w-3 h-3" />
                            Próximo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-display text-xl text-foreground group-hover:text-foreground/80 transition-colors flex-1">
                          {event.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {event.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>{event.location}</span>
                      </div>

                      {event.short_description && (
                        <p className="text-sm text-muted-foreground mt-auto line-clamp-2">
                          {event.short_description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

