"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Power, PowerOff } from 'lucide-react';

interface StravaConnectButtonProps {
  isConnected: boolean;
  athleteData?: {
    username?: string;
    firstname?: string;
    lastname?: string;
  };
  onConnectionChange?: () => void;
}

export function StravaConnectButton({ 
  isConnected, 
  athleteData,
  onConnectionChange 
}: StravaConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleConnect = async () => {
    try {
      setLoading(true);

      // Obtener el member_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Debes estar autenticado');
        return;
      }

      // Redirigir a nuestra API de auth que luego redirige a Strava
      window.location.href = `/api/strava/auth?member_id=${user.id}`;
    } catch (error: any) {
      console.error('Error connecting Strava:', error);
      toast.error('Error al conectar con Strava');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar tu cuenta de Strava?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/strava/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al desconectar');
      }

      toast.success('Strava desconectado exitosamente');
      
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error: any) {
      console.error('Error disconnecting Strava:', error);
      toast.error('Error al desconectar Strava');
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-[#FC4C02]/10 border border-[#FC4C02]/20 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-[#FC4C02] flex items-center justify-center">
            <Power className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Conectado a Strava
            </p>
            {athleteData && (
              <p className="text-xs text-muted-foreground">
                {athleteData.firstname} {athleteData.lastname}
                {athleteData.username && ` (@${athleteData.username})`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="w-full px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <PowerOff className="w-4 h-4" />
          {loading ? 'Desconectando...' : 'Desconectar Strava'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        disabled
        className="w-full px-6 py-3 bg-[#FC4C02]/50 text-white rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-3 font-medium"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
        </svg>
        Próximamente
      </button>
      <p className="text-xs text-muted-foreground text-center">
        La integración con Strava estará disponible pronto
      </p>
    </div>
  );
}

