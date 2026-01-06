"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { X, User, Mail, Phone, ArrowRight, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventRegistrationModalProps {
  eventId: string;
  eventTitle: string;
  eventPrice?: string;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess?: () => void;
}

export function EventRegistrationModal({
  eventId,
  eventTitle,
  eventPrice,
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
    coupon: '',
  });
  const [loading, setLoading] = useState(false);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Verificar si el evento requiere pago
  const requiresPayment = eventPrice && 
    eventPrice !== '0' && 
    !eventPrice.toLowerCase().includes('gratis') &&
    !eventPrice.toLowerCase().includes('free');

  // Validar cupón
  const validateCoupon = async (code: string) => {
    if (!code.trim() || !requiresPayment) return;

    setCouponValidating(true);
    setCouponError('');
    setCouponData(null);

    try {
      // Extraer precio numérico
      const priceMatch = eventPrice?.match(/\d+/);
      if (!priceMatch) return;
      const amount = parseInt(priceMatch[0]);

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          event_id: eventId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || 'Cupón no válido');
        return;
      }

      if (data.valid) {
        setCouponData(data);
        toast.success('¡Cupón aplicado!', {
          description: `Descuento: $${data.discount_amount.toFixed(2)} MXN`,
        });
      }
    } catch (error: any) {
      setCouponError('Error al validar cupón');
    } finally {
      setCouponValidating(false);
    }
  };

  const handleGuestRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (requiresPayment) {
        // Primero crear el attendee
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
          setLoading(false);
          return;
        }

        // Crear sesión de pago de Stripe
        const checkoutResponse = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          event_id: eventId,
          attendee_id: data.attendee.id,
          is_guest: true,
          coupon_code: guestForm.coupon || undefined,
        }),
      });

        const checkoutData = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
          toast.error('Error al iniciar pago', {
            description: checkoutData.error || 'No se pudo iniciar el proceso de pago',
          });
          setLoading(false);
          return;
        }

        // Redirigir a Stripe Checkout
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        }
      } else {
        // Registro sin pago
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

        setGuestForm({ name: '', email: '', phone: '', coupon: '' });
        setMode('choose');
        onClose();
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
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
                {requiresPayment && (
                  <span className="block mt-2 text-sm">
                    Precio: <span className="font-semibold text-foreground">{eventPrice}</span>
                  </span>
                )}
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
                    <h3 className="text-lg font-display font-bold text-foreground mb-1 uppercase tracking-wider">
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
                    <h3 className="text-lg font-display font-bold text-foreground mb-1 uppercase tracking-wider">
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
                    placeholder="+52 221 581 5902"
                  />
                </div>
              </div>

              {/* Campo de cupón (solo si requiere pago) */}
              {requiresPayment && (
                <div>
                  <Label htmlFor="guest-coupon" className="mb-2">
                    Cupón de Descuento (Opcional)
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="guest-coupon"
                        type="text"
                        value={guestForm.coupon}
                        onChange={(e) => {
                          setGuestForm({ ...guestForm, coupon: e.target.value.toUpperCase() });
                          setCouponError('');
                          setCouponData(null);
                        }}
                        className="pl-10"
                        placeholder="CÓDIGO"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => validateCoupon(guestForm.coupon)}
                      disabled={!guestForm.coupon.trim() || couponValidating || loading}
                    >
                      {couponValidating ? 'Validando...' : couponData ? <Check className="w-4 h-4" /> : 'Aplicar'}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-500 mt-1">{couponError}</p>
                  )}
                  {couponData && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">✓ Cupón aplicado</p>
                      <p className="text-xs text-green-700 mt-1">
                        Precio original: ${couponData.original_amount.toFixed(2)} MXN
                      </p>
                      <p className="text-xs text-green-700">
                        Descuento: -${couponData.discount_amount.toFixed(2)} MXN
                      </p>
                      <p className="text-sm text-green-800 font-semibold mt-1">
                        Total a pagar: ${couponData.final_amount.toFixed(2)} MXN
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                  {loading ? 'Procesando...' : requiresPayment ? 'Continuar al Pago' : 'Registrarse'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

