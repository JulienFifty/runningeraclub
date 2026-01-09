"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: null,
  });

  const supabase = createClient();

  // Verificar soporte y permisos
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
        return;
      }

      const permission = Notification.permission;
      setState(prev => ({ ...prev, isSupported: true, permission }));

      // Verificar si ya hay una suscripción
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Verificar si la suscripción existe en el servidor
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: existingSubscription } = await supabase
              .from('push_subscriptions')
              .select('id')
              .eq('user_id', user.id)
              .eq('endpoint', subscription.endpoint)
              .single();

            setState(prev => ({
              ...prev,
              isSubscribed: !!existingSubscription,
              isLoading: false,
            }));
          } else {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSupport();
  }, [supabase]);

  // Convertir clave VAPID de base64 a Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Suscribirse a notificaciones push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error('Tu navegador no soporta notificaciones push');
      return false;
    }

    try {
      // Solicitar permisos si no están otorgados
      if (state.permission === 'default') {
        const permission = await Notification.requestPermission();
        setState(prev => ({ ...prev, permission }));

        if (permission !== 'granted') {
          toast.error('Se necesitan permisos para recibir notificaciones');
          return false;
        }
      } else if (state.permission !== 'granted') {
        toast.error('Los permisos de notificación están denegados');
        return false;
      }

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión para recibir notificaciones');
        return false;
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Obtener clave VAPID pública
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error('Error de configuración: clave VAPID no encontrada');
        return false;
      }

      // Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Enviar suscripción al servidor
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Error al obtener las claves de suscripción');
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
        },
        user_id: user.id,
      };

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }

      setState(prev => ({ ...prev, isSubscribed: true }));
      toast.success('¡Notificaciones activadas!');
      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      toast.error('Error al activar notificaciones', {
        description: error.message || 'Ocurrió un error inesperado',
      });
      return false;
    }
  }, [state.isSupported, state.permission, supabase]);

  // Cancelar suscripción
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Eliminar del servidor
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            user_id: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al eliminar la suscripción');
        }

        // Cancelar suscripción local
        await subscription.unsubscribe();
      }

      setState(prev => ({ ...prev, isSubscribed: false }));
      toast.success('Notificaciones desactivadas');
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Error al desactivar notificaciones', {
        description: error.message || 'Ocurrió un error inesperado',
      });
      return false;
    }
  }, [supabase]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

