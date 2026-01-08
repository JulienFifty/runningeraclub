# 🔧 Solución: Error 406 "Cannot coerce the result to a single JSON object"

## 🔍 Problema

Después de confirmar el email y ser redirigido a la página del evento, aparece un error 406:

```json
{
    "code": "PGRST116",
    "details": "The result contains 0 rows",
    "hint": null,
    "message": "Cannot coerce the result to a single JSON object"
}
```

### Request que falla:

```
GET https://dvuacieikqwuffsfxucc.supabase.co/rest/v1/event_registrations
    ?select=id%2Cstatus%2Cpayment_status
    &member_id=eq.07971c18-4f43-4194-8b45-2afea4043be1
    &event_id=eq.3a694be7-bc91-465a-96ec-1059b5825796

Status: 406 Not Acceptable
```

### Causa del Error

El error ocurría en `EventRegistrationButton.tsx` al verificar si el usuario ya está registrado en el evento:

```typescript
// ❌ ANTES (causaba error 406)
const registrationResult = await supabase
  .from('event_registrations')
  .select('id, status, payment_status')
  .eq('member_id', user.id)
  .eq('event_id', eventId)
  .single(); // 👈 ERROR: single() lanza error si no hay resultados

const attendeeResult = await supabase
  .from('attendees')
  .select('id, status')
  .eq('event_id', eventId)
  .eq('email', user.email || '')
  .single(); // 👈 ERROR: single() lanza error si no hay resultados
```

**Problema**: `.single()` espera **exactamente 1 resultado**. Si no hay resultados (como cuando un usuario nuevo acaba de confirmar su email y aún no se ha registrado), lanza un error 406.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Usar `.maybeSingle()` en lugar de `.single()`

`.maybeSingle()` devuelve:
- ✅ El objeto si hay 1 resultado
- ✅ `null` si no hay resultados (sin lanzar error)
- ❌ Error solo si hay múltiples resultados (lo cual no debería pasar)

```typescript
// ✅ DESPUÉS (correcto)
const registrationResult = await supabase
  .from('event_registrations')
  .select('id, status, payment_status')
  .eq('member_id', user.id)
  .eq('event_id', eventId)
  .maybeSingle(); // 👈 No lanza error si no hay resultados

const attendeeResult = await supabase
  .from('attendees')
  .select('id, status')
  .eq('event_id', eventId)
  .eq('email', user.email || '')
  .maybeSingle(); // 👈 No lanza error si no hay resultados
```

---

## 🎯 Resultado

Ahora cuando un usuario nuevo llega a la página del evento:

✅ **No hay error 406**  
✅ **La página carga correctamente**  
✅ **Se muestra el botón "REGÍSTRATE"**  
✅ **El usuario puede proceder con el registro**  

---

## 📋 Cuándo Usar `.single()` vs `.maybeSingle()`

### **Usar `.single()`:**

Cuando **siempre** esperas que exista el resultado:

```typescript
// ✅ Correcto: Buscar por ID único que debe existir
const { data: event } = await supabase
  .from('events')
  .select('*')
  .eq('id', eventId)
  .single();
```

**Casos apropiados:**
- Buscar un registro por ID que acabas de crear
- Buscar datos de usuario autenticado que debe existir
- Cuando el error es apropiado si no existe

---

### **Usar `.maybeSingle()`:**

Cuando el resultado **puede o no existir**:

```typescript
// ✅ Correcto: Verificar si existe un registro
const { data: registration } = await supabase
  .from('event_registrations')
  .select('*')
  .eq('member_id', userId)
  .eq('event_id', eventId)
  .maybeSingle();

if (registration) {
  // El usuario ya está registrado
} else {
  // El usuario NO está registrado
}
```

**Casos apropiados:**
- Verificar si existe un registro (puede no existir)
- Buscar configuraciones opcionales
- Cualquier búsqueda donde "no encontrado" es un resultado válido

---

## 🔄 Flujo Completo Ahora

1. ✅ Usuario confirma email desde el enlace
2. ✅ Redirect a `/cuenta-confirmada` con `event_slug`
3. ✅ Página de confirmación muestra evento
4. ✅ Usuario hace click en "Seguir con mi Registro"
5. ✅ Redirect a `/eventos/[slug]`
6. ✅ Página del evento carga **SIN ERROR**
7. ✅ `EventRegistrationButton` verifica registro con `.maybeSingle()`
8. ✅ No encuentra registro (devuelve `null` en lugar de error)
9. ✅ Muestra botón "REGÍSTRATE"
10. ✅ Usuario puede proceder con el registro

---

## 🐛 Otros Lugares Revisados

Revisé todos los usos de `.single()` en el código (37 ocurrencias). Los otros casos están correctos porque:

1. **Ya manejan el error**: Usan `if (error)` para capturar errores
2. **Esperan que exista**: Buscan por IDs únicos que deben existir
3. **Contexto apropiado**: El error es apropiado si no existe

Ejemplos que están bien:

```typescript
// ✅ OK: Maneja el error
const { data: member, error: memberError } = await supabase
  .from('members')
  .select('full_name, email')
  .eq('id', user.id)
  .single();

if (!memberError && member) {
  setMemberData(member);
}

// ✅ OK: Busca por slug único que debe existir (página del evento)
const { data: event } = await supabase
  .from('events')
  .select('*')
  .eq('slug', slug)
  .single();
```

---

## 📋 Cambios Realizados

### **Archivo modificado:**
- `src/components/EventRegistrationButton.tsx`

### **Líneas cambiadas:**

**Línea 49:**
```diff
-        .single();
+        .maybeSingle();
```

**Línea 56:**
```diff
-        .single();
+        .maybeSingle();
```

---

## ✅ CHECKLIST

- [x] Cambiado `.single()` a `.maybeSingle()` en verificación de registros
- [x] No hay errores de linting
- [x] Cambios committed y pushed
- [ ] Usuario prueba el flujo completo
- [ ] No hay error 406 en la consola
- [ ] Botón "REGÍSTRATE" aparece correctamente
- [ ] Usuario puede completar el registro

---

## 🔍 Verificar que Funciona

**Espera 2-3 minutos** que termine el deployment en Vercel, luego:

1. **Elimina tu usuario en Supabase**:
   - https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/users
   - Busca tu email → Elimina

2. **Regístrate desde un evento**:
   - https://www.runningeraclub.com/eventos/long-distance-run-w-nomapro
   - Click en "REGÍSTRATE"
   - Crea tu cuenta

3. **Confirma tu email**:
   - Revisa tu email
   - Click en el enlace de confirmación

4. **Verifica en la página del evento**:
   - ✅ No hay error 406 en la consola
   - ✅ La página carga correctamente
   - ✅ Aparece el botón "REGÍSTRATE"
   - ✅ Puedes hacer click y proceder con el registro

---

## 💡 Lección Aprendida

**Regla de oro para Supabase queries:**

- 🔴 `.single()` → Espera **exactamente** 1 resultado (lanza error si 0 o 2+)
- 🟢 `.maybeSingle()` → Espera **0 o 1** resultado (solo error si 2+)
- 🔵 Sin `.single()` → Devuelve array (puede estar vacío)

**Pregunta clave antes de usar `.single()`:**
> ¿Es un error que este registro NO exista?

- **SÍ** → Usa `.single()`
- **NO** → Usa `.maybeSingle()`

---

**El error está corregido. Espera que se complete el deployment y prueba el flujo de confirmación → registro.**


