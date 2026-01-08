-- =====================================================
-- TRIGGER: Crear Perfil Automáticamente al Confirmar Email
-- =====================================================
-- Este trigger crea automáticamente un perfil en la tabla
-- 'members' cuando un usuario confirma su email en auth.users
-- =====================================================

-- 1. Crear función que se ejecutará cuando se confirme un email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en la tabla members solo si no existe ya
  INSERT INTO public.members (
    id,
    email,
    full_name,
    phone,
    instagram,
    membership_type,
    membership_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'instagram',
    'regular',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear trigger que se ejecuta cuando se confirma un email
-- (cuando email_confirmed_at cambia de NULL a un timestamp)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- 3. También crear perfil para usuarios que ya están confirmados
-- (por si acaso hay usuarios que se crearon antes del trigger)
INSERT INTO public.members (
  id,
  email,
  full_name,
  phone,
  instagram,
  membership_type,
  membership_status
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'instagram',
  'regular',
  'active'
FROM auth.users au
WHERE au.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.members m WHERE m.id = au.id
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el trigger se creó
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_confirmed';

-- =====================================================
-- NOTAS
-- =====================================================
-- 
-- 1. Este trigger se ejecuta AUTOMÁTICAMENTE cuando:
--    - Un usuario confirma su email (email_confirmed_at cambia de NULL a timestamp)
--
-- 2. La función usa SECURITY DEFINER para poder insertar
--    sin problemas de RLS (porque se ejecuta como el creador de la función)
--
-- 3. ON CONFLICT DO NOTHING previene errores si el perfil ya existe
--
-- 4. El trigger también crea perfiles para usuarios que ya estaban confirmados
--    antes de crear el trigger
--
-- =====================================================


