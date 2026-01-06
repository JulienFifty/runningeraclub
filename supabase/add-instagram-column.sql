-- Agregar columna de Instagram a la tabla members
ALTER TABLE members ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Crear índice para búsquedas por Instagram (opcional)
CREATE INDEX IF NOT EXISTS idx_members_instagram ON members(instagram);

-- Comentario para documentar
COMMENT ON COLUMN members.instagram IS 'Usuario de Instagram del miembro (sin @)';

