-- Script para crear el primer usuario admin
-- IMPORTANTE: Este script solo inserta en la tabla admins
-- También necesitas crear el usuario en Supabase Auth (ver instrucciones abajo)

-- Opción 1: Insertar directamente en la tabla admins
-- Reemplaza 'tu@email.com' con tu email real
INSERT INTO admins (email)
VALUES ('tu@email.com')
ON CONFLICT (email) DO NOTHING;

-- Opción 2: Si ya tienes usuarios en auth.users, puedes usar esta función
-- (Ejecuta esto en Supabase SQL Editor)
DO $$
DECLARE
  admin_email TEXT := 'tu@email.com'; -- Cambia por tu email
  user_exists BOOLEAN;
BEGIN
  -- Verificar si el usuario existe en auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = admin_email) INTO user_exists;
  
  IF user_exists THEN
    -- Insertar en tabla admins si el usuario ya existe en auth
    INSERT INTO admins (email)
    VALUES (admin_email)
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Admin creado exitosamente para: %', admin_email;
  ELSE
    RAISE NOTICE 'Usuario no existe en auth.users. Debes crearlo primero desde Supabase Dashboard';
  END IF;
END $$;

-- Verificar que se creó correctamente
SELECT * FROM admins WHERE email = 'tu@email.com';





