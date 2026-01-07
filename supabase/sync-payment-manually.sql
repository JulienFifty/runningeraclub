-- Script para sincronizar manualmente un pago desde Stripe
-- Úsalo cuando el webhook no actualizó el registro correctamente

-- PASO 1: Obtener el session_id de Stripe
-- Ve a: https://dashboard.stripe.com/payments
-- Busca el pago y copia el "Checkout Session ID"

-- PASO 2: Ejecuta este script reemplazando los valores:
-- - 'SESSION_ID_AQUI': El session_id de Stripe
-- - 'MEMBER_ID_AQUI': El UUID del miembro (puedes obtenerlo de auth.users o members)
-- - 'EVENT_ID_AQUI': El UUID del evento

-- Ejemplo de actualización directa:
UPDATE event_registrations
SET 
  payment_status = 'paid',
  status = 'confirmed',
  stripe_session_id = 'SESSION_ID_AQUI',
  stripe_payment_intent_id = 'PAYMENT_INTENT_ID_AQUI',  -- Obtener de Stripe
  amount_paid = 0,  -- Reemplazar con el monto real
  currency = 'mxn',
  payment_method = 'card'
WHERE 
  member_id = 'MEMBER_ID_AQUI'
  AND event_id = 'EVENT_ID_AQUI';

-- Si el registro no existe, créalo:
INSERT INTO event_registrations (
  member_id,
  event_id,
  status,
  payment_status,
  stripe_session_id,
  stripe_payment_intent_id,
  amount_paid,
  currency,
  payment_method
)
VALUES (
  'MEMBER_ID_AQUI',
  'EVENT_ID_AQUI',
  'confirmed',
  'paid',
  'SESSION_ID_AQUI',
  'PAYMENT_INTENT_ID_AQUI',
  0,  -- Reemplazar con el monto real
  'mxn',
  'card'
)
ON CONFLICT (member_id, event_id) DO UPDATE
SET 
  payment_status = 'paid',
  status = 'confirmed',
  stripe_session_id = EXCLUDED.stripe_session_id,
  stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
  amount_paid = EXCLUDED.amount_paid,
  currency = EXCLUDED.currency,
  payment_method = EXCLUDED.payment_method;

-- Para encontrar el member_id por email:
-- SELECT id FROM auth.users WHERE email = 'julien.thibeaul00@gmail.com';

-- Para encontrar el event_id por slug o título:
-- SELECT id FROM events WHERE slug = 'evento-slug' OR title = 'Título del Evento';

