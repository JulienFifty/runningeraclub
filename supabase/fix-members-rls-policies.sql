-- =====================================================
-- FIX: Políticas RLS para tabla members
-- =====================================================
-- Este script corrige las políticas de Row Level Security
-- para permitir que los usuarios creen su propio perfil
-- =====================================================

-- 1. Habilitar RLS en la tabla members (si no está habilitado)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar en conflicto
DROP POLICY IF EXISTS "Users can insert their own profile" ON members;
DROP POLICY IF EXISTS "Users can view their own profile" ON members;
DROP POLICY IF EXISTS "Users can update their own profile" ON members;
DROP POLICY IF EXISTS "Users can delete their own profile" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON members;
DROP POLICY IF EXISTS "Enable update for users based on id" ON members;

-- 3. Crear política para INSERT (permitir que usuarios creen su propio perfil)
CREATE POLICY "Users can insert their own profile"
ON members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Crear política para SELECT (permitir que usuarios vean su propio perfil)
CREATE POLICY "Users can view their own profile"
ON members
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. Crear política para UPDATE (permitir que usuarios actualicen su propio perfil)
CREATE POLICY "Users can update their own profile"
ON members
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Crear política para DELETE (permitir que usuarios eliminen su propio perfil)
CREATE POLICY "Users can delete their own profile"
ON members
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 7. Crear política adicional para permitir lectura pública de perfiles (opcional)
-- Descomenta esto si quieres que cualquier usuario pueda ver perfiles de otros
-- CREATE POLICY "Public profiles are viewable by everyone"
-- ON members
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. Estas políticas permiten que:
--    - Un usuario autenticado pueda crear su propio perfil (id = auth.uid())
--    - Un usuario pueda ver solo su propio perfil
--    - Un usuario pueda actualizar solo su propio perfil
--    - Un usuario pueda eliminar solo su propio perfil
--
-- 2. Si necesitas que otros usuarios (como admins) puedan
--    ver/editar perfiles, necesitarás políticas adicionales
--
-- 3. Para ejecutar este script:
--    - Ve a Supabase Dashboard → SQL Editor
--    - Pega este script
--    - Click en "Run"
--
-- =====================================================


