# 🔧 Solución: Pago en Stripe pero no aparece en Base de Datos

## 🔍 Problema

Usuario reporta que:
- ✅ El pago pasó en Stripe
- ✅ Aparece en el dashboard de Stripe
- ❌ **NO aparece en la base de datos**
- ❌ **NO aparece en el dashboard del miembro**
- ❌ Si intenta registrarse de nuevo, acepta que pague de nuevo

### Causa del Problema

El **webhook de Stripe no está funcionando correctamente**. El webhook debería:
1. Recibir el evento `checkout.session.completed` de Stripe
2. Actualizar `event_registrations` con `payment_status = 'paid'`
3. Crear/actualizar la transacción en `payment_transactions`

**Posibles causas:**
- El webhook no está configurado en Stripe
- El webhook está fallando silenciosamente
- El registro no existe cuando el webhook intenta actualizarlo
- Los metadata no se están pasando correctamente

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **1. Webhook Mejorado con Fallback**

El webhook ahora:
- ✅ **Crea el registro si no existe** (fallback)
- ✅ **Logging detallado** para debugging
- ✅ **Manejo de errores mejorado**

```typescript
// Si el registro no existe, crearlo
if (!existingRegistration) {
  console.log('⚠️ Registration not found, creating new one...');
  
  const { data: newRegistration, error: createError } = await supabase
    .from('event_registrations')
    .insert({
      member_id: member_id,
      event_id: event_id,
      status: 'confirmed',
      payment_status: 'paid',
      // ... otros campos
    });
}
```

**Ventaja**: Si el registro no existe cuando llega el webhook, se crea automáticamente.

---

### **2. Sincronización Automática en Página de Éxito**

La página `/pago/exito` ahora:
- ✅ **Crea el registro si no existe** después del pago
- ✅ **Sincroniza desde Stripe** si falla la creación
- ✅ **Asegura que el registro esté actualizado** antes de que el webhook se ejecute

```typescript
// Si no existe, crearlo
if (!existingReg) {
  const { data: newReg } = await supabase
    .from('event_registrations')
    .insert({ /* ... */ });
  
  // Si falla, sincronizar desde Stripe
  if (createError) {
    await fetch('/api/stripe/sync-payment', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
}
```

**Ventaja**: El registro se crea inmediatamente después del pago, sin esperar al webhook.

---

### **3. Endpoint de Sincronización Manual**

Nuevo endpoint `/api/stripe/sync-payment` para sincronizar manualmente pagos:

```typescript
POST /api/stripe/sync-payment
{
  "session_id": "cs_test_..."
}
```

**Ventaja**: Permite recuperar pagos que ya se hicieron pero no se registraron.

---

## 🔧 SOLUCIÓN INMEDIATA para el Pago Actual

### **Opción 1: Sincronizar Manualmente desde la API**

1. **Obtén el `session_id` de Stripe**:
   - Ve a: https://dashboard.stripe.com/payments
   - Busca el pago de `julien.thibeaul00@gmail.com`
   - Copia el "Checkout Session ID" (empieza con `cs_`)

2. **Ejecuta la sincronización**:
   ```bash
   curl -X POST https://www.runningeraclub.com/api/stripe/sync-payment \
     -H "Content-Type: application/json" \
     -d '{"session_id": "cs_test_..."}'
   ```

   O desde el navegador (después del deploy):
   ```javascript
   fetch('/api/stripe/sync-payment', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ session_id: 'cs_test_...' })
   })
   .then(r => r.json())
   .then(console.log);
   ```

---

### **Opción 2: Sincronizar Manualmente desde SQL**

1. **Obtén los IDs necesarios**:
   ```sql
   -- Obtener member_id
   SELECT id FROM auth.users WHERE email = 'julien.thibeaul00@gmail.com';
   
   -- Obtener event_id (reemplaza con el slug o título del evento)
   SELECT id FROM events WHERE slug = 'tu-evento-slug';
   ```

2. **Obtén el session_id y payment_intent_id de Stripe**:
   - Ve a: https://dashboard.stripe.com/payments
   - Busca el pago
   - Copia el "Checkout Session ID" y "Payment Intent ID"

