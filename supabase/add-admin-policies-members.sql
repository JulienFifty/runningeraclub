-- =====================================================
-- Agregar Políticas para Admins Gestionar Miembros
-- =====================================================
-- Este script agrega políticas RLS faltantes para que
-- los administradores puedan gestionar completamente
-- los perfiles de miembros
-- =====================================================

-- Verificar que la tabla admins existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins') THEN
    RAISE EXCEPTION 'La tabla admins no existe. Crea primero la tabla admins.';
  END IF;
END $$;

-- Eliminar política existente si existe (para recrearla)
DROP POLICY IF EXISTS "Admins can manage all members" ON members;

-- Crear política para que admins puedan gestionar todos los miembros
CREATE POLICY "Admins can manage all members" ON members
  FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Verificar que se creó correctamente
SELECT 
  '✅ Política creada' as status,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'members'
  AND policyname = 'Admins can manage all members';

-- Comentario
COMMENT ON POLICY "Admins can manage all members" ON members IS 
  'Permite que los administradores gestionen completamente (ver, crear, actualizar, eliminar) todos los perfiles de miembros';

