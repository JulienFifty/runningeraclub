-- =====================================================
-- Verificación de Protección de Datos Sensibles
-- =====================================================
-- Este script verifica que los datos sensibles están
-- correctamente protegidos por RLS
-- =====================================================

-- 1. Verificar que miembros no pueden ver emails de otros
-- Este query debería retornar 0 resultados para cualquier usuario autenticado
-- (ejecutar como usuario de prueba para verificar)
SELECT 
  'Emails expuestos' as check_type,
  COUNT(*) as exposed_emails,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ PELIGRO - Se pueden ver emails de otros usuarios'
    WHEN COUNT(*) = 1 THEN '✅ Solo ve su propio email'
    ELSE '✅ No ve ningún email (no autenticado)'
  END as status
FROM members
WHERE auth.uid() IS NOT NULL; -- Solo si hay usuario autenticado

-- 2. Verificar que miembros no pueden ver teléfonos de otros
SELECT 
  'Teléfonos expuestos' as check_type,
  COUNT(*) as exposed_phones,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ PELIGRO - Se pueden ver teléfonos de otros'
    WHEN COUNT(*) = 1 THEN '✅ Solo ve su propio teléfono'
    ELSE '✅ No ve ningún teléfono (no autenticado)'
  END as status
FROM members
WHERE phone IS NOT NULL
  AND auth.uid() IS NOT NULL;

-- 3. Verificar que miembros no pueden ver transacciones de otros
SELECT 
  'Transacciones expuestas' as check_type,
  COUNT(*) as exposed_transactions,
  CASE 
    WHEN COUNT(*) > (SELECT COUNT(*) FROM payment_transactions WHERE member_id = auth.uid()) THEN
      '❌ PELIGRO - Se pueden ver transacciones de otros'
    ELSE
      '✅ Solo ve sus propias transacciones'
  END as status
FROM payment_transactions
WHERE auth.uid() IS NOT NULL;

-- 4. Verificar que miembros no pueden ver registros de otros
SELECT 
  'Registros expuestos' as check_type,
  COUNT(*) as exposed_registrations,
  CASE 
    WHEN COUNT(*) > (SELECT COUNT(*) FROM event_registrations WHERE member_id = auth.uid()) THEN
      '❌ PELIGRO - Se pueden ver registros de otros'
    ELSE
      '✅ Solo ve sus propios registros'
  END as status
FROM event_registrations
WHERE auth.uid() IS NOT NULL;

-- 5. Verificar que miembros no pueden ver Stripe Customer IDs de otros
SELECT 
  'Stripe Customer IDs expuestos' as check_type,
  COUNT(*) as exposed_customer_ids,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ PELIGRO - Se pueden ver customer IDs de otros'
    WHEN COUNT(*) = 1 THEN '✅ Solo ve su propio customer ID'
    ELSE '✅ No ve ningún customer ID'
  END as status
FROM members
WHERE stripe_customer_id IS NOT NULL
  AND auth.uid() IS NOT NULL;

-- 6. Verificar que miembros no pueden ver Stripe Payment Intent IDs de otros
SELECT 
  'Payment Intent IDs expuestos' as check_type,
  COUNT(*) as exposed_payment_intents,
  CASE 
    WHEN COUNT(*) > (SELECT COUNT(*) FROM event_registrations WHERE member_id = auth.uid()) THEN
      '❌ PELIGRO - Se pueden ver payment intents de otros'
    ELSE
      '✅ Solo ve sus propios payment intents'
  END as status
FROM event_registrations
WHERE stripe_payment_intent_id IS NOT NULL
  AND auth.uid() IS NOT NULL;

-- 7. Verificar que miembros no pueden ver cantidades pagadas de otros
SELECT 
  'Cantidades pagadas expuestas' as check_type,
  COUNT(*) as exposed_amounts,
  CASE 
    WHEN COUNT(*) > (SELECT COUNT(*) FROM event_registrations WHERE member_id = auth.uid()) THEN
      '❌ PELIGRO - Se pueden ver cantidades de otros'
    ELSE
      '✅ Solo ve sus propias cantidades'
  END as status
FROM event_registrations
WHERE amount_paid IS NOT NULL
  AND auth.uid() IS NOT NULL;

-- 8. Verificar que usuarios no-autenticados no pueden ver datos
-- Este query debería retornar 0 resultados si RLS está bien configurado
SELECT 
  'Acceso no autenticado' as check_type,
  (SELECT COUNT(*) FROM members WHERE auth.uid() IS NULL) as members_visible,
  (SELECT COUNT(*) FROM event_registrations WHERE auth.uid() IS NULL) as registrations_visible,
  (SELECT COUNT(*) FROM payment_transactions WHERE auth.uid() IS NULL) as transactions_visible,
  CASE 
    WHEN (SELECT COUNT(*) FROM members WHERE auth.uid() IS NULL) > 0 THEN
      '❌ PELIGRO - Usuarios no autenticados pueden ver miembros'
    WHEN (SELECT COUNT(*) FROM event_registrations WHERE auth.uid() IS NULL) > 0 THEN
      '❌ PELIGRO - Usuarios no autenticados pueden ver registros'
    WHEN (SELECT COUNT(*) FROM payment_transactions WHERE auth.uid() IS NULL) > 0 THEN
      '❌ PELIGRO - Usuarios no autenticados pueden ver transacciones'
    ELSE
      '✅ Usuarios no autenticados no pueden ver datos'
  END as status;

-- 9. Verificar que admins pueden ver todos los datos (si es admin)
SELECT 
  'Acceso de admin' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM admins WHERE email = auth_user_email()) THEN
      '✅ Eres admin - Puedes ver todos los datos'
    ELSE
      'ℹ️ No eres admin - Solo puedes ver tus propios datos'
  END as status;

-- 10. Listar tablas que NO deberían tener acceso público
SELECT 
  'Tablas críticas' as check_type,
  tablename,
  CASE 
    WHEN tablename IN ('members', 'event_registrations', 'payment_transactions', 'coupon_usage', 'attendees') THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = t.tablename 
          AND (qual = 'true' OR with_check = 'true')
          AND roles = '{authenticated}' 
          OR roles = '{anon}'
        ) THEN '❌ PELIGRO - Tiene política muy permisiva'
        ELSE '✅ Políticas restrictivas'
      END
    ELSE 'N/A'
  END as security_status
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('members', 'event_registrations', 'payment_transactions', 'coupon_usage', 'attendees')
ORDER BY tablename;

