-- Función helper para obtener el email del usuario autenticado (si no existe)
CREATE OR REPLACE FUNCTION public.auth_user_email()
RETURNS text AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Tabla de asistentes a eventos (check-in)
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tickets INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked_in')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  event_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Agregar foreign key a events solo si la tabla events existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    -- Eliminar constraint si ya existe
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'attendees_event_id_fkey' 
      AND table_name = 'attendees'
    ) THEN
      ALTER TABLE attendees DROP CONSTRAINT attendees_event_id_fkey;
    END IF;
    
    -- Crear la foreign key
    ALTER TABLE attendees 
    ADD CONSTRAINT attendees_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON attendees(status);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees(name);

-- Trigger para actualizar updated_at (eliminar si existe primero)
DROP TRIGGER IF EXISTS update_attendees_updated_at ON attendees;
CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Políticas para attendees (solo si la tabla admins existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
    -- Los administradores pueden ver y gestionar todos los asistentes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendees' AND policyname = 'Admins can view all attendees') THEN
      EXECUTE 'CREATE POLICY "Admins can view all attendees" ON attendees
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM admins WHERE email = public.auth_user_email()
          )
        )';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendees' AND policyname = 'Admins can manage all attendees') THEN
      EXECUTE 'CREATE POLICY "Admins can manage all attendees" ON attendees
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM admins WHERE email = public.auth_user_email()
          )
        )';
    END IF;
  ELSE
    -- Si no existe la tabla admins, permitir todo (solo para desarrollo)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendees' AND policyname = 'Allow all for development') THEN
      EXECUTE 'CREATE POLICY "Allow all for development" ON attendees FOR ALL USING (true)';
    END IF;
  END IF;

  -- Permitir inserción pública (para importación desde admin)
  -- En producción, esto debería estar protegido
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendees' AND policyname = 'Allow insert for authenticated users') THEN
    EXECUTE 'CREATE POLICY "Allow insert for authenticated users" ON attendees
      FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

