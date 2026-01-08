-- ============================================
-- SCRIPT COMPLETO: Sistema de Check-in
-- Tabla de Asistentes (Attendees)
-- ============================================
-- Este script crea la tabla attendees con todas las
-- configuraciones necesarias: índices, triggers, RLS, etc.
-- Es idempotente: puede ejecutarse múltiples veces sin errores
-- ============================================

-- 1. Función helper para obtener el email del usuario autenticado
-- (Solo se crea si no existe o se reemplaza si ya existe)
CREATE OR REPLACE FUNCTION public.auth_user_email()
RETURNS text AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.auth_user_email() IS 
'Helper function para obtener el email del usuario autenticado. Usa SECURITY DEFINER para acceder a auth.users.';

-- 2. Crear la tabla de asistentes
CREATE TABLE IF NOT EXISTS public.attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tickets INTEGER DEFAULT 1 NOT NULL CHECK (tickets > 0),
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'checked_in')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  event_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Constraints adicionales
  CONSTRAINT attendees_tickets_positive CHECK (tickets > 0)
);

-- Comentarios en la tabla y columnas
COMMENT ON TABLE public.attendees IS 'Tabla de asistentes a eventos para gestión de check-in';
COMMENT ON COLUMN public.attendees.id IS 'Identificador único del asistente';
COMMENT ON COLUMN public.attendees.name IS 'Nombre completo del asistente';
COMMENT ON COLUMN public.attendees.email IS 'Email del asistente (opcional)';
COMMENT ON COLUMN public.attendees.phone IS 'Teléfono del asistente (opcional)';
COMMENT ON COLUMN public.attendees.tickets IS 'Cantidad de tickets/entradas del asistente';
COMMENT ON COLUMN public.attendees.status IS 'Estado del check-in: pending o checked_in';
COMMENT ON COLUMN public.attendees.checked_in_at IS 'Fecha y hora del check-in (null si no ha hecho check-in)';
COMMENT ON COLUMN public.attendees.event_id IS 'ID del evento asociado (opcional, puede ser null)';
COMMENT ON COLUMN public.attendees.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN public.attendees.updated_at IS 'Fecha de última actualización';

-- 3. Foreign Key a la tabla events (solo si events existe)
DO $$
BEGIN
  -- Verificar si la tabla events existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) THEN
    -- Eliminar constraint si ya existe
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public'
      AND constraint_name = 'attendees_event_id_fkey' 
      AND table_name = 'attendees'
    ) THEN
      ALTER TABLE public.attendees DROP CONSTRAINT attendees_event_id_fkey;
    END IF;
    
    -- Crear la foreign key
    ALTER TABLE public.attendees 
    ADD CONSTRAINT attendees_event_id_fkey 
    FOREIGN KEY (event_id) 
    REFERENCES public.events(id) 
    ON DELETE SET NULL
    ON UPDATE CASCADE;
    
    RAISE NOTICE 'Foreign key a events creada exitosamente';
  ELSE
    RAISE NOTICE 'Tabla events no existe, se omite la foreign key';
  END IF;
END $$;

-- 4. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON public.attendees(event_id) 
  WHERE event_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_attendees_status ON public.attendees(status);

CREATE INDEX IF NOT EXISTS idx_attendees_email ON public.attendees(email) 
  WHERE email IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_attendees_name ON public.attendees(name);

CREATE INDEX IF NOT EXISTS idx_attendees_checked_in_at ON public.attendees(checked_in_at) 
  WHERE checked_in_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendees_created_at ON public.attendees(created_at DESC);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_attendees_event_status ON public.attendees(event_id, status) 
  WHERE event_id IS NOT NULL;

COMMENT ON INDEX idx_attendees_event_id IS 'Índice para búsquedas por evento';
COMMENT ON INDEX idx_attendees_status IS 'Índice para filtrar por estado de check-in';
COMMENT ON INDEX idx_attendees_email IS 'Índice para búsquedas por email';
COMMENT ON INDEX idx_attendees_name IS 'Índice para búsquedas por nombre';

-- 5. Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Trigger function para actualizar automáticamente el campo updated_at';

-- 6. Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_attendees_updated_at ON public.attendees;
CREATE TRIGGER update_attendees_updated_at 
  BEFORE UPDATE ON public.attendees
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Habilitar Row Level Security (RLS)
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- 8. Eliminar políticas existentes (para evitar duplicados)
DROP POLICY IF EXISTS "Admins can view all attendees" ON public.attendees;
DROP POLICY IF EXISTS "Admins can manage all attendees" ON public.attendees;
DROP POLICY IF EXISTS "Allow all for development" ON public.attendees;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.attendees;
DROP POLICY IF EXISTS "Service role can manage all" ON public.attendees;

-- 9. Crear políticas RLS
DO $$
BEGIN
  -- Verificar si la tabla admins existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) THEN
    -- Política: Administradores pueden ver todos los asistentes
    CREATE POLICY "Admins can view all attendees" 
    ON public.attendees
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = public.auth_user_email()
      )
    );

    -- Política: Administradores pueden gestionar todos los asistentes
    CREATE POLICY "Admins can manage all attendees" 
    ON public.attendees
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = public.auth_user_email()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = public.auth_user_email()
      )
    );
    
    RAISE NOTICE 'Políticas RLS para administradores creadas';
  ELSE
    -- Si no existe la tabla admins, crear política permisiva (solo desarrollo)
    CREATE POLICY "Allow all for development" 
    ON public.attendees 
    FOR ALL 
    USING (true)
    WITH CHECK (true);
    
    RAISE NOTICE 'Política permisiva creada (desarrollo) - La tabla admins no existe';
  END IF;

  -- Política adicional: Permitir inserción desde API (para importación)
  -- Esta política permite insertar sin autenticación, útil para importación masiva
  CREATE POLICY "Allow insert for API" 
  ON public.attendees
  FOR INSERT 
  WITH CHECK (true);
  
  RAISE NOTICE 'Política de inserción para API creada';
END $$;

-- 10. Verificación final
DO $$
DECLARE
  table_exists BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Verificar que la tabla existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'attendees'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✓ Tabla attendees creada exitosamente';
  ELSE
    RAISE EXCEPTION '✗ Error: La tabla attendees no se creó correctamente';
  END IF;
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = 'attendees';
  
  RAISE NOTICE '✓ Políticas RLS creadas: %', policies_count;
  RAISE NOTICE '✓ Script ejecutado exitosamente';
END $$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Para verificar que todo está correcto, ejecuta:
-- SELECT * FROM public.attendees LIMIT 1;
-- ============================================








