"use client";

import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Users, UserPlus, Trash2, CreditCard, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AddAttendeeModal } from './AddAttendeeModal';
import { EditAttendeeModal } from './EditAttendeeModal';

interface Attendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
  status: 'pending' | 'checked_in';
  checked_in_at?: string;
  event_id?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

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
      const url = eventId 
        ? `/api/attendees?event_id=${eventId}`
        : '/api/attendees';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Error al cargar asistentes');
      }

      const result = await response.json();
      const data = result.attendees || [];

      setAttendees(data);
      setFilteredAttendees(data);
    } catch (error: any) {
      toast.error('Error al cargar asistentes', {
        description: error.message,
      });
      setAttendees([]);
      setFilteredAttendees([]);
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

  const handleUndoCheckIn = async (attendeeId: string) => {
    // Optimistic UI update
    setUpdatingIds((prev) => new Set(prev).add(attendeeId));
    
    setAttendees((prev) =>
      prev.map((a) =>
        a.id === attendeeId
          ? {
              ...a,
              status: 'pending' as const,
              checked_in_at: undefined,
            }
          : a
      )
    );

    try {
      const response = await fetch(`/api/attendees/${attendeeId}/undo-checkin`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al deshacer el check-in');
      }

      toast.success('Check-in deshecho', {
        description: 'El asistente ha vuelto a estado pendiente',
      });

      // Refrescar datos para asegurar consistencia
      fetchAttendees();
    } catch (error: any) {
      // Revertir cambio optimista
      fetchAttendees();
      toast.error('Error al deshacer el check-in', {
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

  const handleDelete = async (attendeeId: string, attendeeName: string) => {
    // Confirmar antes de eliminar
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${attendeeName}?`)) {
      return;
    }

    // Optimistic UI update
    setUpdatingIds((prev) => new Set(prev).add(attendeeId));
    
    const previousAttendees = [...attendees];
    setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
    setFilteredAttendees((prev) => prev.filter((a) => a.id !== attendeeId));

    try {
      const response = await fetch(`/api/attendees/${attendeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar el asistente');
      }

      toast.success('Asistente eliminado', {
        description: `${attendeeName} ha sido eliminado de la lista`,
      });

      // Refrescar datos para asegurar consistencia
      fetchAttendees();
    } catch (error: any) {
      // Revertir cambio optimista
      setAttendees(previousAttendees);
      setFilteredAttendees(previousAttendees);
      toast.error('Error al eliminar el asistente', {
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
      <div>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Búsqueda y Filtros</h2>
        <div className="bg-card border border-border p-4 md:p-6 rounded-lg">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground text-sm md:text-base"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-foreground/10 px-3 md:px-4 py-2 rounded-lg">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
              <span className="text-foreground font-medium text-sm md:text-base">
                <span className="text-green-500">{checkedInCount}</span> / {totalCount}
              </span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">Agregar</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Lista de asistentes */}
      <div>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Lista de Asistentes</h2>
        {filteredAttendees.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-lg text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No se encontraron asistentes' : 'No hay asistentes registrados'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {filteredAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="bg-card border border-border rounded-lg p-4 md:p-6 flex items-center justify-between gap-3 md:gap-4 hover:border-foreground/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                  <h3 className="font-display text-lg md:text-xl lg:text-2xl text-foreground font-semibold break-words">
                    {attendee.name}
                  </h3>
                  {attendee.tickets > 1 && (
                    <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap">
                      ⚠️ GRUPO DE {attendee.tickets}
                    </span>
                  )}
                  {(() => {
                    // Verificar si es staff o cortesía por notes
                    const isStaff = attendee.notes?.includes('Staff');
                    const isCortesia = attendee.notes?.includes('Cortesía');
                    
                    // Si es staff o cortesía, mostrar badge especial
                    if (isStaff || isCortesia) {
                      return (
                        <span className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap bg-purple-500/20 text-purple-600 dark:text-purple-400">
                          <Users className="w-3 h-3" />
                          {isStaff ? 'Staff' : 'Cortesía'}
                        </span>
                      );
                    }
                    
                    // Si no, mostrar badge de payment_status
                    if (attendee.payment_status) {
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            attendee.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : attendee.payment_status === 'failed'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : attendee.payment_status === 'refunded'
                              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {attendee.payment_status === 'paid' ? (
                            <>
                              <CreditCard className="w-3 h-3" />
                              Pago Exitoso
                            </>
                          ) : attendee.payment_status === 'failed' ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Pago Fallido
                            </>
                          ) : attendee.payment_status === 'refunded' ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Reembolsado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pago Pendiente
                            </>
                          )}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                {attendee.email && (
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1 break-all">{attendee.email}</p>
                )}
                {attendee.phone && (
                  <p className="text-xs text-muted-foreground break-all">{attendee.phone}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedAttendee(attendee);
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar tipo de registro"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    if (attendee.status === 'checked_in') {
                      handleUndoCheckIn(attendee.id);
                    } else {
                      handleCheckIn(attendee.id);
                    }
                  }}
                  disabled={updatingIds.has(attendee.id)}
                  className={`
                    flex items-center justify-center p-2.5 md:p-3 rounded-lg transition-all
                    active:scale-95
                    ${updatingIds.has(attendee.id) 
                      ? 'opacity-50 cursor-not-allowed bg-muted' 
                      : attendee.status === 'checked_in'
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                    touch-manipulation min-w-[44px] min-h-[44px]
                  `}
                  title={attendee.status === 'checked_in' ? 'Deshacer check-in' : 'Hacer check-in'}
                >
                  {updatingIds.has(attendee.id) ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  ) : attendee.status === 'checked_in' ? (
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Clock className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
                
                <button
                  onClick={() => handleDelete(attendee.id, attendee.name)}
                  disabled={updatingIds.has(attendee.id)}
                  className={`
                    flex items-center justify-center p-2.5 md:p-3 rounded-lg transition-all
                    bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95
                    ${updatingIds.has(attendee.id) ? 'opacity-50 cursor-not-allowed' : ''}
                    touch-manipulation min-w-[44px] min-h-[44px]
                  `}
                  title="Eliminar asistente"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal para agregar asistente */}
      <AddAttendeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchAttendees();
        }}
        eventId={eventId}
      />
      {/* Modal para editar asistente */}
      <EditAttendeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAttendee(null);
        }}
        onSuccess={() => {
          fetchAttendees();
        }}
        attendee={selectedAttendee}
      />
    </div>
  );
}

