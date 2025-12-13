-- Tabla de miembros (perfil extendido)
CREATE TABLE IF NOT EXISTS members (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  membership_type TEXT DEFAULT 'regular' CHECK (membership_type IN ('regular', 'premium', 'vip')),
  membership_start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended')),
  profile_image TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de registros de eventos (miembros registrados en eventos)
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT,
  UNIQUE(member_id, event_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_member ON event_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Trigger para actualizar updated_at en members
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas para members
-- Los miembros solo pueden ver y editar su propio perfil
CREATE POLICY "Members can view own profile" ON members
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Members can update own profile" ON members
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Members can insert own profile" ON members
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Los administradores pueden ver todos los miembros
CREATE POLICY "Admins can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Políticas para event_registrations
-- Los miembros pueden ver sus propios registros
CREATE POLICY "Members can view own registrations" ON event_registrations
  FOR SELECT USING (auth.uid() = member_id);

-- Los miembros pueden crear sus propios registros
CREATE POLICY "Members can create own registrations" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Los miembros pueden actualizar sus propios registros
CREATE POLICY "Members can update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid() = member_id);

-- Los administradores pueden ver todos los registros
CREATE POLICY "Admins can view all registrations" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Los administradores pueden gestionar todos los registros
CREATE POLICY "Admins can manage all registrations" ON event_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

