"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { EventRegistrationModal } from '@/components/EventRegistrationModal';

interface EventRegistrationButtonProps {
  eventId: string;
  buttonText: 'REGÍSTRATE' | 'VER EVENTO';
  eventTitle?: string;
  eventPrice?: string;
}

export function EventRegistrationButton({ eventId, buttonText, eventTitle = 'Evento', eventPrice }: EventRegistrationButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndRegistration();
  }, [eventId]);

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
        .select('id, status, payment_status')
        .eq('member_id', user.id)
        .eq('event_id', eventId)
        .single();

      const attendeeResult = await supabase
        .from('attendees')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('email', user.email || '')
        .single();

      // Solo considerar registrado si:
      // 1. El pago está completado (payment_status = 'paid')
      // 2. O es un evento gratuito (eventPrice = 'gratis' o '0')
      // 3. O está en la tabla de attendees
      const hasValidRegistration = registrationResult.data && 
        (registrationResult.data.payment_status === 'paid' || 
         !eventPrice || 
         eventPrice.toLowerCase() === 'gratis' || 
         eventPrice === '0');

      if (hasValidRegistration || attendeeResult.data) {
        setIsRegistered(true);
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
      const response = await fetch('/api/members/register-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al registrarse', {
          description: data.error || 'No se pudo completar el registro',
        });
        return;
      }

      if (data.requires_payment && data.checkout_url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        // Registro exitoso (evento gratuito)
        toast.success('¡Registro exitoso!', {
          description: 'Te has registrado correctamente al evento',
        });

        setIsRegistered(true);
        router.push('/miembros/dashboard');
      }
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al registrarse',
      });
    } finally {
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

  if (isAuthenticated && buttonText === 'REGÍSTRATE') {
    return (
      <>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {registering ? 'Registrando...' : buttonText}
        </button>
      </>
    );
  }

  // Si no está autenticado, mostrar botón que abre el modal
  if (!isAuthenticated && buttonText === 'REGÍSTRATE') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="block w-full bg-foreground text-background px-6 py-4 text-center text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-foreground/90"
        >
          {buttonText}
        </button>
        <EventRegistrationModal
          eventId={eventId}
          eventTitle={eventTitle}
          eventPrice={eventPrice}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onRegistrationSuccess={() => {
            setIsRegistered(true);
            checkAuthAndRegistration();
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




