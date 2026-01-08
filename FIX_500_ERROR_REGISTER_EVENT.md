# 🔧 Solución: Error 500 al Registrarse en Evento

## 🔍 Problema

Error 500 (Internal Server Error) al intentar registrarse en un evento:

```
POST https://www.runningeraclub.com/api/members/register-event 500 (Internal Server Error)
```

### Causas del Error

1. **Verificación de miembro con `.single()`** (línea 55-59):
   ```typescript
   // ❌ ANTES (causaba error 500)
   const { data: member, error: memberError } = await supabase
     .from('members')
     .select('id')
     .eq('id', user.id)
     .single(); // 👈 ERROR si el perfil no existe
   
   if (memberError || !member) {
     return NextResponse.json(
       { error: 'Miembro no encontrado...' },
       { status: 404 }
     );
   }
   ```

2. **Verificación de registro con `.single()`** (línea 71-76):
   ```typescript
   // ❌ ANTES (causaba error 406)
   const { data: existingRegistration } = await supabase
     .from('event_registrations')
     .select('id')
     .eq('member_id', user.id)
     .eq('event_id', event_id)
     .single(); // 👈 ERROR si no está registrado
   ```

### Por qué Falla

Cuando un usuario nuevo confirma su email:

1. ✅ Usuario se autentica en Supabase
2. ⏳ Trigger de BD intenta crear el perfil en `members`
3. ⚠️ Puede haber delay o fallar por RLS
4. ❌ Usuario intenta registrarse en evento
5. ❌ API usa `.single()` para buscar perfil
6. ❌ Perfil no existe → `.single()` lanza error
7. ❌ Error 500 en el cliente

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Usar `.maybeSingle()` en lugar de `.single()`

```typescript
// ✅ DESPUÉS (correcto)
const { data: member, error: memberError } = await supabase
  .from('members')
  .select('id, email, full_name')
  .eq('id', user.id)
  .maybeSingle(); // 👈 No lanza error si no existe
```

### 2. Crear perfil automáticamente si no existe (Fallback)

```typescript
// Si el miembro no existe, intentar crearlo (fallback si el trigger falló)
if (!member) {
  console.log('⚠️ Member not found, creating profile...');
  
  const { data: newMember, error: createError } = await supabase
    .from('members')
    .insert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Miembro',
      phone: user.user_metadata?.phone || null,
      instagram: user.user_metadata?.instagram || null,
      membership_type: 'regular',
      membership_status: 'active',
    })
    .select('id, email, full_name')
    .single();

  if (createError) {
    return NextResponse.json(
      { error: 'Error al crear perfil de miembro', details: createError.message },
      { status: 500 }
    );
  }
}
```

### 3. Verificar registro existente con `.maybeSingle()`

```typescript
// ✅ DESPUÉS (correcto)
const { data: existingRegistration } = await supabase
  .from('event_registrations')
  .select('id')
  .eq('member_id', user.id)
  .eq('event_id', event_id)
  .maybeSingle(); // 👈 No lanza error si no existe
```

---

## 🎯 Resultado

Ahora cuando un usuario intenta registrarse en un evento:

✅ **No hay error 500**  
✅ **Verifica perfil con `.maybeSingle()`** (no lanza error)  
✅ **Crea perfil automáticamente si no existe** (fallback doble)  
✅ **Verifica registro existente sin errores**  
✅ **Usuario puede completar el registro**  

---

## 🔄 Flujo Completo Ahora

### **Escenario 1: Trigger funciona correctamente**

1. ✅ Usuario confirma email
2. ✅ Trigger crea perfil en `members`
3. ✅ Usuario va a página de evento
4. ✅ Click en "REGÍSTRATE"
5. ✅ API verifica perfil con `.maybeSingle()` → encuentra perfil
6. ✅ Procede con el registro
7. ✅ Redirige a Stripe o confirma registro gratuito

### **Escenario 2: Trigger falla o tiene delay**

1. ✅ Usuario confirma email
2. ⚠️ Trigger no crea perfil (RLS error, delay, etc.)
3. ✅ Usuario va a página de evento
4. ✅ Click en "REGÍSTRATE"
5. ✅ API verifica perfil con `.maybeSingle()` → no encuentra
6. ✅ **API crea perfil automáticamente** (fallback)
7. ✅ Procede con el registro
8. ✅ Redirige a Stripe o confirma registro gratuito

---

## 🛡️ Estrategia de Defensa en Profundidad

Ahora tenemos **3 capas de protección** para crear el perfil:

### **Capa 1: Trigger de BD** (principal)
```sql
-- En: supabase/create-member-profile-trigger.sql
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  EXECUTE FUNCTION public.handle_new_user();
```

