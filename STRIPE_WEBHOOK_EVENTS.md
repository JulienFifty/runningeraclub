# Eventos de Stripe Webhook - Configuración Completa

## 📋 Eventos que DEBE Escuchar el Webhook

El webhook está configurado para manejar los siguientes eventos. **Asegúrate de que todos estén activados en Stripe Dashboard.**

---

## ✅ Eventos Esenciales (OBLIGATORIOS)

### 1. `checkout.session.completed` ⭐ **CRÍTICO**
- **Cuándo se dispara:** Cuando un usuario completa el checkout exitosamente
- **Qué hace:** Actualiza `payment_status = 'paid'` y `status = 'confirmed'` en `event_registrations`
- **Por qué es importante:** Es el evento principal que confirma que el pago fue exitoso

### 2. `payment_intent.succeeded` ⭐ **CRÍTICO**
- **Cuándo se dispara:** Cuando el pago se procesa exitosamente
- **Qué hace:** Actualiza la transacción como exitosa (backup del evento principal)
- **Por qué es importante:** Confirma que el dinero fue recibido

### 3. `payment_intent.payment_failed` ⚠️ **IMPORTANTE**
- **Cuándo se dispara:** Cuando el pago falla (tarjeta rechazada, fondos insuficientes, etc.)
- **Qué hace:** Actualiza `payment_status = 'failed'` en registros
- **Por qué es importante:** Permite que el usuario intente registrarse de nuevo

---

## 🔄 Eventos Adicionales (RECOMENDADOS)

### 4. `payment_intent.canceled`
- **Cuándo se dispara:** Cuando el usuario cancela el pago
- **Qué hace:** Actualiza el estado a 'canceled'
- **Por qué es importante:** Limpia registros cancelados

### 5. `charge.refunded` 💰 **IMPORTANTE**
- **Cuándo se dispara:** Cuando procesas un reembolso
- **Qué hace:** Actualiza `payment_status = 'refunded'` y `status = 'cancelled'`
- **Por qué es importante:** Para manejar reembolsos correctamente

### 6. `checkout.session.async_payment_succeeded` 📧
- **Cuándo se dispara:** Cuando un pago asíncrono se completa (ej: OXXO, transferencia)
- **Qué hace:** Confirma el pago después de que el usuario paga
- **Por qué es importante:** Si usas métodos de pago como OXXO en México

### 7. `checkout.session.async_payment_failed` ❌
- **Cuándo se dispara:** Cuando un pago asíncrono falla o expira (ej: OXXO no pagado)
- **Qué hace:** Actualiza el estado a 'failed'
- **Por qué es importante:** Para limpiar registros de pagos que nunca se completaron

---

## 🚀 Cómo Configurar en Stripe Dashboard

### Paso 1: Ir a Webhooks

1. Ve a: https://dashboard.stripe.com/webhooks
2. Busca tu endpoint: `https://runningeraclub.com/api/stripe/webhook`
3. O crea uno nuevo si no existe

### Paso 2: Seleccionar Eventos

Click en **"Select events"** o **"Add events"** y marca estos eventos:

#### ✅ Eventos Esenciales (Mínimo requerido):
- [x] `checkout.session.completed`
- [x] `payment_intent.succeeded`
- [x] `payment_intent.payment_failed`

#### ✅ Eventos Recomendados (Para funcionalidad completa):
- [x] `payment_intent.canceled`
- [x] `charge.refunded`
- [x] `checkout.session.async_payment_succeeded`
- [x] `checkout.session.async_payment_failed`

### Paso 3: Guardar

Click en **"Add events"** o **"Save"**

---

## 📊 Tabla de Eventos

