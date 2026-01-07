# 🔧 Solución: "Ya estás registrado" pero no pagaste

## 🔍 Problema

Usuario reporta que el sistema dice **"Ya estás registrado en este evento"** pero no completó el pago.

### Causa del Problema

Cuando un usuario inicia el proceso de registro para un evento de pago:

1. ✅ Se crea un registro en `event_registrations` con `payment_status = 'pending'`
2. ✅ Se crea una sesión de Stripe Checkout
3. ❌ Usuario no completa el pago (cierra la ventana, cancela, etc.)
4. ❌ El registro queda con `payment_status = 'pending'` en la BD
5. ❌ Cuando intenta registrarse de nuevo, el sistema dice "Ya estás registrado"

**El problema**: El sistema verificaba si existía **cualquier registro**, sin importar el `payment_status`.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1. Verificación Inteligente de Registros Pendientes**

Ahora el sistema maneja registros pendientes de forma inteligente:

```typescript
if (existingRegistration) {
  // Si el pago está completado, rechazar
  if (existingRegistration.payment_status === 'paid') {
    return NextResponse.json(
      { error: 'Ya estás registrado en este evento' },
      { status: 400 }
    );
  }

  // Si el pago está pendiente, verificar si es antiguo (>2 horas)
  if (existingRegistration.payment_status === 'pending') {
    const hoursSinceRegistration = (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60);
    
    // Si el registro pendiente tiene más de 2 horas, eliminarlo y permitir nuevo intento
    if (hoursSinceRegistration > 2) {
      await supabase
        .from('event_registrations')
        .delete()
        .eq('id', existingRegistration.id);
      
      // Permitir crear nuevo registro
    }
  }
}
```

**Ventaja**: Si el registro pendiente tiene más de 2 horas, se elimina automáticamente y permite un nuevo intento.

---

### **2. Verificación de Sesión de Stripe Activa**

Si el registro pendiente es reciente (<2 horas), el sistema verifica si la sesión de Stripe aún es válida:

```typescript
if (existingRegistration.stripe_session_id) {
  const session = await stripe.checkout.sessions.retrieve(existingRegistration.stripe_session_id);
  
  // Si la sesión está completa, actualizar el registro
  if (session.payment_status === 'paid') {
    await supabase
      .from('event_registrations')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', existingRegistration.id);
    
    return NextResponse.json(
      { error: 'Ya estás registrado en este evento (pago completado)' },
      { status: 400 }
    );
  }
  
  // Si la sesión está abierta, devolver la URL para continuar
  if (session.status === 'open' && session.url) {
    return NextResponse.json({
      success: true,
      requires_payment: true,
      checkout_url: session.url,
      message: 'Tienes un pago pendiente, continuando con la sesión existente',
    });
  }
}
```

**Ventaja**: Si la sesión de Stripe aún está abierta, el usuario puede continuar con el pago existente.

---

### **3. Limpieza Automática de Registros Antiguos**

Si el registro pendiente no tiene `stripe_session_id` o hay un error al verificar la sesión, se elimina automáticamente:

```typescript
// Si no tiene stripe_session_id, eliminar y permitir nuevo intento
if (!existingRegistration.stripe_session_id) {
  await supabase
    .from('event_registrations')
    .delete()
    .eq('id', existingRegistration.id);
}
```

**Ventaja**: Limpia registros huérfanos y permite nuevos intentos.

---

## 🔄 Flujo Completo Ahora

```
1. Usuario intenta registrarse
   ↓
2. Sistema verifica si existe registro
   ↓
3. ¿Registro existe?
   ├─ NO → Crear nuevo registro ✅
   │
   └─ SÍ → Verificar payment_status
       ├─ 'paid' → Rechazar (ya está registrado) ✅
       │
       └─ 'pending' → Verificar antigüedad
           ├─ >2 horas → Eliminar y permitir nuevo intento ✅
           │
           └─ <2 horas → Verificar sesión de Stripe
               ├─ Sesión completa → Actualizar a 'paid' ✅
               ├─ Sesión abierta → Continuar con pago existente ✅
               └─ Error/Sin sesión → Eliminar y permitir nuevo intento ✅
```

---

## 🎯 Resultado

Ahora el sistema es **inteligente** y **flexible**:

