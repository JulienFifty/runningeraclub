-- ⚠️ CRÍTICO: Agregar columnas de Stripe a event_registrations
-- Sin estas columnas, el webhook de Stripe NO puede actualizar el estado del pago

-- 1. Agregar columnas necesarias para Stripe
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. Agregar columna de Instagram a members (si aún no existe)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- 3. Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_stripe_pi ON event_registrations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_stripe_session ON event_registrations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_members_instagram ON members(instagram);

-- 4. Agregar comentarios para documentación
COMMENT ON COLUMN event_registrations.stripe_payment_intent_id IS 'ID del PaymentIntent de Stripe';
COMMENT ON COLUMN event_registrations.stripe_session_id IS 'ID de la sesión de checkout de Stripe';
COMMENT ON COLUMN event_registrations.amount_paid IS 'Monto pagado en la moneda especificada';
COMMENT ON COLUMN event_registrations.currency IS 'Moneda del pago (ej: mxn, usd)';
COMMENT ON COLUMN event_registrations.payment_method IS 'Método de pago utilizado (card, oxxo, etc)';
COMMENT ON COLUMN members.instagram IS 'Usuario de Instagram del miembro (sin @)';

-- 5. Verificar que todo se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_registrations' 
  AND column_name IN (
    'payment_status',
    'stripe_payment_intent_id',
    'stripe_session_id',
    'amount_paid',
    'currency',
    'payment_method'
  )
ORDER BY column_name;

-- Debería mostrar estas 6 columnas:
-- - amount_paid (numeric)
-- - currency (text)
-- - payment_method (text)
-- - payment_status (text)
-- - stripe_payment_intent_id (text)
-- - stripe_session_id (text)

