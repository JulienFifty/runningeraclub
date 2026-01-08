-- Agregar campo notes a la tabla attendees si no existe
ALTER TABLE attendees
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN attendees.notes IS 'Notas adicionales sobre el registro (ej: Staff, Cortesía, etc.)';

