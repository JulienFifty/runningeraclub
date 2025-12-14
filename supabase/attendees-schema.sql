-- Tabla de asistentes a eventos (check-in)
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tickets INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked_in')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON attendees(status);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees(name);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Políticas para attendees
-- Los administradores pueden ver y gestionar todos los asistentes
CREATE POLICY "Admins can view all attendees" ON attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

CREATE POLICY "Admins can manage all attendees" ON attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = auth_user_email()
    )
  );

-- Permitir inserción pública (para importación desde admin)
-- En producción, esto debería estar protegido
CREATE POLICY "Allow insert for authenticated users" ON attendees
  FOR INSERT WITH CHECK (true);

