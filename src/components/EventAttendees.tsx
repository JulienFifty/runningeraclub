"use client";

import { useState, useEffect, Suspense } from 'react';
import { Users, User, Lock, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Attendee {
  id: string;
  name: string;
  email: string | null;
  profile_image: string | null;
  registration_date: string;
  type: 'member' | 'guest';
}

interface EventAttendeesProps {
  eventId: string;
  eventSlug: string;
}

function EventAttendeesContent({ eventId, eventSlug }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadAttendees = async () => {
      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Cargar asistentes
      try {
        const response = await fetch(`/api/events/${eventId}/attendees`);
        if (response.ok) {
          const data = await response.json();
          setAttendees(data.attendees || []);
        } else {
          console.error('Error cargando asistentes');
        }
      } catch (error) {
        console.error('Error al obtener asistentes:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadAttendees();
  }, [eventId, supabase]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-display text-xl text-foreground font-light">
            Asistentes
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card border border-border p-6 rounded-lg relative">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-display text-xl text-foreground font-light">
            Asistentes
          </h3>
        </div>
        
        {/* Blur overlay */}
        <div className="relative blur-sm pointer-events-none select-none">
          {attendees.length > 0 ? (
            <div className="space-y-4">
              {attendees.slice(0, 5).map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    {attendee.profile_image ? (
                      <AvatarImage src={attendee.profile_image} alt={attendee.name} />
                    ) : null}
                    <AvatarFallback className="bg-foreground text-background text-xs">
                      {getInitials(attendee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{attendee.name}</p>
                    {attendee.type === 'guest' && (
                      <p className="text-xs text-muted-foreground">Invitado</p>
                    )}
                  </div>
                </div>
              ))}
              {attendees.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{attendees.length - 5} más
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aún no hay asistentes registrados
            </p>
          )}
        </div>

        {/* CTA overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              Conéctate para ver quién va
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Descubre quiénes asistirán a este evento
            </p>
            <Link
              href={`/miembros/login?event_slug=${eventSlug}&event_title=${encodeURIComponent('Evento')}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-xl text-foreground font-light">
          Asistentes
        </h3>
        {attendees.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({attendees.length})
          </span>
        )}
      </div>

      {attendees.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            Aún no hay asistentes registrados
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sé el primero en registrarse
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {attendees.map((attendee) => (
            <div key={attendee.id} className="flex items-center gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                {attendee.profile_image ? (
                  <AvatarImage src={attendee.profile_image} alt={attendee.name} />
                ) : null}
                <AvatarFallback className="bg-foreground text-background text-xs">
                  {getInitials(attendee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attendee.name}
                </p>
                {attendee.type === 'guest' && (
                  <p className="text-xs text-muted-foreground">Invitado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventAttendees({ eventId, eventSlug }: EventAttendeesProps) {
  return (
    <Suspense fallback={
      <div className="bg-card border border-border p-6 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </div>
    }>
      <EventAttendeesContent eventId={eventId} eventSlug={eventSlug} />
    </Suspense>
  );
}

export { EventAttendees };

