-- Script para crear políticas RLS para la tabla admins
-- Esto permite que los usuarios autenticados puedan verificar si son admin

-- Eliminar políticas existentes si hay
DROP POLICY IF EXISTS "Users can check if they are admin" ON admins;
DROP POLICY IF EXISTS "Authenticated users can view admins" ON admins;

-- Crear función helper para obtener el email del usuario autenticado (si no existe)
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Política: Los usuarios autenticados pueden verificar si su email está en la tabla admins
-- Esto es necesario para que el login funcione correctamente
CREATE POLICY "Users can check if they are admin" ON admins
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    email = auth_user_email()
  );

-- Alternativa más permisiva (solo para desarrollo):
-- Permite que cualquier usuario autenticado pueda leer la tabla admins
-- (Comentar la política anterior y descomentar esta si la primera no funciona)
-- CREATE POLICY "Authenticated users can view admins" ON admins
--   FOR SELECT USING (auth.uid() IS NOT NULL);



