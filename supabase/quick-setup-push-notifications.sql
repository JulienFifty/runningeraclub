-- ============================================
-- SCRIPT RÁPIDO: Configurar Notificaciones Push
-- ============================================
-- Ejecuta este script completo en el SQL Editor de Supabase
-- Ve a: Tu Proyecto > SQL Editor > New Query
-- Copia y pega todo este contenido y haz clic en "Run"

-- Paso 1: Crear la función update_updated_at_column (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Paso 2: Crear la tabla push_notification_settings
CREATE TABLE IF NOT EXISTS push_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Paso 3: Crear el índice
CREATE INDEX IF NOT EXISTS idx_push_notification_settings_key ON push_notification_settings(setting_key);

-- Paso 4: Eliminar trigger si existe (para evitar duplicados)
DROP TRIGGER IF EXISTS update_push_notification_settings_updated_at ON push_notification_settings;

-- Paso 5: Crear el trigger
CREATE TRIGGER update_push_notification_settings_updated_at 
    BEFORE UPDATE ON push_notification_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Paso 6: Insertar configuraciones iniciales
INSERT INTO push_notification_settings (setting_key, enabled, description) 
VALUES
  ('new_event', true, 'Notificar cuando se crea un nuevo evento'),
  ('payment_success', true, 'Notificar cuando se confirma un pago exitoso'),
  ('event_nearly_full', true, 'Notificar cuando quedan pocos lugares disponibles (10 o menos)'),
  ('free_event_registration', true, 'Notificar cuando se registra a un evento gratuito')
ON CONFLICT (setting_key) DO NOTHING;

-- Paso 7: Habilitar Row Level Security (RLS)
ALTER TABLE push_notification_settings ENABLE ROW LEVEL SECURITY;

-- Paso 8: Crear función helper para obtener email del usuario autenticado (si no existe)
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Paso 9: Eliminar políticas antiguas si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Admins can view push notification settings" ON push_notification_settings;
DROP POLICY IF EXISTS "Admins can update push notification settings" ON push_notification_settings;
DROP POLICY IF EXISTS "Admins can insert push notification settings" ON push_notification_settings;

-- Paso 10: Crear políticas RLS para administradores usando la función helper
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

-- Paso 11: Verificar que todo se creó correctamente
SELECT 
  setting_key, 
  enabled, 
  description 
FROM push_notification_settings 
ORDER BY setting_key;

-- Si ves 4 filas arriba, ¡todo está configurado correctamente!
-- Las filas deben ser:
-- 1. event_nearly_full
-- 2. free_event_registration
-- 3. new_event
-- 4. payment_success