| Evento | Prioridad | Cuándo Usar | Impacto si Falta |
|--------|-----------|-------------|------------------|
| `checkout.session.completed` | 🔴 **CRÍTICO** | Siempre | Pagos no se confirman |
| `payment_intent.succeeded` | 🔴 **CRÍTICO** | Siempre | Sin backup de confirmación |
| `payment_intent.payment_failed` | 🟠 **IMPORTANTE** | Siempre | Usuarios no pueden reintentar |
| `payment_intent.canceled` | 🟡 **OPCIONAL** | Si usas cancelaciones | Registros cancelados quedan pendientes |
| `charge.refunded` | 🟠 **IMPORTANTE** | Si procesas reembolsos | Reembolsos no se reflejan |
| `checkout.session.async_payment_succeeded` | 🟡 **OPCIONAL** | Si usas OXXO/transferencias | Pagos asíncronos no se confirman |
| `checkout.session.async_payment_failed` | 🟡 **OPCIONAL** | Si usas OXXO/transferencias | Pagos expirados quedan pendientes |

---

## 🧪 Cómo Probar

### 1. Probar Pago Exitoso:
1. Registra un usuario en un evento de pago
2. Completa el pago en Stripe Checkout
3. Verifica en Supabase que `payment_status = 'paid'`
4. Verifica en Stripe Dashboard → Webhooks → "Attempts" que el evento llegó

### 2. Probar Pago Fallido:
1. Usa una tarjeta de prueba que falle: `4000 0000 0000 0002`
2. Verifica que el registro quede como `payment_status = 'failed'`
3. Verifica que el usuario pueda intentar de nuevo

### 3. Probar Reembolso:
1. Procesa un reembolso en Stripe Dashboard
2. Verifica que `payment_status = 'refunded'` en Supabase
3. Verifica que `status = 'cancelled'` en el registro

---

## 🔍 Verificar que Funciona

### En Stripe Dashboard:
1. Ve a **Webhooks** → Tu endpoint
2. Click en **"Attempts"**
3. Deberías ver eventos recientes con estado **"Succeeded"** (verde)

### En Logs del Servidor (Vercel):
1. Ve a tu proyecto en Vercel
2. **Logs** → Busca mensajes como:
   - `✅ Checkout session completed: cs_...`
   - `✅ Event registration updated successfully`
   - `❌ Payment intent failed: pi_...`

### En Supabase:
```sql
-- Ver registros recientes con sus estados de pago
SELECT 
  id,
  member_id,
  event_id,
  payment_status,
  status,
  stripe_session_id,
  amount_paid,
  registration_date
FROM event_registrations
ORDER BY registration_date DESC
LIMIT 10;
```

---

## ⚠️ Problemas Comunes

### Problema: Los pagos no se confirman
**Solución:** Verifica que `checkout.session.completed` esté activado en Stripe

### Problema: Los reembolsos no se reflejan
**Solución:** Activa `charge.refunded` en Stripe

### Problema: Pagos OXXO no se confirman
**Solución:** Activa `checkout.session.async_payment_succeeded`

### Problema: Webhook no recibe eventos
**Solución:** 
1. Verifica que la URL del webhook sea correcta
2. Verifica que el `STRIPE_WEBHOOK_SECRET` esté configurado
3. Verifica que el webhook esté en modo **LIVE** (no test)

---

## 📝 Checklist Final

Antes de lanzar en producción, verifica:

- [ ] `checkout.session.completed` activado
- [ ] `payment_intent.succeeded` activado
- [ ] `payment_intent.payment_failed` activado
- [ ] `charge.refunded` activado (si procesas reembolsos)
- [ ] Webhook en modo **LIVE** (no test)
- [ ] URL del webhook correcta: `https://runningeraclub.com/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` configurado en Vercel (modo LIVE)
- [ ] Probado con pago real exitoso
- [ ] Probado con pago fallido
- [ ] Verificado en Supabase que los estados se actualizan

---

## 🔗 Enlaces Útiles

- **Stripe Webhooks Dashboard:** https://dashboard.stripe.com/webhooks
- **Documentación de Eventos:** https://stripe.com/docs/api/events/types
- **Testing Webhooks:** https://stripe.com/docs/webhooks/test

---

## 💡 Nota Importante

**Modo TEST vs LIVE:**
- En desarrollo, usa webhooks en modo **TEST**
- En producción, usa webhooks en modo **LIVE**
- Cada modo tiene su propio `STRIPE_WEBHOOK_SECRET`
- Asegúrate de configurar ambos en Vercel con diferentes variables de entorno si es necesario