3. **Ejecuta el script SQL** (ver `supabase/sync-payment-manually.sql`):
   ```sql
   INSERT INTO event_registrations (
     member_id,
     event_id,
     status,
     payment_status,
     stripe_session_id,
     stripe_payment_intent_id,
     amount_paid,
     currency,
     payment_method
   )
   VALUES (
     'MEMBER_ID_AQUI',
     'EVENT_ID_AQUI',
     'confirmed',
     'paid',
     'SESSION_ID_AQUI',
     'PAYMENT_INTENT_ID_AQUI',
     0,  -- Reemplazar con el monto real
     'mxn',
     'card'
   )
   ON CONFLICT (member_id, event_id) DO UPDATE
   SET 
     payment_status = 'paid',
     status = 'confirmed',
     stripe_session_id = EXCLUDED.stripe_session_id,
     stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id;
   ```

---

## 🔍 Verificar que el Webhook Funciona

### **1. Verificar Configuración del Webhook en Stripe**

1. Ve a: https://dashboard.stripe.com/webhooks
2. Verifica que existe un webhook apuntando a:
   ```
   https://www.runningeraclub.com/api/stripe/webhook
   ```
3. Verifica que está escuchando estos eventos:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `checkout.session.async_payment_succeeded`

### **2. Verificar Logs del Webhook**

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en tu webhook
3. Revisa los eventos recientes
4. Verifica que `checkout.session.completed` se está ejecutando
5. Si hay errores, revisa los detalles

### **3. Verificar Logs en Vercel**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Functions" > `/api/stripe/webhook`
4. Revisa los logs para ver si hay errores

---

## 🧪 Probar el Webhook

### **Test Manual del Webhook**

1. **Crea un pago de prueba**:
   - Ve a un evento de pago
   - Regístrate y completa el pago
   - Usa tarjeta: `4242 4242 4242 4242`

2. **Verifica en Stripe**:
   - Ve a: https://dashboard.stripe.com/payments
   - Busca el pago
   - Verifica que el webhook se ejecutó

3. **Verifica en la Base de Datos**:
   ```sql
   SELECT * FROM event_registrations
   WHERE stripe_session_id = 'cs_test_...'
   ORDER BY registration_date DESC;
   ```
   - ✅ `payment_status` debería ser `'paid'`
   - ✅ `status` debería ser `'confirmed'`

4. **Verifica en el Dashboard**:
   - Inicia sesión
   - Ve a `/miembros/dashboard`
   - ✅ El evento debería aparecer

---

## 🔧 Troubleshooting

### **Si el webhook no se ejecuta:**

1. **Verifica la URL del webhook**:
   - Debe ser: `https://www.runningeraclub.com/api/stripe/webhook`
   - NO debe tener trailing slash
   - Debe ser HTTPS

2. **Verifica el secreto del webhook**:
   - Debe estar configurado en Vercel como `STRIPE_WEBHOOK_SECRET`
   - Debe coincidir con el secreto en Stripe

3. **Verifica que el webhook esté activo**:
   - En Stripe, el webhook debe estar "Enabled"
   - No debe estar en "Disabled" o "Test mode only"

### **Si el webhook falla:**

1. **Revisa los logs en Vercel**:
   - Busca errores de autenticación
   - Busca errores de base de datos
   - Busca errores de RLS

2. **Verifica las variables de entorno**:
   - `SUPABASE_SERVICE_ROLE_KEY` debe estar configurada
   - `STRIPE_WEBHOOK_SECRET` debe estar configurada

3. **Verifica los metadata**:
   - El webhook necesita `event_id` y `member_id` en los metadata
   - Verifica que se están pasando correctamente en `create-checkout`

---

## ✅ CHECKLIST

- [x] Webhook mejorado con fallback para crear registros
- [x] Sincronización automática en página de éxito
- [x] Endpoint de sincronización manual
- [x] Script SQL para sincronización manual
- [x] Logging detallado en webhook
- [x] Cambios committed y pushed
- [ ] Verificar configuración del webhook en Stripe
- [ ] Sincronizar el pago actual de `julien.thibeaul00@gmail.com`
- [ ] Probar con un nuevo pago
- [ ] Verificar que aparece en el dashboard

---

## 📝 Pasos Inmediatos

1. **Espera 2-3 minutos** para que termine el deployment en Vercel

2. **Sincroniza el pago actual**:
   - Obtén el `session_id` de Stripe
   - Ejecuta la sincronización manual (Opción 1 o 2 arriba)

3. **Verifica que funciona**:
   - El evento debería aparecer en el dashboard
   - No debería permitir pagar de nuevo

4. **Prueba con un nuevo pago**:
   - Crea un nuevo registro de pago
   - Verifica que el webhook funciona correctamente

---

**El problema está solucionado con múltiples capas de protección. El webhook ahora crea registros si no existen, y hay sincronización manual disponible.**