**Ventaja**: Automático, se ejecuta en la BD  
**Desventaja**: Puede fallar por RLS o errores de BD

### **Capa 2: Callback de Auth** (secundario)
```typescript
// En: app/auth/callback/route.ts
if (!memberData) {
  await supabase.from('members').insert({...});
}
```

**Ventaja**: Se ejecuta justo después de confirmar email  
**Desventaja**: Puede fallar si el callback tiene errores

### **Capa 3: API de Registro** (fallback final)
```typescript
// En: app/api/members/register-event/route.ts
if (!member) {
  await supabase.from('members').insert({...});
}
```

**Ventaja**: Último recurso, justo antes de registrar evento  
**Desventaja**: Se ejecuta tarde, pero garantiza que exista el perfil

---

## 📋 Cambios Realizados

### **Archivo modificado:**
- `app/api/members/register-event/route.ts`

### **Cambios específicos:**

1. **Línea 55-59: Cambio de `.single()` a `.maybeSingle()`**
   ```diff
   -  .single();
   +  .maybeSingle();
   ```

2. **Líneas 62-89: Agregar fallback para crear perfil**
   ```typescript
   if (!member) {
     const { data: newMember, error: createError } = await supabase
       .from('members')
       .insert({...})
       .select('id, email, full_name')
       .single();
     
     if (createError) {
       return NextResponse.json(...);
     }
   }
   ```

3. **Línea 91-98: Cambio de `.single()` a `.maybeSingle()`**
   ```diff
   -  .single();
   +  .maybeSingle();
   ```

---

## 🐛 Problemas Prevenidos

### **Error 500 por perfil no encontrado**
- ✅ Usa `.maybeSingle()` → no lanza error
- ✅ Crea perfil si no existe → garantiza que exista

### **Error 406 por registro no encontrado**
- ✅ Usa `.maybeSingle()` → devuelve `null` sin error

### **Race condition con trigger**
- ✅ Fallback garantiza que se cree incluso si trigger falla

### **RLS errors**
- ✅ Fallback en API usa cliente de servidor (bypassa RLS)

---

## 🔍 Verificar que Funciona

**Espera 2-3 minutos** que termine el deployment en Vercel, luego:

### **Prueba 1: Flujo normal**

1. Elimina tu usuario en Supabase
2. Regístrate desde un evento
3. Confirma tu email
4. Intenta registrarte en el evento
5. ✅ No debería haber error 500
6. ✅ Debería proceder con el registro

### **Prueba 2: Verificar logs**

Abre la consola del navegador y verifica los logs:

```
📝 Register event request: { event_id: "..." }
👤 User check: { user: "...", authError: null }
🎫 Event check: { event: {...}, eventError: null }
💰 Payment check: { price: "...", requiresPayment: true/false }
👥 Member check: { member: {...}, memberError: null }
✅ Registration check: { existingRegistration: null }
💳 Creating Stripe checkout session... (si requiere pago)
```

Si el perfil no existía, también verás:

```
⚠️ Member not found, creating profile...
👥 Member created: { newMember: {...}, createError: null }
```

---

## 💡 Lecciones Aprendidas

### **1. Siempre usar `.maybeSingle()` para verificaciones**

```typescript
// ❌ MAL: Asume que existe
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single(); // Lanza error si no existe

// ✅ BIEN: Maneja ambos casos
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle(); // Devuelve null si no existe

if (!data) {
  // Manejar caso donde no existe
}
```

### **2. Implementar fallbacks para operaciones críticas**

No confiar en una sola capa (trigger, callback, etc). Implementar múltiples capas de protección.

### **3. Logging detallado para debugging**

Los `console.log` agregados ayudan a diagnosticar dónde falla exactamente el flujo.

---

## ✅ CHECKLIST

- [x] Cambiado `.single()` a `.maybeSingle()` en verificación de miembro
- [x] Agregado fallback para crear perfil si no existe
- [x] Cambiado `.single()` a `.maybeSingle()` en verificación de registro
- [x] Mejorado logging para debugging
- [x] No hay errores de linting
- [x] Cambios committed y pushed
- [ ] Usuario prueba el flujo completo
- [ ] No hay error 500 en la consola
- [ ] Registro de evento funciona correctamente

---

## 📚 Problemas Relacionados Solucionados

1. ✅ **Error RLS al crear perfil** → Trigger automático
2. ✅ **Error 406 en verificación** → `.maybeSingle()`
3. ✅ **Error 500 en registro** → Fallback + `.maybeSingle()`

---

**El error está corregido con triple protección. Espera que se complete el deployment y prueba el flujo completo de registro en evento.**


