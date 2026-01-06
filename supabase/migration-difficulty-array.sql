-- Migración para cambiar difficulty de TEXT a JSONB (array)
-- Ejecuta este script en el SQL Editor de Supabase

-- Paso 1: Eliminar la restricción CHECK antigua
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_difficulty_check;

-- Paso 2: Cambiar el tipo de columna a JSONB
ALTER TABLE events 
ALTER COLUMN difficulty TYPE JSONB 
USING CASE 
  WHEN difficulty IS NULL THEN '[]'::jsonb
  WHEN difficulty = '' THEN '[]'::jsonb
  ELSE jsonb_build_array(difficulty)
END;

-- Paso 3: Establecer valor por defecto
ALTER TABLE events 
ALTER COLUMN difficulty SET DEFAULT '[]'::jsonb;

-- Verificar que los datos se migraron correctamente
SELECT id, title, difficulty FROM events LIMIT 5;






