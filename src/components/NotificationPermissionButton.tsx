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
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  // Debug: Log para verificar soporte (solo en desarrollo)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[NotificationButton] Debug:', {
        isSupported,
        isLoading,
        isSubscribed,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        notificationPermission: Notification.permission,
      });
    }
  }, [isSupported, isLoading, isSubscribed]);

  if (!isSupported) {
    // En mobile, mostrar el botón pero deshabilitado para que se vea
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
  );
}

