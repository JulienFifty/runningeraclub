"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  isIOS?: boolean;
  isStandalone?: boolean;
}

export function usePushNotifications() {
  // Detectar si es iOS de forma segura
  const isIOS = typeof window !== 'undefined' && 
    typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  
  // Detectar si está instalado como PWA de forma segura
  const isStandalone = typeof window !== 'undefined' && (() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
      );
    } catch {
      return false;
    }
  })();

  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: null,
    isIOS,
    isStandalone,
  });

  const supabase = createClient();

  // Verificar soporte y permisos
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            isLoading: false,
            isIOS,
            isStandalone,
          }));
          return;
        }

      // En iOS, las notificaciones push solo funcionan si está instalado como PWA
      if (isIOS && !isStandalone) {
        // iOS requiere instalación como PWA para notificaciones push
        let permission: NotificationPermission = 'default';
        try {
          permission = Notification.permission || 'default';
        } catch (e) {
          // Si Notification no está disponible, usar default
          console.warn('[PushNotifications] Notification API no disponible:', e);
        }
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          isLoading: false,
          permission,
          isIOS,
          isStandalone,
        }));
        return;
      }

      // Verificar soporte de forma segura
      const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
      const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
      
      if (!hasServiceWorker || !hasPushManager) {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          isLoading: false,
          isIOS,
          isStandalone,
        }));
        return;
      }

      // Obtener permisos de forma segura
      let permission: NotificationPermission = 'default';
      try {
        permission = Notification.permission || 'default';
      } catch (e) {
        console.warn('[PushNotifications] Error obteniendo permisos:', e);
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          isLoading: false,
          permission: 'default',
          isIOS,
          isStandalone,
        }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        isSupported: true, 
        permission,
        isIOS,
        isStandalone,
      }));

      // Verificar si ya hay una suscripción
      try {
        // Verificar que el service worker esté disponible
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
          setState(prev => ({ 
            ...prev, 
            isSubscribed: false, 
            isLoading: false,
            isIOS,
            isStandalone,
          }));
          return;
        }

        // Intentar obtener el service worker, pero no esperar indefinidamente
        let registration: ServiceWorkerRegistration | undefined;
        try {
          // Primero verificar si ya hay un service worker registrado
          registration = await navigator.serviceWorker.getRegistration();
          
          // Si no hay registro, intentar registrar uno nuevo
          if (!registration) {
            registration = await navigator.serviceWorker.register('/sw.js');
          }
          
          // Esperar a que esté listo, pero con timeout
          const readyRegistration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((_, reject) => 
              setTimeout(() => reject(new Error('Service worker timeout')), 5000)
            )
          ]).catch(() => registration) as ServiceWorkerRegistration | undefined; // Si falla, usar el registration que tenemos
          
          if (!readyRegistration) {
            setState(prev => ({ 
              ...prev, 
              isSubscribed: false, 
              isLoading: false,
              isIOS,
              isStandalone,
            }));
            return;
          }
          
          const subscription = await readyRegistration.pushManager.getSubscription();
          
          if (subscription) {
            // Verificar si la suscripción existe en el servidor
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              try {
                const { data: existingSubscription } = await supabase
                  .from('push_subscriptions')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('endpoint', subscription.endpoint)
                  .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores

                setState(prev => ({
                  ...prev,
                  isSubscribed: !!existingSubscription,
                  isLoading: false,
                  isIOS,
                  isStandalone,
                }));
              } catch (dbError) {
                console.error('Error checking subscription in DB:', dbError);
                setState(prev => ({
                  ...prev,
                  isSubscribed: false,
                  isLoading: false,
                  isIOS,
                  isStandalone,
                }));
              }
            } else {
              setState(prev => ({ 
                ...prev, 
                isLoading: false,
                isIOS,
                isStandalone,
              }));
            }
          } else {
            setState(prev => ({ 
              ...prev, 
              isSubscribed: false, 
              isLoading: false,
              isIOS,
              isStandalone,
            }));
          }
        } catch (swError) {
          console.error('Error with service worker:', swError);
          // Si hay error con el service worker, aún permitir que el usuario intente suscribirse
          setState(prev => ({ 
            ...prev, 
            isSubscribed: false, 
            isLoading: false,
            isIOS,
            isStandalone,
          }));
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          isIOS,
          isStandalone,
        }));
      }
      } catch (error) {
        console.error('[PushNotifications] Error en checkSupport:', error);
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          isSubscribed: false,
          isIOS,
          isStandalone,
        }));
      }
    };

    checkSupport();
  }, [supabase, isIOS, isStandalone]);

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
    isIOS,
    isStandalone,
  };
}

