-- Arreglar el constraint de status en event_registrations
-- El problema: el constraint no incluye 'pending'

-- Eliminar el constraint viejo
ALTER TABLE event_registrations
DROP CONSTRAINT IF EXISTS event_registrations_status_check;

-- Crear el nuevo constraint con 'pending' incluido
ALTER TABLE event_registrations
ADD CONSTRAINT event_registrations_status_check
CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended', 'no_show', 'pending'));

-- Verificar que funcionó
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'event_registrations_status_check';



