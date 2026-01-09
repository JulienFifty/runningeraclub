"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationPermissionButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export function NotificationPermissionButton({
  className,
  variant = 'outline',
  size = 'default',
}: NotificationPermissionButtonProps) {
  // Hooks deben estar siempre al inicio, no dentro de try-catch
  const hookResult = usePushNotifications();
  const { 
    isSupported = false, 
    isSubscribed = false, 
    isLoading = true, 
    subscribe, 
    unsubscribe, 
    isIOS = false, 
    isStandalone = false 
  } = hookResult || {};
  
  const [isToggling, setIsToggling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Debug: Log para verificar soporte (solo en desarrollo)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        console.log('[NotificationButton] Debug:', {
          isSupported,
          isLoading,
          isSubscribed,
          isIOS,
          isStandalone,
          hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
          hasPushManager: typeof window !== 'undefined' && 'PushManager' in window,
          notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unavailable',
        });
      } catch (error) {
        console.error('[NotificationButton] Error en debug:', error);
      }
    }
  }, [isSupported, isLoading, isSubscribed, isIOS, isStandalone]);

  if (!isSupported) {
    // En iOS sin PWA, mostrar instrucciones
    if (isIOS && !isStandalone) {
      return (
        <div className="relative">
          <Button
            variant={variant}
            size={size}
            className={cn('gap-2', className)}
            onClick={() => setShowIOSInstructions(!showIOSInstructions)}
            type="button"
          >
            <BellOff className="w-4 h-4" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">Instalar</span>
          </Button>
          {showIOSInstructions && (
            <div className="absolute z-50 mt-2 p-4 bg-card border border-border rounded-lg shadow-lg max-w-xs right-0">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Instalar App para Notificaciones</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abre en Safari (no Chrome)</li>
                  <li>Toca el botón de compartir</li>
                  <li>Selecciona "Añadir a pantalla de inicio"</li>
                  <li>Abre la app desde tu pantalla de inicio</li>
                </ol>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="text-xs text-foreground underline mt-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Otros casos, mostrar botón deshabilitado
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2 opacity-50 cursor-not-allowed', className)}
        disabled
        type="button"
      >
        <BellOff className="w-4 h-4" />
        <span className="hidden sm:inline">No Soportado</span>
        <span className="sm:hidden">No Soportado</span>
      </Button>
    );
  }

  const handleToggle = async () => {
    if (isLoading || isToggling) {
      return; // No hacer nada si está cargando o procesando
    }
    
    if (!subscribe || !unsubscribe) {
      console.error('[NotificationButton] subscribe o unsubscribe no están disponibles');
      return;
    }
    
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleToggle}
        disabled={isToggling}
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
        type="button"
      >
      {isToggling ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : isSubscribed ? (
        <>
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Desactivar Notificaciones</span>
          <span className="sm:hidden">Desactivar</span>
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          <span className="hidden sm:inline">Activar Notificaciones</span>
          <span className="sm:hidden">Activar</span>
        </>
      )}
    </Button>
    </div>
  );
}

