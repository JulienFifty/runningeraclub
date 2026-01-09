-- Tabla para configurar notificaciones push automáticas
CREATE TABLE IF NOT EXISTS push_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_push_notification_settings_key ON push_notification_settings(setting_key);

-- Verificar si la función update_updated_at_column existe, si no, crearla
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_push_notification_settings_updated_at ON push_notification_settings;
CREATE TRIGGER update_push_notification_settings_updated_at 
    BEFORE UPDATE ON push_notification_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuraciones iniciales (solo si no existen)
INSERT INTO push_notification_settings (setting_key, enabled, description) 
SELECT * FROM (VALUES
  ('new_event', true, 'Notificar cuando se crea un nuevo evento'),
  ('payment_success', true, 'Notificar cuando se confirma un pago exitoso'),
  ('event_nearly_full', true, 'Notificar cuando quedan pocos lugares disponibles (10 o menos)'),
  ('free_event_registration', true, 'Notificar cuando se registra a un evento gratuito')
) AS v(setting_key, enabled, description)
WHERE NOT EXISTS (
  SELECT 1 FROM push_notification_settings WHERE push_notification_settings.setting_key = v.setting_key
);

-- Crear función helper para obtener email del usuario autenticado (si no existe)
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Habilitar Row Level Security (RLS)
ALTER TABLE push_notification_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Admins can view push notification settings" ON push_notification_settings;
DROP POLICY IF EXISTS "Admins can update push notification settings" ON push_notification_settings;
DROP POLICY IF EXISTS "Admins can insert push notification settings" ON push_notification_settings;

-- Política: Solo administradores pueden ver y editar configuración usando la función helper
CREATE POLICY "Admins can view push notification settings" ON push_notification_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth_user_email()
    )
  );

CREATE POLICY "Admins can update push notification settings" ON push_notification_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth_user_email()
    )
  );

CREATE POLICY "Admins can insert push notification settings" ON push_notification_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth_user_email()
    )
  );

