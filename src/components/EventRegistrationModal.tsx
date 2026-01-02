"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { X, User, Mail, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventRegistrationModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess?: () => void;
}

export function EventRegistrationModal({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onRegistrationSuccess,
}: EventRegistrationModalProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [mode, setMode] = useState<'choose' | 'guest' | 'login'>('choose');
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleGuestRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/attendees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestForm.name,
          email: guestForm.email || null,
          phone: guestForm.phone || null,
          event_id: eventId,
          tickets: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al registrarse', {
          description: data.error || 'No se pudo completar el registro',
        });
        return;
      }

      toast.success('¡Registro exitoso!', {
        description: 'Te has registrado correctamente al evento',
      });

      setGuestForm({ name: '', email: '', phone: '' });
      setMode('choose');
      onClose();
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (error: any) {
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al registrarse',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    onClose();
    router.push('/miembros/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop con blur transparente */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-display font-light text-foreground">
            {mode === 'choose' ? 'Registrarse al Evento' : mode === 'guest' ? 'Registro Rápido' : 'Iniciar Sesión'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'choose' && (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-6">
                Elige cómo deseas registrarte a <span className="font-medium text-foreground">{eventTitle}</span>
              </p>

              <button
                onClick={() => setMode('guest')}
                className="w-full p-6 border-2 border-border rounded-lg hover:border-foreground/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg group-hover:bg-foreground/5 transition-colors">
                    <User className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      Registro Rápido
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Registrate sin crear una cuenta. Solo necesitas tu nombre y contacto.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>

              <button
                onClick={handleLoginClick}
                className="w-full p-6 border-2 border-border rounded-lg hover:border-foreground/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg group-hover:bg-foreground/5 transition-colors">
                    <Mail className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      Crear Cuenta / Iniciar Sesión
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Crea una cuenta de miembro para gestionar tus eventos y tener acceso a beneficios exclusivos.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            </div>
          )}

          {mode === 'guest' && (
            <form onSubmit={handleGuestRegistration} className="space-y-4">
              <div>
                <Label htmlFor="guest-name" className="mb-2">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="guest-name"
                    type="text"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                    className="pl-10"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guest-email" className="mb-2">
                  Email (Opcional)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="guest-email"
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    className="pl-10"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guest-phone" className="mb-2">
                  Teléfono (Opcional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="guest-phone"
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="pl-10"
                    placeholder="+52 222 123 4567"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('choose')}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !guestForm.name.trim()}
                  className="flex-1"
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

