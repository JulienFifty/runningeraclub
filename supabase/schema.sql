-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT NOT NULL,
  image TEXT NOT NULL,
  button_text TEXT NOT NULL CHECK (button_text IN ('REGÍSTRATE', 'VER EVENTO')),
  category TEXT NOT NULL,
  duration TEXT,
  distance TEXT,
  difficulty JSONB DEFAULT '[]'::jsonb,
  price TEXT,
  max_participants INTEGER,
  requirements JSONB DEFAULT '[]'::jsonb,
  schedule JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de administradores (opcional, para autenticación)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública de eventos
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

-- Política para permitir inserción/actualización/eliminación solo a administradores
-- Nota: Esto requiere autenticación. Por ahora, permitimos todo para desarrollo.
-- En producción, deberías usar políticas basadas en roles de usuario.
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (true);

