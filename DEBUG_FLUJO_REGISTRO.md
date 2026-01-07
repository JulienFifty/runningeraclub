# 🔍 Guía de Debugging: Flujo de Registro y Pago

## 📋 Flujo Completo

```
1. Usuario hace click en "REGÍSTRATE"
   ↓
2. EventRegistrationButton.handleRegister()
   ↓
3. POST /api/members/register-event
   ↓
4. POST /api/stripe/create-checkout (si requiere pago)
   ↓
5. Redirige a Stripe Checkout
```

---

## 🔍 Cómo Debuggear

### **PASO 1: Abrir Consola del Navegador**

1. Abre tu sitio: https://www.runningeraclub.com
2. Presiona `F12` o `Cmd+Option+I` (Mac)
3. Ve a la pestaña **Console**

### **PASO 2: Hacer Click en "REGÍSTRATE"**

Deberías ver estos logs en orden:

#### **✅ Flujo Exitoso:**

```
🔄 Iniciando registro de evento: { eventId: "..." }
📥 Respuesta del servidor: { ok: true, status: 200, data: {...} }
💳 Redirigiendo a Stripe Checkout: https://checkout.stripe.com/...
```

#### **❌ Si hay Error:**

```
🔄 Iniciando registro de evento: { eventId: "..." }
📥 Respuesta del servidor: { ok: false, status: 500, data: {...} }
❌ Error en registro: { error: "...", details: "..." }
```

---

## 🐛 Errores Comunes y Soluciones

### **Error 1: "No autenticado"**

**Logs:**
```
👤 User check: { user: null, authError: {...} }
```

**Causa**: El usuario no está autenticado

**Solución**:
1. Verifica que estés logueado
2. Refresca la página
3. Intenta iniciar sesión de nuevo

---

### **Error 2: "Evento no encontrado"**

**Logs:**
```
🎫 Event check: { event: null, eventError: {...} }
```

**Causa**: El `event_id` no existe en la base de datos

**Solución**:
1. Verifica que el evento existe en Supabase
2. Verifica que el `event_id` es correcto

---

### **Error 3: "Perfil de miembro no encontrado"**

**Logs:**
```
👥 Member check: { member: null, memberError: null }
⚠️ Member not found, creating profile...
👥 Member created: { newMember: {...}, createError: null }
```

**Causa**: El perfil no existe pero se está creando

**Solución**: 
- Si `createError` es null, debería funcionar
- Si `createError` tiene un error, revisa las políticas RLS

---

### **Error 4: "Error al crear sesión de pago"**

**Logs:**
```
💳 Creating Stripe checkout session...
💳 Checkout response: { ok: false, data: {...} }
```

**Causa**: Error en la creación de la sesión de Stripe

**Verificar**:

1. **Variables de entorno de Stripe**:
   - `STRIPE_SECRET_KEY` está configurada en Vercel
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está configurada
   - Son claves del mismo modo (test o live)

2. **Logs del servidor** (Vercel):
   - Ve a: https://vercel.com/[tu-proyecto]/logs
   - Busca errores relacionados con Stripe

3. **Errores específicos**:
   - `StripeAuthenticationError` → Clave inválida
   - `StripeInvalidRequestError` → Configuración incorrecta
   - `session.url is null` → Error en creación de sesión

---

### **Error 5: "No se recibió checkout_url"**

**Logs:**
```
💳 Checkout response: { ok: true, data: { url: null } }
❌ No se recibió checkout_url pero requires_payment es true
```

**Causa**: Stripe creó la sesión pero no devolvió URL

**Solución**:
1. Verifica los logs de Stripe en Vercel
2. Verifica que `session.url` no sea null en la API
3. Revisa la configuración de Stripe

---

### **Error 6: "Ya estás registrado"**

**Logs:**
```
✅ Registration check: { existingRegistration: {...} }
```

**Causa**: Ya existe un registro para este evento

**Solución**:
- Es normal si ya te registraste antes
- Si quieres registrarte de nuevo, elimina el registro en Supabase

---

## 📊 Verificar en Vercel Logs

