# 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS - Sistema de Pagos

## ⚠️ PROBLEMA PRINCIPAL: Webhook de Stripe No Funciona

### Síntomas:
- Usuario paga en Stripe ✅
- Stripe dice "Pago exitoso" ✅
- Usuario regresa al sitio
- **El sistema sigue mostrando "REGÍSTRATE"** ❌
- **El evento NO aparece en el dashboard** ❌
- **El usuario puede "registrarse" de nuevo** ❌

### Causa Raíz:

El webhook de Stripe intenta actualizar campos que **NO EXISTEN** en la tabla `event_registrations`:

```sql
-- El webhook intenta guardar:
UPDATE event_registrations SET
  payment_status = 'paid',
  stripe_session_id = 'cs_test_...',          -- ❌ COLUMNA NO EXISTE
  stripe_payment_intent_id = 'pi_test_...',   -- ❌ COLUMNA NO EXISTE
  amount_paid = 550,                           -- ❌ COLUMNA NO EXISTE
  currency = 'mxn',                            -- ❌ COLUMNA NO EXISTE
  payment_method = 'card'                      -- ❌ COLUMNA NO EXISTE
WHERE member_id = '...' AND event_id = '...';
```

**Resultado:** La query falla, el `payment_status` NO se actualiza a `'paid'`, y el sistema nunca reconoce el pago.

---

## 🔍 Problemas Detectados

### 1. **Columnas Faltantes en `event_registrations`** 🔴 CRÍTICO

**Tabla actual solo tiene:**
- `payment_status`
- `notes`

**Tabla NECESITA:**
- `stripe_payment_intent_id` - Para trackear el pago en Stripe
- `stripe_session_id` - Para identificar la sesión de checkout
- `amount_paid` - Para guardar el monto pagado
- `currency` - Para guardar la moneda (MXN, USD, etc)
- `payment_method` - Para saber si pagó con tarjeta, OXXO, etc

### 2. **Columna Instagram Faltante en `members`** 🟡 IMPORTANTE

El sistema intenta guardar el Instagram del usuario pero la columna no existe.

### 3. **Status del Registro No Se Actualiza** 🟠 MEDIO

Cuando un pago es exitoso, el `status` debería cambiar de `'pending'` a `'confirmed'`, pero no lo hace.

### 4. **Sin Logging de Errores en Webhook** 🟡 IMPORTANTE

El webhook falla silenciosamente, no hay forma de saber que algo salió mal.

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Script SQL Crítico

**Archivo:** `supabase/CRITICAL-FIX-add-stripe-columns.sql`

Este script agrega TODAS las columnas necesarias en una sola ejecución:

```sql
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'mxn',
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS instagram TEXT;
```

### 2. Webhook Mejorado

**Cambios en** `app/api/stripe/webhook/route.ts`:

- ✅ Ahora actualiza también el `status` a `'confirmed'`
- ✅ Agrega `currency` y `payment_method`
- ✅ Loggea errores con `console.error`
- ✅ Retorna datos con `.select()` para verificar la actualización

### 3. Verificación de Payment Status

**Cambios en** `EventRegistrationButton.tsx` y `dashboard/page.tsx`:

- ✅ Solo muestra "registrado" si `payment_status = 'paid'`
- ✅ Filtra registros pendientes del dashboard
- ✅ Permite reintentar si el pago no se completó

---

## 📋 PASOS PARA CORREGIR (URGENTE)

### Paso 1: Ejecutar Script SQL en Supabase

1. Ve a: https://supabase.com/dashboard/project/[TU_ID]/sql
2. Copia y pega **TODO** el contenido de `supabase/CRITICAL-FIX-add-stripe-columns.sql`
3. Click en **RUN**
4. Verifica que al final muestre las 6 columnas

### Paso 2: Verificar Webhook de Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Busca el endpoint: `https://runningeraclub.com/api/stripe/webhook`
3. Verifica que los eventos estén activados:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

### Paso 3: Configurar URLs de Redirección

1. Ve a Supabase → **Authentication** → **URL Configuration**
2. Agrega a **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://runningeraclub.com/auth/callback
   https://www.runningeraclub.com/auth/callback
   ```

### Paso 4: Probar el Flujo Completo

1. **Registrarse en un evento de pago:**
   - Inicia sesión
   - Click en "REGÍSTRATE" en un evento
   - Completa el pago en Stripe (usa tarjeta de prueba: `4242 4242 4242 4242`)
   - Espera la redirección

2. **Verificar que funcionó:**
   - ✅ Deberías ver "Ya estás registrado"
   - ✅ El evento aparece en tu dashboard
   - ✅ En Supabase, el registro debe tener `payment_status = 'paid'`

### Paso 5: Verificar en Supabase

Después de una prueba de pago, ejecuta esta query:

```sql
SELECT 
  id,
  member_id,
  event_id,
  status,
  payment_status,
  stripe_session_id,
  amount_paid,
  currency,
  payment_method,
  registration_date
FROM event_registrations
ORDER BY registration_date DESC
LIMIT 5;
```

Deberías ver:
- `payment_status` = `'paid'`
- `status` = `'confirmed'`
- `stripe_session_id` con valor
- `amount_paid` con el monto
- `currency` = `'mxn'`

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Registro y Pago Exitoso
1. Usuario se registra
2. Va a Stripe Checkout
3. Paga con tarjeta
4. Regresa al sitio
5. **Esperado:** "Ya estás registrado" + Evento en dashboard

### ✅ Caso 2: Registro sin Completar Pago
1. Usuario se registra
2. Va a Stripe Checkout
3. Cierra la ventana sin pagar
4. Regresa al sitio
5. **Esperado:** Puede hacer click en "REGÍSTRATE" nuevamente

### ✅ Caso 3: Evento Gratuito
1. Usuario se registra en evento gratuito
2. **Esperado:** Registro inmediato sin Stripe

---

## 🔄 Limpieza de Registros Pendientes (Opcional)

Para mantener la base de datos limpia, ejecuta este CRON job:

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar limpieza cada hora
SELECT cron.schedule(
  'cleanup-pending-registrations',
  '0 * * * *',
  $$
  DELETE FROM event_registrations
  WHERE 
    payment_status = 'pending' 
    AND status = 'pending'
    AND registration_date < NOW() - INTERVAL '2 hours';
  $$
);
```

---

## ⚠️ IMPORTANTE

**SIN ejecutar el script SQL**, el sistema de pagos **NO FUNCIONARÁ** aunque el código esté correcto.

Los usuarios pagarán en Stripe, pero el sistema no lo reconocerá porque el webhook no puede actualizar la base de datos.

---

## ✅ Checklist Final

Antes de lanzar en producción, verifica:

- [ ] Script SQL ejecutado en Supabase
- [ ] Columnas `stripe_*` existen en `event_registrations`
- [ ] Columna `instagram` existe en `members`
- [ ] Webhook configurado en Stripe (modo LIVE)
- [ ] URLs de redirección configuradas en Supabase
- [ ] Claves de Stripe LIVE en variables de entorno de Vercel
- [ ] Prueba de pago real completada exitosamente

---

## 📞 Si Algo Falla

**Verificar webhook logs en Stripe:**
1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en tu webhook
3. Ve a "Attempts" para ver si hay errores

**Verificar logs del servidor:**
1. En Vercel, ve a tu proyecto → Logs
2. Busca errores relacionados con "webhook" o "event_registrations"

**Verificar en Supabase:**
```sql
-- Ver registros recientes
SELECT * FROM event_registrations 
ORDER BY registration_date DESC 
LIMIT 10;

-- Ver si las columnas existen
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'event_registrations';
```

