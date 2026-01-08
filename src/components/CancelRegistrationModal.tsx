"use client";

import { useState } from 'react';
import { X, AlertTriangle, Calendar, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CancelRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelSuccess: () => void;
  registration: {
    id: string;
    event: {
      title: string;
      date: string;
      price?: string | null;
    };
    payment_status: string;
    registration_date: string;
  };
}

export function CancelRegistrationModal({
  isOpen,
  onClose,
  onCancelSuccess,
  registration,
}: CancelRegistrationModalProps) {
  const [cancelling, setCancelling] = useState(false);

  const calculateRefundPolicy = () => {
    try {
      const eventDate = new Date(registration.event.date);
      const now = new Date();
      const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEvent > 7) {
        return { percentage: 100, days: daysUntilEvent };
      } else if (daysUntilEvent >= 3) {
        return { percentage: 50, days: daysUntilEvent };
      } else {
        return { percentage: 0, days: daysUntilEvent };
      }
    } catch {
      return { percentage: 0, days: 0 };
    }
  };

  const refundPolicy = calculateRefundPolicy();
  const price = registration.event.price;
  const hasPayment = registration.payment_status === 'paid' && price && 
    price.toString().toLowerCase() !== 'gratis' && 
    price.toString().toLowerCase() !== 'free' && 
    price.toString().toLowerCase() !== '0';

  const formatPrice = (priceStr: string | null | undefined) => {
    if (!priceStr) return null;
    const price = priceStr.toString().toLowerCase();
    if (price === 'gratis' || price === 'free' || price === '0') return null;
    if (price.includes('$')) return price;
    return `$${price}`;
  };

  const calculateRefundAmount = () => {
    if (!hasPayment || !price) return 0;
    const priceStr = price.toString().replace(/[^0-9]/g, '');
    const priceNum = parseInt(priceStr);
    if (isNaN(priceNum)) return 0;
    return Math.round((priceNum * refundPolicy.percentage / 100) * 100) / 100;
  };

  const refundAmount = calculateRefundAmount();

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch('/api/members/cancel-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: registration.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al cancelar registro', {
          description: data.details || data.error || 'No se pudo cancelar el registro',
        });
        setCancelling(false);
        return;
      }

      toast.success('Registro cancelado exitosamente', {
        description: refundPolicy.percentage > 0 
          ? `Se reembolsará el ${refundPolicy.percentage}% (${formatPrice(price) ? `$${refundAmount.toFixed(2)}` : 'el monto correspondiente'}) a tu método de pago original en 5-10 días hábiles.`
          : 'Tu registro ha sido cancelado.',
      });

      onCancelSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      toast.error('Error inesperado', {
        description: error.message || 'Ocurrió un error al cancelar el registro',
      });
      setCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Cancelar Registro
          </DialogTitle>
          <DialogDescription className="pt-2">
            ¿Estás seguro de que deseas cancelar tu registro a este evento?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-foreground">{registration.event.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{registration.event.date}</span>
            </div>
          </div>

          {/* Refund Policy */}
          {hasPayment && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-2">Política de Reembolso</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {refundPolicy.days > 7 ? (
                      <p className="text-green-600 font-medium">
                        ✅ Reembolso del 100% - Tienes {refundPolicy.days} días hasta el evento
                      </p>
                    ) : refundPolicy.days >= 3 ? (
                      <p className="text-orange-600 font-medium">
                        ⚠️ Reembolso del 50% - Tienes {refundPolicy.days} días hasta el evento
                      </p>
                    ) : (
                      <p className="text-red-600 font-medium">
                        ❌ Sin reembolso - El evento es en menos de 3 días
                      </p>
                    )}
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li>Más de 7 días antes: 100% reembolsable</li>
                      <li>3-7 días antes: 50% reembolsable</li>
                      <li>Menos de 3 días: No reembolsable</li>
                    </ul>
                  </div>
                </div>
              </div>

              {refundPolicy.percentage > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm font-medium text-foreground">Reembolso estimado:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(price) ? `$${refundAmount.toFixed(2)}` : 'Monto correspondiente'}
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasPayment && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-600">
                Este evento es gratuito. Tu registro se cancelará sin costo adicional.
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <p className="text-sm text-orange-600">
              <strong>Importante:</strong> Esta acción no se puede deshacer. Tu cupo será liberado para otros participantes.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelling}
          >
            No, mantener registro
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
            className="sm:min-w-[140px]"
          >
            {cancelling ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Cancelando...
              </>
            ) : (
              'Sí, cancelar registro'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

