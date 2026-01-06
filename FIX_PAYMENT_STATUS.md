# Fix: Problema de Registro sin Pago Completado

## Problema Identificado

Cuando un usuario hace clic en "REGÍSTRATE" para un evento de pago:
1. Se crea un registro en `event_registrations` con `payment_status: 'pending'`
2. Se redirige a Stripe Checkout
3. Si el usuario **no completa el pago** y regresa al sitio
4. El sistema mostraba "Ya estás registrado" aunque no haya pagado

## Causa Raíz

La verificación de registro **no revisaba el `payment_status`**, solo verificaba si existía un registro, sin importar si el pago fue completado o no.

## Solución Implementada

### 1. Modificación en `EventRegistrationButton.tsx`

**Antes:**
```typescript
// Verificaba solo si existe un registro
if (registrationResult.data || attendeeResult.data) {
  setIsRegistered(true);
}
```

**Después:**
```typescript
// Ahora verifica que el pago esté completado o sea evento gratuito
const hasValidRegistration = registrationResult.data && 
  (registrationResult.data.payment_status === 'paid' || 
   !eventPrice || 
   eventPrice.toLowerCase() === 'gratis' || 
   eventPrice === '0');

if (hasValidRegistration || attendeeResult.data) {
  setIsRegistered(true);
}
```

### 2. Modificación en Dashboard (`app/miembros/dashboard/page.tsx`)

**Antes:**
```typescript
// Mostraba TODOS los registros, incluyendo pendientes
const transformedRegistrations = registrationsData.map(...)
  .filter((reg: any) => reg.event);
```

**Después:**
```typescript
// Solo muestra registros con pago completado o eventos gratuitos
const transformedRegistrations = registrationsData
  .map(...)
  .filter((reg: any) => {
    if (!reg.event) return false;
    
    // Verificar si el evento es gratuito
    const price = reg.event.price?.toString().toLowerCase();
    const isFreeEvent = !price || price === 'gratis' || price === '0';
    
    // Solo mostrar si está pagado o es gratuito
    return reg.payment_status === 'paid' || isFreeEvent;
  });
```

### 3. Script de Limpieza Automática (Opcional)

Creado script SQL para eliminar registros pendientes después de 2 horas:

**Archivo:** `supabase/cleanup-pending-registrations.sql`

**Qué hace:**
- Elimina registros con `payment_status = 'pending'` y más de 2 horas de antigüedad
- Esto permite que los usuarios puedan volver a intentar registrarse

**Cómo activarlo (Opcional):**
1. Ve a Supabase → Database → Extensions
2. Habilita "pg_cron"
3. Ejecuta el comando SQL del archivo para programar limpieza automática cada hora

## Flujo Corregido

### Evento de Pago:
1. Usuario hace clic en "REGÍSTRATE"
2. Se crea registro con `payment_status: 'pending'`
3. Se redirige a Stripe Checkout
4. **Escenario A:** Usuario completa el pago
   - Webhook actualiza registro a `payment_status: 'paid'`
   - El sistema lo reconoce como registrado ✅
5. **Escenario B:** Usuario NO completa el pago
   - El registro queda como `pending`
   - El sistema NO lo reconoce como registrado ✅
   - Después de 2 horas, el registro se limpia automáticamente (si activaste el CRON)

### Evento Gratuito:
1. Usuario hace clic en "REGÍSTRATE"
2. Se crea registro con `payment_status: 'paid'` (inmediato)
3. El sistema lo reconoce como registrado ✅

## Archivos Modificados

- ✅ `src/components/EventRegistrationButton.tsx`
- ✅ `app/miembros/dashboard/page.tsx`
- ✅ `supabase/cleanup-pending-registrations.sql` (nuevo)

## Verificación

Para probar que funciona:

1. **Registrarse sin pagar:**
   - Inicia sesión como usuario
   - Intenta registrarte en un evento de pago
   - En Stripe Checkout, haz clic en "Atrás" o cierra la ventana
   - Regresa a la página del evento
   - ✅ Deberías poder volver a hacer clic en "REGÍSTRATE"

2. **Registrarse y pagar:**
   - Completa el pago en Stripe Checkout
   - Regresa al sitio
   - ✅ Deberías ver "Ya estás registrado"
   - ✅ El evento aparece en tu dashboard

3. **Evento gratuito:**
   - Regístrate en un evento gratuito
   - ✅ Inmediatamente deberías ver "Ya estás registrado"
   - ✅ El evento aparece en tu dashboard

## Configuración Opcional: Limpieza Automática

Si quieres que los registros pendientes se eliminen automáticamente después de 2 horas:

1. Ve a Supabase SQL Editor
2. Habilita la extensión pg_cron:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

3. Programa la limpieza automática:
```sql
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
```

4. Verifica que esté activo:
```sql
SELECT * FROM cron.job;
```

## Notas Importantes

⚠️ **Sin la limpieza automática:** Los registros pendientes quedarán en la base de datos indefinidamente, pero ya no interferirán con el flujo de registro.

✅ **Con la limpieza automática:** Los registros pendientes se eliminarán después de 2 horas, manteniendo la base de datos limpia.

## Resultado Final

- ✅ Los usuarios pueden intentar registrarse múltiples veces si no completan el pago
- ✅ Solo se muestran como "registrados" los que completaron el pago o eventos gratuitos
- ✅ El dashboard solo muestra eventos válidos (pagados o gratuitos)
- ✅ La base de datos se mantiene limpia (con CRON job opcional)