### **PASO 1: Ir a Logs de Vercel**

1. Ve a: https://vercel.com/[tu-proyecto]/logs
2. Filtra por "Error" o busca por "register-event"

### **PASO 2: Buscar Logs Específicos**

Busca estos mensajes:

```
📝 Register event request: { event_id: "..." }
👤 User check: { user: "...", authError: null }
🎫 Event check: { event: {...}, eventError: null }
💰 Payment check: { price: "...", requiresPayment: true }
👥 Member check: { member: {...}, memberError: null }
✅ Registration check: { existingRegistration: null }
💳 Creating Stripe checkout session...
👤 Member lookup: { member_id: "...", found: true }
✅ Stripe session creada: { sessionId: "...", url: "..." }
✅ Retornando checkout_url: https://checkout.stripe.com/...
```

---

## 🔧 Checklist de Verificación

### **Frontend (Navegador)**

- [ ] Consola del navegador abierta
- [ ] Usuario autenticado
- [ ] Logs aparecen cuando haces click en "REGÍSTRATE"
- [ ] No hay errores en rojo en la consola

### **Backend (Vercel)**

- [ ] Variables de entorno configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_URL`

- [ ] Logs en Vercel muestran el flujo completo
- [ ] No hay errores 500 en los logs

### **Base de Datos (Supabase)**

- [ ] El evento existe en la tabla `events`
- [ ] El usuario existe en `auth.users`
- [ ] El perfil existe en `members` (o se crea automáticamente)
- [ ] No hay errores de RLS

### **Stripe**

- [ ] Claves configuradas correctamente
- [ ] Modo correcto (test o live)
- [ ] Webhook configurado (si es necesario)

---

## 🧪 Probar el Flujo Completo

### **1. Preparación**

```bash
# Limpiar datos de prueba
# Eliminar tu usuario en Supabase
# Eliminar registros de prueba en event_registrations
```

### **2. Probar Registro**

1. Ve a la página del evento
2. Abre la consola del navegador
3. Haz click en "REGÍSTRATE"
4. Observa los logs

### **3. Verificar Resultado**

**Si funciona:**
- ✅ Deberías ser redirigido a Stripe Checkout
- ✅ Puedes completar el pago
- ✅ No hay errores en la consola

**Si falla:**
- ❌ Revisa los logs en la consola
- ❌ Revisa los logs en Vercel
- ❌ Identifica en qué paso falla
- ❌ Usa esta guía para solucionarlo

---

## 📝 Logs Esperados por Paso

### **Paso 1: Click en Botón**
```
🔄 Iniciando registro de evento: { eventId: "3a694be7-..." }
```

### **Paso 2: API Register Event**
```
📝 Register event request: { event_id: "3a694be7-..." }
👤 User check: { user: "07971c18-...", authError: null }
🎫 Event check: { event: {...}, eventError: null }
💰 Payment check: { price: "55", requiresPayment: true }
👥 Member check: { member: {...}, memberError: null }
✅ Registration check: { existingRegistration: null }
💳 Creating Stripe checkout session...
```

### **Paso 3: API Stripe Checkout**
```
👤 Member lookup: { member_id: "07971c18-...", found: true }
✅ Cliente Stripe existente reutilizado: cus_...
✅ Stripe session creada: { sessionId: "cs_...", url: "https://checkout.stripe.com/..." }
✅ Retornando checkout_url: https://checkout.stripe.com/...
```

### **Paso 4: Respuesta al Frontend**
```
📥 Respuesta del servidor: { ok: true, status: 200, data: { checkout_url: "..." } }
💳 Redirigiendo a Stripe Checkout: https://checkout.stripe.com/...
```

---

## 🆘 Si Nada Funciona

1. **Revisa todos los logs** (navegador + Vercel)
2. **Copia los mensajes de error** exactos
3. **Verifica las variables de entorno** en Vercel
4. **Prueba con un evento gratuito** primero
5. **Verifica que Stripe esté configurado** correctamente

---

**Con estos logs mejorados, deberías poder identificar exactamente dónde falla el flujo.**

