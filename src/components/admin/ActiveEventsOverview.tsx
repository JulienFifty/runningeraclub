"use client";

import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  max_participants?: number;
  registered_count: number;
  total_revenue: number;
  spots_remaining: number;
  is_full: boolean;
  is_near_capacity: boolean; // Menos de 10 lugares
}

export function ActiveEventsOverview() {
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveEvents();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchActiveEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveEvents = async () => {
    try {
      const response = await fetch('/api/admin/active-events', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar eventos activos');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error: any) {
      console.error('Error fetching active events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-foreground/10 rounded-lg">
            <Calendar className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Eventos Activos
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          No hay eventos activos en este momento
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground/10 rounded-lg">
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Eventos Activos
              </h2>
              <p className="text-sm text-muted-foreground">
                Vista rápida de cupo e ingresos
              </p>
            </div>
          </div>
          <Link
            href="/admin/eventos"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Events Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/admin/eventos/${event.id}`}
              className="group bg-background border border-border rounded-lg p-4 hover:border-foreground/50 transition-all duration-200 hover:shadow-md"
            >
              {/* Event Title */}
              <h3 className="font-display text-lg font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                {event.title}
              </h3>

              {/* Date */}
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
              </div>

              {/* Cupo */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Cupo</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    event.is_full 
                      ? 'text-red-500' 
                      : event.is_near_capacity 
                      ? 'text-yellow-500' 
                      : 'text-foreground'
                  }`}>
                    {event.registered_count}
                    {event.max_participants ? ` / ${event.max_participants}` : ''}
                  </span>
                </div>
                {event.max_participants && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        event.is_full
                          ? 'bg-red-500'
                          : event.is_near_capacity
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((event.registered_count / event.max_participants) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
                {event.is_full && (
                  <p className="text-xs text-red-500 mt-1">Evento lleno</p>
                )}
                {event.is_near_capacity && !event.is_full && (
                  <p className="text-xs text-yellow-500 mt-1">
                    Solo {event.spots_remaining} lugares disponibles
                  </p>
                )}
              </div>

              {/* Ingresos */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Ingresos</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(event.total_revenue)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

