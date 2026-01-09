"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { EventRegistrationModal } from '@/components/EventRegistrationModal';

interface EventRegistrationButtonProps {
  eventId: string;
  eventSlug?: string;
  buttonText: 'REGÍSTRATE' | 'VER EVENTO';
  eventTitle?: string;
  eventPrice?: string;
  maxParticipants?: number;
}

export function EventRegistrationButton({ eventId, eventSlug, buttonText, eventTitle = 'Evento', eventPrice, maxParticipants }: EventRegistrationButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEventFull, setIsEventFull] = useState(false);
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndRegistration();
    checkEventCapacity();
  }, [eventId, maxParticipants]);

  const checkEventCapacity = async () => {
    if (!maxParticipants) {
      setIsEventFull(false);
      setSpotsRemaining(null);
      return;
    }

    try {
      // Contar solo registros con pago exitoso (paid), NO contar pendientes
      const { count: registrationsCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('payment_status', 'paid');

      const { count: attendeesCount } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('payment_status', 'paid');

      const totalRegistered = (registrationsCount || 0) + (attendeesCount || 0);
      const remaining = maxParticipants - totalRegistered;
      
      setIsEventFull(totalRegistered >= maxParticipants);
      setSpotsRemaining(remaining > 0 ? remaining : 0);
    } catch (error) {
      console.error('Error checking event capacity:', error);
    }
  };

  useEffect(() => {
    // Si viene de la página de éxito, refrescar después de un breve delay
    if (typeof window !== 'undefined' && searchParams) {
      const paymentSuccess = searchParams.get('payment_success');
      if (paymentSuccess === 'true') {
        // Limpiar el parámetro de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_success');
        window.history.replaceState({}, '', url.toString());
        
        // Refrescar después de un delay
        setTimeout(() => {
          checkAuthAndRegistration();
        }, 1000);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // Si hay un registro pendiente, refrescar periódicamente para verificar si ya se pagó
    if (paymentStatus === 'pending' && !isRegistered) {
      const intervalId = setInterval(() => {
        checkAuthAndRegistration();
      }, 5000); // Refrescar cada 5 segundos

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [paymentStatus, isRegistered]);

  const checkAuthAndRegistration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Verificar si ya está registrado (tanto en event_registrations como en attendees)
      const registrationResult = await supabase
        .from('event_registrations')
        .select('id, status, payment_status, stripe_session_id')
        .eq('member_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      const attendeeResult = await supabase
        .from('attendees')
        .select('id, status, payment_status')
        .eq('event_id', eventId)
        .eq('email', user.email || '')
        .maybeSingle();

      // Guardar el estado del pago para mostrar información
      if (registrationResult.data) {
        setPaymentStatus(registrationResult.data.payment_status);
      }

      // Solo considerar registrado si:
      // 1. El pago está completado (payment_status = 'paid')
      // 2. O es un evento gratuito (eventPrice = 'gratis' o '0')
      // 3. O está en la tabla de attendees con payment_status = 'paid'
      const hasValidRegistration = registrationResult.data && 
        (registrationResult.data.payment_status === 'paid' || 
         !eventPrice || 
         eventPrice.toLowerCase() === 'gratis' || 
         eventPrice === '0');

      const hasValidAttendee = attendeeResult.data && 
        (!attendeeResult.data.payment_status || 
         attendeeResult.data.payment_status === 'paid');

      if (hasValidRegistration || hasValidAttendee) {
        setIsRegistered(true);
      } else if (registrationResult.data && registrationResult.data.payment_status === 'pending') {
        // Si hay registro pendiente, intentar verificar si ya se pagó
        if (registrationResult.data.stripe_session_id) {
          // Refrescar el estado después de un delay para dar tiempo al webhook
          setTimeout(() => {
            checkAuthAndRegistration();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setModalOpen(true);
      return;
    }

    setRegistering(true);

    try {
      console.log('🔄 Iniciando registro de evento:', { eventId });
      
      const response = await fetch('/api/members/register-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await response.json();
      
      console.log('📥 Respuesta del servidor:', { 
        ok: response.ok, 
        status: response.status,
        data 
      });

      if (!response.ok) {
        console.error('❌ Error en registro:', data);
        toast.error('Error al registrarse', {
          description: data.details || data.error || 'No se pudo completar el registro',
        });
        setRegistering(false);
        return;
      }

      if (data.requires_payment) {
        if (data.checkout_url) {
          console.log('💳 Redirigiendo a Stripe Checkout:', data.checkout_url);
          // Redirigir a Stripe Checkout
          window.location.href = data.checkout_url;
        } else {
          console.error('❌ No se recibió checkout_url pero requires_payment es true');
          toast.error('Error al crear sesión de pago', {
            description: 'No se pudo obtener la URL de pago. Por favor intenta de nuevo.',
          });
          setRegistering(false);
        }
      } else {
        // Registro exitoso (evento gratuito)
        console.log('✅ Registro exitoso (evento gratuito)');
        toast.success('¡Registro exitoso!', {
          description: 'Te has registrado correctamente al evento',
        });

        setIsRegistered(true);
        router.push('/miembros/dashboard');
      }
    } catch (error: any) {
      console.error('💥 Error inesperado en handleRegister:', error);
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al registrarse',
      });
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase opacity-50">
        Cargando...
      </div>
    );
  }

  if (isRegistered) {
    return (
      <Link
        href="/miembros/dashboard"
        className="block w-full bg-green-500 text-white px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-green-600"
      >
        Ya estás registrado - Ver en Dashboard
      </Link>
    );
  }

  // Si el evento está lleno, mostrar botón deshabilitado
  if (isEventFull && buttonText === 'REGÍSTRATE') {
    return (
      <div className="block w-full bg-muted text-muted-foreground px-6 py-4 text-center text-sm font-medium tracking-wider uppercase cursor-not-allowed opacity-60">
        Evento Lleno
      </div>
    );
  }

  // Componente para mostrar el contador de lugares disponibles
  const SpotsCounter = () => {
    // No mostrar si no hay límite de participantes o si el evento está lleno
    if (!maxParticipants || isEventFull) {
      return null;
    }

    // Si spotsRemaining es null o 0, no mostrar
    if (spotsRemaining === null || spotsRemaining === 0) {
      return null;
    }

    // Mostrar siempre la información de lugares disponibles
    return (
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          {spotsRemaining === 1 
            ? '⚠️ Solo queda 1 lugar disponible' 
            : spotsRemaining <= 10
            ? `⚠️ Solo quedan ${spotsRemaining} lugares disponibles`
            : `${spotsRemaining} lugares disponibles`}
        </p>
      </div>
    );
  };

  if (isAuthenticated && buttonText === 'REGÍSTRATE') {
    return (
      <>
        <button
          onClick={handleRegister}
          disabled={registering || isEventFull}
          className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {registering ? 'Registrando...' : buttonText}
        </button>
        <SpotsCounter />
      </>
    );
  }

  // Si no está autenticado, mostrar botón que abre el modal
  if (!isAuthenticated && buttonText === 'REGÍSTRATE') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          disabled={isEventFull}
          className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEventFull ? 'Evento Lleno' : buttonText}
        </button>
        <SpotsCounter />
        <EventRegistrationModal
          eventId={eventId}
          eventSlug={eventSlug}
          eventTitle={eventTitle}
          eventPrice={eventPrice}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onRegistrationSuccess={() => {
            setIsRegistered(true);
            checkAuthAndRegistration();
            checkEventCapacity();
          }}
        />
      </>
    );
  }

  // Para "VER EVENTO", mantener el comportamiento original
  return (
    <a
      href="#contacto"
      className="block w-full border border-foreground text-foreground px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-foreground hover:text-background"
    >
      {buttonText}
    </a>
  );
}