✅ **Registros pagados**: Rechaza correctamente (ya está registrado)  
✅ **Registros pendientes antiguos (>2h)**: Se eliminan automáticamente  
✅ **Registros pendientes recientes**: Verifica sesión de Stripe  
✅ **Sesiones activas**: Permite continuar con el pago existente  
✅ **Sesiones inválidas**: Limpia y permite nuevo intento  
✅ **No más bloqueos**: Usuarios pueden reintentar después de 2 horas  

---

## 📋 Cambios Realizados

### **Archivo modificado:**

**`app/api/members/register-event/route.ts`**
- Verificación inteligente de registros pendientes
- Eliminación automática de registros antiguos (>2 horas)
- Verificación de sesiones de Stripe activas
- Manejo de errores mejorado

---

## 🧪 Cómo Probar

### **Escenario 1: Registro pendiente antiguo**

1. **Crea un registro pendiente manualmente en Supabase**:
   ```sql
   INSERT INTO event_registrations (member_id, event_id, status, payment_status, registration_date)
   VALUES (
     'tu-user-id',
     'tu-event-id',
     'pending',
     'pending',
     NOW() - INTERVAL '3 hours'  -- Hace 3 horas
   );
   ```

2. **Intenta registrarte de nuevo**:
   - ✅ Debería permitir crear un nuevo registro
   - ✅ El registro antiguo debería eliminarse automáticamente

### **Escenario 2: Registro pendiente reciente con sesión activa**

1. **Inicia un registro de pago**:
   - Ve a un evento de pago
   - Haz click en "REGÍSTRATE"
   - Se crea la sesión de Stripe
   - **NO completes el pago**

2. **Intenta registrarte de nuevo inmediatamente**:
   - ✅ Debería redirigirte a la sesión de Stripe existente
   - ✅ O permitir crear una nueva si la sesión expiró

### **Escenario 3: Registro pagado**

1. **Completa un pago exitoso**
2. **Intenta registrarte de nuevo**:
   - ✅ Debería decir "Ya estás registrado en este evento"
   - ✅ No debería permitir crear un nuevo registro

---

## 🔍 Troubleshooting

### **Si aún dice "Ya estás registrado" pero no pagaste:**

1. **Verifica en Supabase**:
   ```sql
   SELECT 
     id,
     member_id,
     event_id,
     payment_status,
     status,
     registration_date,
     stripe_session_id
   FROM event_registrations
   WHERE member_id = 'tu-user-id'
     AND event_id = 'tu-event-id';
   ```

2. **Verifica el `payment_status`**:
   - Si es `'pending'` y tiene más de 2 horas, debería eliminarse automáticamente
   - Si es `'paid'`, entonces sí está registrado y pagado

3. **Elimina manualmente si es necesario**:
   ```sql
   DELETE FROM event_registrations
   WHERE member_id = 'tu-user-id'
     AND event_id = 'tu-event-id'
     AND payment_status = 'pending';
   ```

### **Si quieres limpiar todos los registros pendientes antiguos:**

Ejecuta el script SQL:

```sql
DELETE FROM event_registrations
WHERE 
  payment_status = 'pending' 
  AND status = 'pending'
  AND registration_date < NOW() - INTERVAL '2 hours';
```

O configura un CRON job automático (ver `supabase/cleanup-pending-registrations.sql`).

---

## ✅ CHECKLIST

- [x] Verificación inteligente de registros pendientes
- [x] Eliminación automática de registros antiguos (>2 horas)
- [x] Verificación de sesiones de Stripe activas
- [x] Manejo de errores mejorado
- [x] Cambios committed y pushed
- [ ] Usuario prueba el flujo completo
- [ ] Registros pendientes antiguos se eliminan automáticamente
- [ ] Usuarios pueden reintentar después de 2 horas
- [ ] No más bloqueos por registros pendientes

---

## 📝 Notas Adicionales

### **Tiempo de espera (2 horas)**

El tiempo de 2 horas es un balance entre:
- **Muy corto**: Eliminaría registros válidos que el usuario aún está procesando
- **Muy largo**: Bloquearía a usuarios que quieren reintentar

**Puedes ajustar este tiempo** modificando la condición:
```typescript
if (hoursSinceRegistration > 2) {  // Cambiar 2 por el número de horas deseado
```

### **Limpieza automática con CRON**

Para limpiar automáticamente todos los registros pendientes antiguos cada hora, ejecuta en Supabase:

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

---

**El problema está solucionado. Los usuarios pueden reintentar el registro después de 2 horas si no completaron el pago.**

