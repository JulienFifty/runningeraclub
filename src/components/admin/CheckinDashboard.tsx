"use client";

import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Attendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
  status: 'pending' | 'checked_in';
  checked_in_at?: string;
  event_id?: string;
}

interface CheckinDashboardProps {
  eventId?: string;
}

export function CheckinDashboard({ eventId }: CheckinDashboardProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attendees.filter(
        (attendee) =>
          attendee.name.toLowerCase().includes(query) ||
          attendee.email?.toLowerCase().includes(query) ||
          attendee.phone?.toLowerCase().includes(query)
      );
      setFilteredAttendees(filtered);
    }
  }, [searchQuery, attendees]);

  const fetchAttendees = async () => {
    try {
      let query = supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Error al cargar asistentes', {
          description: error.message,
        });
        return;
      }

      setAttendees(data || []);
      setFilteredAttendees(data || []);
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (attendeeId: string) => {
    // Optimistic UI update
    setUpdatingIds((prev) => new Set(prev).add(attendeeId));
    
    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendeeId
          ? {
              ...a,
              status: 'checked_in' as const,
              checked_in_at: new Date().toISOString(),
            }
          : a
      )
    );

    try {
      const response = await fetch(`/api/attendees/${attendeeId}/checkin`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al hacer check-in');
      }

      toast.success('Check-in realizado', {
        description: 'El asistente ha sido registrado',
      });

      // Refrescar datos para asegurar consistencia
      fetchAttendees();
    } catch (error: any) {
      // Revertir cambio optimista
      fetchAttendees();
      toast.error('Error al hacer check-in', {
        description: error.message,
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(attendeeId);
        return next;
      });
    }
  };

  const checkedInCount = attendees.filter((a) => a.status === 'checked_in').length;
  const totalCount = attendees.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando asistentes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y contador */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-lg"
            />
          </div>
          <div className="flex items-center gap-2 bg-foreground/10 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium">
              Asistentes: <span className="text-green-500">{checkedInCount}</span> / {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de asistentes */}
      {filteredAttendees.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-lg text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No se encontraron asistentes' : 'No hay asistentes registrados'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="bg-card border border-border rounded-lg p-6 flex items-center justify-between gap-4 hover:border-foreground/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <h3 className="font-display text-xl md:text-2xl text-foreground font-semibold">
                    {attendee.name}
                  </h3>
                  {attendee.tickets > 1 && (
                    <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                      ⚠️ GRUPO DE {attendee.tickets}
                    </span>
                  )}
                </div>
                {attendee.email && (
                  <p className="text-sm text-muted-foreground mb-1">{attendee.email}</p>
                )}
                {attendee.phone && (
                  <p className="text-xs text-muted-foreground">{attendee.phone}</p>
                )}
              </div>

              <button
                onClick={() => handleCheckIn(attendee.id)}
                disabled={attendee.status === 'checked_in' || updatingIds.has(attendee.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                  min-w-[140px] justify-center
                  ${attendee.status === 'checked_in'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                  }
                  ${updatingIds.has(attendee.id) ? 'opacity-50 cursor-not-allowed' : ''}
                  touch-manipulation
                `}
              >
                {updatingIds.has(attendee.id) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Procesando...</span>
                  </>
                ) : attendee.status === 'checked_in' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>¡Adentro!</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Hacer Check-in</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

