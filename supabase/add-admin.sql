-- ============================================
-- Agregar nuevo administrador
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script
-- 4. Ejecuta el script
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

