-- Agregar columnas de pago a event_registrations
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_stripe_pi ON event_registrations(stripe_payment_intent_id);

