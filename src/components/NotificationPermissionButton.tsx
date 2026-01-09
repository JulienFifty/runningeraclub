"use client";

import { useState } from 'react';
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

  if (!isSupported) {
    return null; // No mostrar si no está soportado
  }

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading || isToggling}
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
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

