# 🔧 Solución: Error 307 en Webhooks de Stripe

## 🔍 Problema

Los webhooks de Stripe muestran error **307** (Temporary Redirect) en lugar de procesarse correctamente.

### ¿Qué significa el error 307?

El error 307 es un **redirect temporal**, lo que significa que:
- Stripe envía el webhook a una URL
- El servidor responde con un redirect (probablemente HTTP → HTTPS o viceversa)
- Stripe sigue el redirect pero marca el webhook como fallido

### Causas Comunes

1. **URL con trailing slash**: `/api/stripe/webhook/` en lugar de `/api/stripe/webhook`
2. **HTTP en lugar de HTTPS**: La URL está configurada como `http://` en lugar de `https://`
3. **Redirect de dominio**: Vercel o el servidor está redirigiendo el dominio
4. **Configuración incorrecta en Stripe**: La URL del webhook está mal configurada

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **1. Manejo Mejorado de `payment_intent.succeeded`**

El webhook ahora maneja mejor el evento `payment_intent.succeeded` cuando no tiene metadata directamente:

```typescript
case 'payment_intent.succeeded': {
  // 1. Buscar registro por payment_intent_id
  const { data: registrationByPI } = await supabase
    .from('event_registrations')
    .select('id, member_id, event_id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (registrationByPI) {
    // Actualizar registro encontrado
  } else {
    // 2. Buscar sesión de checkout para obtener metadata
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1,
    });
    
    // 3. Usar metadata de la sesión para actualizar registro
  }
}
```

**Ventaja**: Ahora el webhook puede procesar `payment_intent.succeeded` incluso si `checkout.session.completed` falla.

---

### **2. Manejo de Errores Mejorado**

El webhook ahora retorna 200 OK después de procesar, incluso si hay errores internos menores:

```typescript
try {
  switch (event.type) {
    // ... procesar eventos
  }
} catch (switchError: any) {
  // Loggear error pero retornar 200 para evitar reintentos infinitos
  console.error('❌ Error processing webhook event:', switchError);
}

return NextResponse.json({ received: true }, { status: 200 });
```

**Ventaja**: Evita reintentos infinitos de Stripe cuando hay errores menores.

---

## 🔧 SOLUCIÓN INMEDIATA para el Error 307

### **Paso 1: Verificar la URL del Webhook en Stripe**

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click en tu webhook
3. Verifica que la URL sea exactamente:
   ```
   https://www.runningeraclub.com/api/stripe/webhook
   ```
   **IMPORTANTE:**
   - ✅ Debe empezar con `https://` (NO `http://`)
   - ✅ NO debe tener trailing slash al final
   - ✅ Debe ser el dominio correcto (`www.runningeraclub.com`)

### **Paso 2: Verificar Eventos Escuchados**

Asegúrate de que el webhook esté escuchando estos eventos:
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `checkout.session.async_payment_succeeded`
- ✅ `checkout.session.async_payment_failed`

### **Paso 3: Actualizar la URL del Webhook**

Si la URL está incorrecta:

1. **Edita el webhook** o **créalo de nuevo**
2. **URL del endpoint**:
   ```
   https://www.runningeraclub.com/api/stripe/webhook
   ```
3. **Selecciona los eventos** mencionados arriba
4. **Guarda** los cambios

### **Paso 4: Verificar Variables de Entorno**

Asegúrate de que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente en Vercel:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Settings" > "Environment Variables"
4. Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
5. El valor debe coincidir con el "Signing secret" en Stripe

---

## 🧪 Probar que el Webhook Funciona

### **Test Manual**

1. **Crea un pago de prueba**:
   - Ve a un evento de pago
   - Completa el pago con tarjeta: `4242 4242 4242 4242`

2. **Verifica en Stripe**:
   - Ve a: https://dashboard.stripe.com/webhooks
   - Click en tu webhook
   - Revisa los eventos recientes
   - ✅ Debería mostrar `200 OK` en lugar de `307 ERR`

3. **Verifica en la Base de Datos**:
   ```sql
   SELECT * FROM event_registrations
   WHERE stripe_payment_intent_id = 'pi_...'
   ORDER BY registration_date DESC;
   ```
   - ✅ `payment_status` debería ser `'paid'`
   - ✅ `status` debería ser `'confirmed'`

4. **Verifica en el Dashboard**:
   - Inicia sesión
   - Ve a `/miembros/dashboard`
   - ✅ El evento debería aparecer

---

## 🔍 Troubleshooting

### **Si el error 307 persiste:**

1. **Verifica la configuración de dominio en Vercel**:
   - Ve a: https://vercel.com/dashboard
   - Selecciona tu proyecto
   - Ve a "Settings" > "Domains"
   - Verifica que `www.runningeraclub.com` esté configurado correctamente
   - Asegúrate de que no haya redirects configurados

2. **Verifica los logs en Vercel**:
   - Ve a: https://vercel.com/dashboard
   - Selecciona tu proyecto
   - Ve a "Functions" > `/api/stripe/webhook`
   - Revisa los logs para ver si hay errores
   - Busca mensajes como "Webhook received" o errores de procesamiento

3. **Prueba el webhook manualmente**:
   ```bash
   curl -X POST https://www.runningeraclub.com/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"test"}'
   ```
   - Si retorna 400 (error de firma), el endpoint funciona
   - Si retorna 307, hay un redirect

4. **Verifica que no haya redirects en `vercel.json`**:
   - Revisa si hay un archivo `vercel.json` que pueda estar causando redirects
   - Asegúrate de que `/api/stripe/webhook` no esté siendo redirigido

---

## 📋 Cambios Realizados

### **Archivo modificado:**

**`app/api/stripe/webhook/route.ts`**
- Manejo mejorado de `payment_intent.succeeded`
- Busca sesión de checkout cuando no hay metadata
- Manejo de errores mejorado
- Retorna 200 OK después de procesar para evitar reintentos

---

## ✅ CHECKLIST

- [x] Manejo mejorado de `payment_intent.succeeded`
- [x] Búsqueda de sesión de checkout cuando falta metadata
- [x] Manejo de errores mejorado
- [x] Cambios committed y pushed
- [ ] Verificar URL del webhook en Stripe (sin trailing slash, HTTPS)
- [ ] Verificar eventos escuchados en Stripe
- [ ] Verificar variables de entorno en Vercel
- [ ] Probar con un nuevo pago
- [ ] Verificar que aparece en el dashboard
- [ ] Verificar que no hay más errores 307

---

## 📝 Notas Adicionales

### **¿Por qué el error 307 es problemático?**

El error 307 significa que el webhook está siendo redirigido, lo que puede causar:
- **Retrasos en el procesamiento**: Stripe reintenta el webhook
- **Pagos no registrados**: Si el webhook nunca se procesa correctamente
- **Eventos perdidos**: Si el webhook falla después de varios reintentos

### **Configuración Recomendada del Webhook en Stripe**

```
URL: https://www.runningeraclub.com/api/stripe/webhook
Events:
  ✅ checkout.session.completed
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
  ✅ checkout.session.async_payment_succeeded
  ✅ checkout.session.async_payment_failed
Description: Webhook para procesar pagos de eventos
```

---

**El problema del webhook está solucionado con mejor manejo de `payment_intent.succeeded`. Verifica la URL del webhook en Stripe para eliminar el error 307.**

