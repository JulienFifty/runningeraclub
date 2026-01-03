"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, Calendar, Clock, CheckCircle, Filter, X, List, LayoutGrid, Search } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const supabase = createClient();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);

      // Verificar que sea admin
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        toast.error('Acceso denegado');
        router.push('/admin/login');
        return;
      }

      setIsAdmin(true);
      fetchEvents();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/admin/login');
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        toast.error('Error al cargar eventos');
        console.error(error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error al eliminar el evento');
        console.error(error);
        return;
      }

      setEvents(events.filter(event => event.id !== id));
      toast.success('Evento eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast.error('Error inesperado');
    }
  };

  const getStatusColor = (event: Event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (eventDate < today) {
      return 'text-muted-foreground';
    } else if (eventDate.toDateString() === today.toDateString()) {
      return 'text-green-600';
    } else {
      return 'text-blue-600';
    }
  };

  const getStatusText = (event: Event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (eventDate < today) {
      return 'Finalizado';
    } else if (eventDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else {
      return 'Próximo';
    }
  };

  // Filtros
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = !filterMonth || event.date.startsWith(filterMonth);
    const matchesCategory = !filterCategory || event.category === filterCategory;
    
    return matchesSearch && matchesMonth && matchesCategory;
  });

  const uniqueMonths = Array.from(new Set(events.map(e => e.date.substring(0, 7)))).sort().reverse();
  const uniqueCategories = Array.from(new Set(events.map(e => e.category)));

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container-premium">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver al Panel</span>
              </Link>
              <h1 className="font-display text-4xl md:text-5xl text-foreground font-light mb-4">
                Gestión de Eventos
              </h1>
              <p className="text-muted-foreground">
                Administra todos los eventos del club
              </p>
            </div>
            <Link
              href="/admin/eventos/nuevo"
              className="btn-premium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </Link>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por título o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>

            {/* Vista */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-background shadow' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-background shadow' : ''}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Filtro por Mes */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            >
              <option value="">Todos los meses</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>

            {/* Filtro por Categoría */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
            >
              <option value="">Todas las categorías</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Limpiar filtros */}
            {(filterMonth || filterCategory || searchQuery) && (
              <button
                onClick={() => {
                  setFilterMonth('');
                  setFilterCategory('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando eventos...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterMonth || filterCategory ? 'No se encontraron eventos con los filtros aplicados' : 'No hay eventos creados'}
            </p>
            {!searchQuery && !filterMonth && !filterCategory && (
              <Link href="/admin/eventos/nuevo" className="btn-premium inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear Primer Evento
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'card' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`bg-card border border-border rounded-lg overflow-hidden ${
                  viewMode === 'list' ? 'flex items-center gap-6 p-6' : ''
                }`}
              >
                {viewMode === 'card' && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`${viewMode === 'card' ? 'p-6' : 'flex-1'}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(event)} bg-muted`}>
                      {getStatusText(event)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{event.category}</span>
                    {event.price && <span className="text-xs bg-muted px-2 py-1 rounded">{event.price}</span>}
                    {event.difficulty && <span className="text-xs bg-muted px-2 py-1 rounded">{event.difficulty}</span>}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/eventos/${event.slug}`}
                      target="_blank"
                      className="px-3 py-2 text-xs border border-border hover:bg-muted rounded transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Ver
                    </Link>
                    <Link
                      href={`/admin/eventos/${event.id}`}
                      className="px-3 py-2 text-xs border border-border hover:bg-muted rounded transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-2 text-xs border border-red-500 text-red-500 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
