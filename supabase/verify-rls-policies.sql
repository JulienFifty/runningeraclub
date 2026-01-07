-- =====================================================
-- Script de Verificación de Políticas RLS
-- =====================================================
-- Este script verifica que todas las tablas importantes
-- tengan RLS habilitado y políticas correctas
-- =====================================================

-- 1. Verificar que RLS está habilitado en todas las tablas importantes
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS DESHABILITADO - REQUIERE ATENCIÓN'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'event_registrations',
    'payment_transactions',
    'coupons',
    'coupon_usage',
    'attendees',
    'events',
    'admins'
  )
ORDER BY tablename;

-- 2. Listar todas las políticas RLS por tabla
SELECT 
  'Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation, -- SELECT, INSERT, UPDATE, DELETE, ALL
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Inserción'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
    WHEN cmd = 'ALL' THEN 'Todas las operaciones'
    ELSE cmd::text
  END as operation_spanish,
  CASE 
    WHEN qual IS NOT NULL AND qual != '' THEN '✅ Tiene restricción (USING)'
    ELSE '⚠️ Sin restricción'
  END as has_using_clause,
  CASE 
    WHEN with_check IS NOT NULL AND with_check != '' THEN '✅ Tiene validación (WITH CHECK)'
    ELSE '⚠️ Sin validación'
  END as has_with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'event_registrations',
    'payment_transactions',
    'coupons',
    'coupon_usage',
    'attendees',
    'events',
    'admins'
  )
ORDER BY tablename, cmd, policyname;

-- 3. Verificar políticas críticas faltantes
-- Esta query identifica combinaciones de tabla/operación que podrían necesitar políticas

WITH expected_policies AS (
  SELECT tablename, cmd
  FROM (VALUES 
    ('members', 'SELECT'),
    ('members', 'INSERT'),
    ('members', 'UPDATE'),
    ('members', 'DELETE'),
    ('event_registrations', 'SELECT'),
    ('event_registrations', 'INSERT'),
    ('event_registrations', 'UPDATE'),
    ('payment_transactions', 'SELECT'),
    ('coupons', 'SELECT'),
    ('coupons', 'INSERT'),
    ('coupons', 'UPDATE'),
    ('coupon_usage', 'SELECT'),
    ('attendees', 'SELECT'),
    ('attendees', 'INSERT'),
    ('attendees', 'UPDATE')
  ) AS t(tablename, cmd)
  WHERE tablename IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
  )
),
existing_policies AS (
  SELECT DISTINCT tablename, 
    CASE 
      WHEN cmd = 'ALL' THEN 'SELECT'
      ELSE cmd
    END as cmd
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  'Missing Policies' as check_type,
  ep.tablename,
  ep.cmd as missing_operation,
  '⚠️ Falta política para: ' || ep.cmd as status
FROM expected_policies ep
LEFT JOIN existing_policies ex 
  ON ep.tablename = ex.tablename 
  AND ep.cmd = ex.cmd
WHERE ex.tablename IS NULL
ORDER BY ep.tablename, ep.cmd;

-- 4. Verificar que las políticas de usuario usan auth.uid() correctamente
SELECT 
  'Policy Validation' as check_type,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✅ Usa auth.uid()'
    ELSE '⚠️ No usa auth.uid() - revisar'
  END as uses_auth_uid,
  CASE 
    WHEN policyname LIKE '%own%' OR policyname LIKE '%Members can%' THEN
      CASE 
        WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '✅ Correcto'
        ELSE '❌ INCORRECTO - Debería usar auth.uid()'
      END
    ELSE 'N/A'
  END as validation_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('members', 'event_registrations', 'payment_transactions')
  AND (policyname LIKE '%own%' OR policyname LIKE '%Members can%' OR policyname LIKE '%Users can%')
ORDER BY tablename, policyname;

-- 5. Verificar políticas que podrían ser demasiado permisivas
SELECT 
  'Overly Permissive Policies' as check_type,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '❌ PELIGROSO - Permite todo'
    WHEN qual IS NULL AND with_check IS NULL THEN '⚠️ Sin restricciones'
    ELSE '✅ Tiene restricciones'
  END as security_level,
  qual as restriction_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'event_registrations',
    'payment_transactions',
    'coupons',
    'coupon_usage',
    'attendees'
  )
  AND (qual = 'true' OR with_check = 'true' OR qual IS NULL)
ORDER BY tablename, policyname;

-- 6. Resumen de políticas por tabla
SELECT 
  'Summary' as check_type,
  tablename,
  COUNT(*) as total_policies,
  COUNT(DISTINCT cmd) as distinct_operations,
  STRING_AGG(DISTINCT cmd::text, ', ' ORDER BY cmd::text) as operations_covered,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Bien protegido'
    WHEN COUNT(*) >= 2 THEN '⚠️ Parcialmente protegido'
    ELSE '❌ Poco protegido'
  END as protection_level
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'event_registrations',
    'payment_transactions',
    'coupons',
    'coupon_usage',
    'attendees',
    'events',
    'admins'
  )
GROUP BY tablename
ORDER BY tablename;

