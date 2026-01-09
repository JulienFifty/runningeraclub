-- ============================================
-- SCRIPT: Corregir Políticas RLS de push_subscriptions
-- ============================================
-- Ejecuta este script para corregir el error "permission denied for table users"
-- en las notificaciones push

-- Paso 1: Crear función helper para obtener email del usuario autenticado (si no existe)
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Paso 2: Eliminar políticas antiguas que puedan tener problemas
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all push subscriptions" ON push_subscriptions;

-- Paso 3: Recrear políticas usando la función helper
-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios solo pueden crear suscripciones para ellos mismos
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propias suscripciones
CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propias suscripciones
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Los administradores pueden ver todas las suscripciones usando la función helper
CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth_user_email()
    )
  );

-- Los administradores pueden gestionar todas las suscripciones (para enviar notificaciones)
CREATE POLICY "Admins can manage all push subscriptions" ON push_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth_user_email()
    )
  );

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'push_subscriptions';

