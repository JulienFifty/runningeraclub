"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { X, ArrowRight, Check, Crown } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(false);

  // Verificar si el evento requiere pago
  const requiresPayment = eventPrice && 
    eventPrice !== '0' && 
    !eventPrice.toLowerCase().includes('gratis') &&
    !eventPrice.toLowerCase().includes('free');

  const handleLoginClick = () => {
    onClose();
    // Pasar información del evento para mantener el contexto después de la confirmación
    const params = new URLSearchParams();
    params.set('signup', 'true'); // Forzar modo de registro
    if (eventSlug) params.set('event_slug', eventSlug);
    if (eventTitle) params.set('event_title', eventTitle);
    
    const url = `/miembros/login?${params.toString()}`;
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
            Registrarse al Evento
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

            {/* Opción: Crear Cuenta / Iniciar Sesión */}
            <button
              onClick={handleLoginClick}
              className="w-full relative overflow-hidden border-2 border-foreground/20 rounded-lg md:rounded-xl hover:border-foreground/40 transition-all duration-300 text-left group bg-gradient-to-br from-foreground/5 to-foreground/10 hover:from-foreground/10 hover:to-foreground/15"
            >
              <div className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="p-2 md:p-3 bg-gradient-to-br from-foreground/10 to-foreground/20 rounded-lg md:rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Crown className="w-5 h-5 md:w-7 md:h-7 text-foreground" />
                  </div>
                  <div className="flex-1 pt-0.5 md:pt-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <h3 className="text-base md:text-xl font-display font-bold text-foreground uppercase tracking-tight">
                        Crear Cuenta o Iniciar Sesión
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
          </div>
        </div>
      </div>
    </div>
  );
}

