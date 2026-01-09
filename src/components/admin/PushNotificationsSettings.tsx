"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  setting_key: string;
  enabled: boolean;
  description: string;
}

interface PushNotificationsSettingsProps {
  className?: string;
}

const SETTING_LABELS: Record<string, string> = {
  new_event: 'Nuevos Eventos',
  payment_success: 'Pagos Confirmados',
  event_nearly_full: 'Eventos Casi Llenos',
  free_event_registration: 'Registros Gratuitos',
};

export function PushNotificationsSettings({ className }: PushNotificationsSettingsProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/push-settings', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setSettings(data.settings || []);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Error al cargar configuración', {
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (settingKey: string, enabled: boolean) => {
    try {
      setSaving(settingKey);
      
      const response = await fetch('/api/admin/push-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: settingKey,
          enabled: !enabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar configuración');
      }

      const data = await response.json();
      
      // Actualizar estado local
      setSettings((prev) =>
        prev.map((setting) =>
          setting.setting_key === settingKey
            ? { ...setting, enabled: !enabled }
            : setting
        )
      );

      toast.success('Configuración actualizada', {
        description: `Notificaciones ${!enabled ? 'activadas' : 'desactivadas'}`,
      });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('Error al actualizar configuración', {
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-6 text-center text-muted-foreground flex items-center justify-center gap-2", className)}>
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-sans text-xl font-semibold text-foreground">
              Notificaciones Automáticas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona qué notificaciones se envían automáticamente
            </p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="p-6 space-y-4">
        {settings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay configuraciones disponibles
          </div>
        ) : (
          settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-foreground/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  {setting.enabled ? (
                    <Bell className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <h3 className="font-sans font-semibold text-foreground">
                    {SETTING_LABELS[setting.setting_key] || setting.setting_key}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground ml-8">
                  {setting.description}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {saving === setting.setting_key ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.setting_key, setting.enabled)}
                    disabled={saving !== null}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

