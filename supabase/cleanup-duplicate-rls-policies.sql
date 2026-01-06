-- =====================================================
-- LIMPIEZA: Eliminar Políticas Duplicadas de members
-- =====================================================
-- Este script elimina políticas duplicadas y deja solo
-- las políticas correctas para authenticated users
-- =====================================================

-- 1. Eliminar políticas antiguas con roles: {public}
-- Estas son menos seguras y pueden causar conflictos

DROP POLICY IF EXISTS "Members can insert own profile" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Members can view own profile" ON members;
DROP POLICY IF EXISTS "Admins can view all members" ON members;
DROP POLICY IF EXISTS "Public can view leaderboard member info" ON members;

-- 2. Eliminar las políticas que creamos antes (por si acaso)
DROP POLICY IF EXISTS "Users can insert their own profile" ON members;
DROP POLICY IF EXISTS "Users can view their own profile" ON members;
DROP POLICY IF EXISTS "Users can update their own profile" ON members;
DROP POLICY IF EXISTS "Users can delete their own profile" ON members;

-- 3. Crear políticas limpias y correctas para authenticated users

-- INSERT: Permitir que usuarios autenticados creen su propio perfil
CREATE POLICY "Users can insert their own profile"
ON members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- SELECT: Permitir que usuarios autenticados vean su propio perfil
CREATE POLICY "Users can view their own profile"
ON members
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- UPDATE: Permitir que usuarios autenticados actualicen su propio perfil
CREATE POLICY "Users can update their own profile"
ON members
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Permitir que usuarios autenticados eliminen su propio perfil
CREATE POLICY "Users can delete their own profile"
ON members
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. (OPCIONAL) Si necesitas que los admins puedan ver todos los perfiles
-- Descomenta esto solo si tienes una tabla de admins o un campo is_admin
-- CREATE POLICY "Admins can view all members"
-- ON members
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM members 
--     WHERE id = auth.uid() 
--     AND membership_type = 'admin'
--   )
-- );

-- 5. (OPCIONAL) Si necesitas lectura pública para el leaderboard
-- Descomenta esto solo si necesitas que perfiles sean públicos para el leaderboard
-- CREATE POLICY "Public can view leaderboard member info"
-- ON members
-- FOR SELECT
-- TO public
-- USING (
--   -- Solo campos específicos para leaderboard
--   -- Ajusta según tus necesidades
--   true
-- );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todas las políticas actuales
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY cmd, policyname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Después de ejecutar este script, deberías ver solo 4 políticas:
--
-- 1. Users can insert their own profile    | INSERT | {authenticated}
-- 2. Users can view their own profile      | SELECT | {authenticated}
-- 3. Users can update their own profile    | UPDATE | {authenticated}
-- 4. Users can delete their own profile    | DELETE | {authenticated}
--
-- =====================================================

