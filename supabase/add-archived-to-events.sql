-- Agregar campo archived a la tabla events
-- Este campo permite archivar eventos que ya pasaron sin eliminar la información

-- Agregar columna archived (por defecto false para mantener compatibilidad)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL;

-- Crear índice para mejorar consultas de eventos archivados
CREATE INDEX IF NOT EXISTS idx_events_archived ON events(archived);

-- Actualizar eventos pasados a archivados automáticamente (opcional)
-- Comentado para que el admin decida cuándo archivar
-- UPDATE events 
-- SET archived = true 
-- WHERE date < NOW()::date AND archived = false;
