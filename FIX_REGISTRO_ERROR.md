# 🔍 Diagnóstico del Error de Registro

## Síntomas:
- Error: "Error al registrarse - Error al crear registro"
- Webhooks funcionan correctamente (200 OK)
- Pero el registro inicial falla

## Causa Probable:
Falta ejecutar la migración SQL que agrega las columnas de pago a `event_registrations`.

## Solución:

### 1. Ejecutar esta migración en Supabase SQL Editor:

```sql
-- Agregar columnas de pago a event_registrations
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_status ON event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_stripe_pi ON event_registrations(stripe_payment_intent_id);
```

### 2. Verificar que las otras migraciones también estén aplicadas:

#### Migración 1: stripe-schema.sql
```sql
-- Verificar si existe la tabla payment_transactions
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'payment_transactions'
);
```
Si devuelve `false`, ejecuta: `supabase/stripe-schema.sql`

#### Migración 2: add-stripe-customers.sql
```sql
-- Verificar si existe la columna stripe_customer_id en members
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'members' 
AND column_name = 'stripe_customer_id';
```
Si no devuelve resultados, ejecuta: `supabase/add-stripe-customers.sql`

## Pasos a Seguir:

1. ✅ Ve a Supabase Dashboard
2. ✅ Abre SQL Editor
3. ✅ Copia y pega el primer script de arriba
4. ✅ Ejecuta
5. ✅ Reinicia el servidor Next.js (`npm run dev`)
6. ✅ Intenta registrarte de nuevo

## Verificación:

Después de ejecutar las migraciones, puedes verificar con:

```sql
-- Ver estructura de event_registrations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_registrations';
```

Deberías ver las columnas:
- payment_status
- stripe_payment_intent_id  
- stripe_session_id
- amount_paid
- currency
- payment_method

---

**Nota**: Los webhooks ya funcionan (200 OK), solo falta que la tabla esté lista para recibir los registros iniciales.



