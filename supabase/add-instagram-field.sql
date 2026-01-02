-- Agregar campo instagram a la tabla members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Crear índice para búsquedas (opcional)
CREATE INDEX IF NOT EXISTS idx_members_instagram ON members(instagram) WHERE instagram IS NOT NULL;

