-- ============================================
-- Agregar nuevo administrador
-- ============================================
-- IMPORTANTE: Este script solo agrega el email a la tabla admins
-- La contraseña se maneja en Supabase Auth (ver instrucciones abajo)
-- 
-- PASOS COMPLETOS:
-- 
-- 1. CREAR USUARIO EN SUPABASE AUTH (con contraseña):
--    - Ve a Authentication > Users en Supabase Dashboard
--    - Haz clic en "Add user" o "Invite user"
--    - Email: runningeraclub@gmail.com
--    - Contraseña: [la que quieras]
--    - Auto Confirm: ✅ (activado)
--    - Guardar
--
-- 2. AGREGAR A TABLA ADMINS (ejecuta este script):
--    - Ve a SQL Editor en Supabase
--    - Copia y pega este script
--    - Ejecuta el script
--
-- 3. VERIFICAR:
--    - El usuario podrá iniciar sesión en /admin/login
--    - Con el email: runningeraclub@gmail.com
--    - Y la contraseña que configuraste en el paso 1
-- ============================================

-- Agregar el nuevo administrador
INSERT INTO admins (email)
VALUES ('runningeraclub@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Verificar que se agregó correctamente
SELECT 
  id,
  email,
  created_at
FROM admins 
WHERE email = 'runningeraclub@gmail.com';

-- Ver todos los administradores (opcional)
-- SELECT * FROM admins ORDER BY created_at DESC;

