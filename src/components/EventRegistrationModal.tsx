"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { X, User, Mail, Phone, ArrowRight, Tag, Check, Crown, Sparkles, Gift, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventRegistrationModalProps {
  eventId: string;
  eventSlug?: string;
  eventTitle: string;
  eventPrice?: string;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess?: () => void;
}

export function EventRegistrationModal({
  eventId,
  eventSlug,
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
    // Pasar información del evento para mantener el contexto después de la confirmación
    const params = new URLSearchParams();
    if (eventSlug) params.set('event_slug', eventSlug);
    if (eventTitle) params.set('event_title', eventTitle);
    
    const url = params.toString() ? `/miembros/login?${params.toString()}` : '/miembros/login';
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Backdrop con blur transparente */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md max-h-[95vh] md:max-h-[90vh] mx-0 md:mx-4 bg-card border border-border rounded-none md:rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border flex-shrink-0">
          <h2 className="text-lg md:text-2xl font-display font-light text-foreground pr-2">
            {mode === 'choose' ? 'Registrarse al Evento' : mode === 'guest' ? 'Registro Rápido' : 'Iniciar Sesión'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {mode === 'choose' && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-4 md:mb-6">
                <p className="text-sm md:text-base text-muted-foreground mb-1 md:mb-2">
                  Regístrate a <span className="font-medium text-foreground">{eventTitle}</span>
                </p>
                {requiresPayment && (
                  <p className="text-base md:text-lg font-display font-semibold text-foreground">
                    {eventPrice}
                  </p>
                )}
              </div>

              {/* Opción Principal: Crear Cuenta */}
              <button
                onClick={handleLoginClick}
                className="w-full relative overflow-hidden border-2 border-foreground/20 rounded-lg md:rounded-xl hover:border-foreground/40 transition-all duration-300 text-left group bg-gradient-to-br from-foreground/5 to-foreground/10 hover:from-foreground/10 hover:to-foreground/15"
              >
                {/* Badge de Recomendado */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                  <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-full backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-400" />
                    <span className="text-[10px] md:text-xs font-semibold text-yellow-400 uppercase tracking-wider">Recomendado</span>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="p-2 md:p-3 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Crown className="w-5 h-5 md:w-7 md:h-7 text-foreground" />
                    </div>
                    <div className="flex-1 pt-0.5 md:pt-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <h3 className="text-base md:text-xl font-display font-bold text-foreground uppercase tracking-tight">
                          Crear Cuenta
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 leading-relaxed">
                        Únete al club y accede a beneficios exclusivos
                      </p>
                      
                      {/* Lista de Beneficios - Compacta en mobile */}
                      <div className="space-y-1.5 md:space-y-2.5">
                        <div className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground" />
                          </div>
                          <span className="text-foreground/90 leading-snug">Gestiona todos tus eventos en un solo lugar</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground" />
                          </div>
                          <span className="text-foreground/90 leading-snug">Acceso a eventos exclusivos para miembros</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground" />
                          </div>
                          <span className="text-foreground/90 leading-snug">Descuentos especiales y cupones exclusivos</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground" />
                          </div>
                          <span className="text-foreground/90 leading-snug">Historial completo de tus participaciones</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-2.5 text-xs md:text-sm">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground" />
                          </div>
                          <span className="text-foreground/90 leading-snug">Comunidad activa de corredores</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-foreground/10">
                    <span className="text-[10px] md:text-xs text-muted-foreground">Gratis y sin compromiso</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>

              {/* Opción Secundaria: Registro Rápido */}
              <button
                onClick={() => setMode('guest')}
                className="w-full p-4 md:p-5 border border-border/50 rounded-lg hover:border-border transition-all duration-200 text-left group bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-2.5 bg-background rounded-lg group-hover:bg-foreground/5 transition-colors flex-shrink-0">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-display font-medium text-foreground/80 mb-0.5">
                      Registro Rápido
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sin cuenta. Solo nombre y contacto.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground/60 transition-colors flex-shrink-0" />
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

