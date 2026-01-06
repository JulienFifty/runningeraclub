-- Script para limpiar registros pendientes de pago después de 2 horas
-- Esto permite que los usuarios puedan volver a intentar registrarse si no completaron el pago

-- Eliminar registros pendientes de más de 2 horas
DELETE FROM event_registrations
WHERE 
  payment_status = 'pending' 
  AND status = 'pending'
  AND registration_date < NOW() - INTERVAL '2 hours';

-- Para ejecutar esto automáticamente, puedes configurar un CRON job en Supabase:
-- 1. Ve a Database > Extensions y habilita "pg_cron"
-- 2. Luego ejecuta este comando:

/*
SELECT cron.schedule(
  'cleanup-pending-registrations',
  '0 * * * *', -- Cada hora
  $$
  DELETE FROM event_registrations
  WHERE 
    payment_status = 'pending' 
    AND status = 'pending'
    AND registration_date < NOW() - INTERVAL '2 hours';
  $$
);
*/

-- Para ver los CRON jobs configurados:
-- SELECT * FROM cron.job;

-- Para eliminar el CRON job:
-- SELECT cron.unschedule('cleanup-pending-registrations');

