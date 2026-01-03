-- Agregar columnas de Stripe a la tabla event_registrations
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Agregar columnas de Stripe a la tabla attendees
ALTER TABLE attendees
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Crear tabla de transacciones de pago
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'mxn',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_method TEXT,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_event ON payment_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_member ON payment_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_pi ON payment_transactions(stripe_payment_intent_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_transactions
-- Los miembros pueden ver sus propias transacciones
CREATE POLICY "Members can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = member_id);

-- Los administradores pueden ver todas las transacciones
CREATE POLICY "Admins can view all transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Los administradores pueden gestionar todas las transacciones
CREATE POLICY "Admins can manage all transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Comentarios
COMMENT ON TABLE payment_transactions IS 'Tabla de transacciones de pago con Stripe';
COMMENT ON COLUMN payment_transactions.stripe_payment_intent_id IS 'ID del PaymentIntent de Stripe';
COMMENT ON COLUMN payment_transactions.stripe_session_id IS 'ID de la sesión de checkout de Stripe';
COMMENT ON COLUMN payment_transactions.status IS 'Estado del pago';
COMMENT ON COLUMN payment_transactions.refund_reason IS 'Razón del reembolso si aplica';

