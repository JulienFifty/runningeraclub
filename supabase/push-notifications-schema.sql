-- Tabla para guardar suscripciones de notificaciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(endpoint)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias suscripciones
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias suscripciones
CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias suscripciones
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Política: Los administradores pueden ver todas las suscripciones
CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

