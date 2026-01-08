"use client";

import { useState } from 'react';
import { X, Calendar, Info, AlertCircle, CheckCircle2, Percent, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

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
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-display font-light tracking-tight">
            Cancelar Registro
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Confirma si deseas cancelar tu registro a este evento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Event Info - Modern Design */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5">
            <div className="relative z-10">
              <h3 className="font-display text-xl font-semibold text-foreground mb-3 leading-tight">
                {registration.event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium">{formatEventDate(registration.event.date)}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Refund Policy - Modern Design */}
          {hasPayment && (
            <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-1">Política de Reembolso</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    El reembolso se calcula según los días restantes hasta el evento
                  </p>
                  
                  {/* Current Refund Status */}
                  <div className={`mb-4 p-4 rounded-lg border ${
                    refundPolicy.percentage === 100 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : refundPolicy.percentage === 50
                        ? 'bg-orange-500/10 border-orange-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      {refundPolicy.percentage === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : refundPolicy.percentage === 50 ? (
                        <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm mb-1 ${
                          refundPolicy.percentage === 100 
                            ? 'text-green-600' 
                            : refundPolicy.percentage === 50
                              ? 'text-orange-600'
                              : 'text-red-600'
                        }`}>
                          {refundPolicy.percentage === 100 
                            ? 'Reembolso completo disponible' 
                            : refundPolicy.percentage === 50
                              ? 'Reembolso parcial disponible'
                              : 'No hay reembolso disponible'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {refundPolicy.days > 0 
                            ? `Quedan ${refundPolicy.days} ${refundPolicy.days === 1 ? 'día' : 'días'} hasta el evento`
                            : 'El evento es muy pronto'}
                        </p>
                      </div>
                      {refundPolicy.percentage > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-background rounded-full border border-border">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span className="text-lg font-bold text-foreground">{refundPolicy.percentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refund Rules - Modern List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium">Más de 7 días</p>
                        <p className="text-xs text-muted-foreground">Reembolso del 100%</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600">100%</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium">3-7 días</p>
                        <p className="text-xs text-muted-foreground">Reembolso del 50%</p>
                      </div>
                      <span className="text-xs font-semibold text-orange-600">50%</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium">Menos de 3 días</p>
                        <p className="text-xs text-muted-foreground">No reembolsable</p>
                      </div>
                      <span className="text-xs font-semibold text-red-600">0%</span>
                    </div>
                  </div>

                  {/* Refund Amount */}
                  {refundPolicy.percentage > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Reembolso estimado</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(price) ? `$${refundAmount.toFixed(2)}` : 'Monto correspondiente'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se procesará en 5-10 días hábiles a tu método de pago original
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!hasPayment && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Evento Gratuito</p>
                  <p className="text-xs text-muted-foreground">
                    Este evento es gratuito. Tu registro se cancelará sin costo adicional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Acción Irreversible</p>
                <p className="text-xs text-muted-foreground">
                  Esta acción no se puede deshacer. Tu cupo será liberado inmediatamente para otros participantes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelling}
            className="sm:min-w-[140px]"
          >
            Mantener registro
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
              'Confirmar cancelación'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
