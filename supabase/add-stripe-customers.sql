-- Agregar campo stripe_customer_id a la tabla members
ALTER TABLE members
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Agregar campo stripe_customer_id a la tabla attendees (para invitados recurrentes)
ALTER TABLE attendees
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_members_stripe_customer ON members(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendees_stripe_customer ON attendees(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN members.stripe_customer_id IS 'ID del cliente en Stripe para vincular todos los pagos';
COMMENT ON COLUMN attendees.stripe_customer_id IS 'ID del cliente en Stripe para invitados recurrentes';



