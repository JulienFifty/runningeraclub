"use client";

import { useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function RefreshSessionContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    const paymentCancelled = searchParams?.get('payment_cancelled');
    
    // Solo ejecutar una vez
    if (paymentCancelled === 'true' && !hasRefreshed.current) {
      hasRefreshed.current = true;
      
      // Refrescar la sesión cuando el usuario regresa desde Stripe
      const refreshSession = async () => {
        try {
          console.log('🔄 Refrescando sesión después de cancelar pago en Stripe...');
          
          // Primero intentar refrescar la sesión explícitamente
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Error refrescando sesión:', refreshError);
            
            // Si el refresh falla, intentar obtener el usuario directamente
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              console.error('Usuario no autenticado después de regresar de Stripe');
              // No mostrar error inmediatamente, puede ser que las cookies aún no se hayan sincronizado
              // Esperar un momento y verificar de nuevo
              setTimeout(async () => {
                const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
                if (retryError || !retryUser) {
                  toast.error('Sesión expirada', {
                    description: 'Por favor, inicia sesión nuevamente',
                  });
                }
              }, 1000);
            } else {
              console.log('✅ Usuario autenticado después de verificación:', user.id);
            }
          } else if (session?.user) {
            console.log('✅ Sesión refrescada exitosamente:', session.user.id);
          }
          
          // Limpiar el parámetro de la URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        } catch (error) {
          console.error('Error inesperado al refrescar sesión:', error);
          // No mostrar error al usuario, puede ser temporal
        }
      };

      // Ejecutar inmediatamente
      refreshSession();
    }
  }, [searchParams, supabase]);

  return null; // Este componente no renderiza nada
}

export function RefreshSessionOnReturn() {
  return (
    <Suspense fallback={null}>
      <RefreshSessionContent />
    </Suspense>
  );
}

