-- Tabla para configurar notificaciones push automáticas
CREATE TABLE IF NOT EXISTS push_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertar configuraciones iniciales
INSERT INTO push_notification_settings (setting_key, enabled, description) VALUES
  ('new_event', true, 'Notificar cuando se crea un nuevo evento'),
  ('payment_success', true, 'Notificar cuando se confirma un pago exitoso'),
  ('event_nearly_full', true, 'Notificar cuando quedan pocos lugares disponibles (10 o menos)'),
  ('free_event_registration', true, 'Notificar cuando se registra a un evento gratuito')
ON CONFLICT (setting_key) DO NOTHING;

-- Índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_push_notification_settings_key ON push_notification_settings(setting_key);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_push_notification_settings_updated_at BEFORE UPDATE ON push_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE push_notification_settings ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden ver y editar configuración
CREATE POLICY "Admins can view push notification settings" ON push_notification_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can update push notification settings" ON push_notification_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can insert push notification settings" ON push_notification_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

