-- Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  description TEXT,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  min_amount DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de uso de cupones (historial)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_event ON coupons(event_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_member ON coupon_usage(member_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coupons_updated_at_trigger
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Los admins pueden gestionar cupones
CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Usuarios autenticados pueden ver cupones activos
CREATE POLICY "Authenticated users can view active coupons" ON coupons
  FOR SELECT USING (active = true AND auth.uid() IS NOT NULL);

-- Los admins pueden ver todo el uso de cupones
CREATE POLICY "Admins can view coupon usage" ON coupon_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Los miembros pueden ver su propio uso
CREATE POLICY "Members can view own coupon usage" ON coupon_usage
  FOR SELECT USING (auth.uid() = member_id);

-- Comentarios
COMMENT ON TABLE coupons IS 'Cupones de descuento para eventos';
COMMENT ON TABLE coupon_usage IS 'Historial de uso de cupones';
COMMENT ON COLUMN coupons.discount_type IS 'Tipo de descuento: percentage (porcentaje) o fixed (monto fijo)';
COMMENT ON COLUMN coupons.discount_value IS 'Valor del descuento (porcentaje o monto en MXN)';
COMMENT ON COLUMN coupons.usage_limit IS 'Límite de usos (NULL = ilimitado)';
COMMENT ON COLUMN coupons.min_amount IS 'Monto mínimo requerido para aplicar el cupón';
COMMENT ON COLUMN coupons.max_discount IS 'Descuento máximo (para porcentajes)';
COMMENT ON COLUMN coupons.event_id IS 'ID del evento (NULL = aplicable a todos)';





