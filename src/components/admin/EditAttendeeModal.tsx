"use client";

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Attendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tickets: number;
  notes?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
}

interface EditAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  attendee: Attendee | null;
}

export function EditAttendeeModal({ isOpen, onClose, onSuccess, attendee }: EditAttendeeModalProps) {
  const [formData, setFormData] = useState({
    registrationType: 'regular' as 'regular' | 'staff' | 'cortesia',
    paymentMethod: 'stripe' as 'stripe' | 'cash' | 'transfer',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determinar el tipo de registro actual basado en notes y payment_method
  useEffect(() => {
    if (attendee) {
      if (attendee.notes?.includes('Staff')) {
        setFormData({ registrationType: 'staff', paymentMethod: 'stripe' });
      } else if (attendee.notes?.includes('Cortesía')) {
        setFormData({ registrationType: 'cortesia', paymentMethod: 'stripe' });
      } else {
        // Si es regular, extraer método de pago de notes
        let paymentMethod: 'stripe' | 'cash' | 'transfer' = 'stripe';
        if (attendee.notes?.includes('Efectivo')) {
          paymentMethod = 'cash';
        } else if (attendee.notes?.includes('Transferencia')) {
          paymentMethod = 'transfer';
        } else if (attendee.notes?.includes('Stripe')) {
          paymentMethod = 'stripe';
        } else if ((attendee as any).payment_method) {
          paymentMethod = (attendee as any).payment_method as 'stripe' | 'cash' | 'transfer';
        }
        setFormData({ registrationType: 'regular', paymentMethod });
      }
    }
  }, [attendee]);

  if (!isOpen || !attendee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Determinar payment_status basado en registration_type
      const paymentStatus = (formData.registrationType === 'staff' || formData.registrationType === 'cortesia') 
        ? 'paid' 
        : (formData.registrationType === 'regular' && formData.paymentMethod)
        ? 'paid'
        : null;

      // Determinar notes basado en registration_type y método de pago
      let notes = null;
      if (formData.registrationType === 'staff') {
        notes = 'Staff - Registro manual';
      } else if (formData.registrationType === 'cortesia') {
        notes = 'Cortesía - Registro manual';
      } else if (formData.registrationType === 'regular' && formData.paymentMethod) {
        const paymentMethodLabels: { [key: string]: string } = {
          'stripe': 'Pago en Stripe',
          'cash': 'Pago en Efectivo',
          'transfer': 'Pago por Transferencia',
        };
        notes = `Regular - ${paymentMethodLabels[formData.paymentMethod] || 'Pago manual'}`;
      }

      const response = await fetch(`/api/attendees/${attendee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: paymentStatus,
          payment_method: formData.registrationType === 'regular' ? formData.paymentMethod : null,
          notes: notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Error al actualizar asistente');
      }

      toast.success('Asistente actualizado', {
        description: `El tipo de registro ha sido actualizado`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Error al actualizar asistente', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-foreground/10 rounded-lg">
              <Save className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="font-sans text-xl text-foreground">Editar Asistente</h2>
              <p className="text-sm text-muted-foreground">{attendee.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="registrationType" className="block text-sm font-medium text-foreground mb-2">
              Tipo de Registro
            </label>
            <select
              id="registrationType"
              name="registrationType"
              value={formData.registrationType}
              onChange={(e) => setFormData({ ...formData, registrationType: e.target.value as 'regular' | 'staff' | 'cortesia' })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
            >
              <option value="regular">Regular (Requiere pago)</option>
              <option value="staff">Staff (Sin pago)</option>
              <option value="cortesia">Cortesía (Sin pago)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.registrationType === 'staff' || formData.registrationType === 'cortesia' 
                ? 'Este registro contará en el cupo del evento' 
                : 'El usuario deberá completar el pago'}
            </p>
          </div>

          {/* Método de Pago - Solo visible si es Regular */}
          {formData.registrationType === 'regular' && (
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-foreground mb-2">
                Método de Pago
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod || 'stripe'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'stripe' | 'cash' | 'transfer' })}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
              >
                <option value="stripe">Pago en Stripe</option>
                <option value="cash">Pago en Efectivo</option>
                <option value="transfer">Pago por Transferencia</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

