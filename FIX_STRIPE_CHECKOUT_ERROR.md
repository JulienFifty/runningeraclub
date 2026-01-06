# 🔧 Solución: Error al Crear Sesión de Pago en Stripe

## 🔍 Problema

Error 500 al intentar crear la sesión de pago de Stripe:

```json
{
    "error": "Error al crear sesión de pago",
    "details": "Error al crear sesión de pago"
}
```

### Causas Posibles del Error

1. **Uso de `.single()` en lugar de `.maybeSingle()`**
   - Línea 132: Buscar miembro
   - Línea 169: Buscar attendee
   - Si el perfil no existe, `.single()` lanza error

2. **Variables de entorno de Stripe no configuradas**
   - `STRIPE_SECRET_KEY` no está en Vercel
   - Clave inválida o de test en producción

3. **Error de autenticación con Stripe**
   - Clave incorrecta
   - Cuenta de Stripe no activada

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Cambio de `.single()` a `.maybeSingle()`

```typescript
// ❌ ANTES (causaba error si no existe)
const { data: member } = await supabase
  .from('members')
  .select('stripe_customer_id, email, full_name')
  .eq('id', member_id)
  .single();

// ✅ DESPUÉS (correcto)
const { data: member, error: memberError } = await supabase
  .from('members')
  .select('stripe_customer_id, email, full_name')
  .eq('id', member_id)
  .maybeSingle();

console.log('👤 Member lookup:', { member_id, found: !!member, error: memberError });

if (!member) {
  return NextResponse.json(
    { error: 'Perfil de miembro no encontrado. Por favor recarga la página e intenta de nuevo.' },
    { status: 404 }
  );
}
```

### 2. Mejor Manejo de Errores de Stripe

```typescript
} catch (error: any) {
  console.error('❌ Error creating checkout session:', error);
  
  // Errores específicos de Stripe
  if (error.type === 'StripeInvalidRequestError') {
    return NextResponse.json(
      { 
        error: 'Error de configuración de pago', 
        details: error.message,
        hint: 'Verifica que las claves de Stripe estén configuradas correctamente en Vercel'
      },
      { status: 500 }
    );
  }
  
  if (error.type === 'StripeAuthenticationError') {
    return NextResponse.json(
      { 
        error: 'Error de autenticación con Stripe', 
        details: 'Las credenciales de Stripe son inválidas',
        hint: 'Configura STRIPE_SECRET_KEY en las variables de entorno de Vercel'
      },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Error al crear sesión de pago', 
      details: error.message,
      type: error.type || 'Unknown'
    },
    { status: 500 }
  );
}
```

### 3. Logging Mejorado

Ahora se registran logs detallados:

```typescript
console.log('👤 Member lookup:', { member_id, found: !!member, error: memberError });
console.log('💳 Creando nuevo cliente en Stripe para:', customerEmail);
console.log('✅ Nuevo cliente Stripe creado:', stripeCustomerId);
```

---

## ⚙️ CONFIGURAR VARIABLES DE ENTORNO DE STRIPE EN VERCEL

Si el error persiste después del deployment, probablemente las variables de Stripe no están configuradas.

### **PASO 1: Obtener Claves de Stripe**

1. **Ve a tu Dashboard de Stripe**:
   ```
   https://dashboard.stripe.com/apikeys
   ```

2. **Copia las claves** (modo live, no test):
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (click en "Reveal")

3. **Obtén el Webhook Secret**:
   - Ve a: https://dashboard.stripe.com/webhooks
   - Click en tu webhook de producción
   - Copia el **Signing secret**: `whsec_...`

---

### **PASO 2: Configurar en Vercel**

1. **Ve a tu proyecto en Vercel**:
   ```
   https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables
   ```

2. **Verifica que estas variables estén configuradas**:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Secret key de Stripe | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |

3. **Selecciona todos los entornos**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Click en "Save"**

---

### **PASO 3: Redeploy**

Después de configurar las variables:

1. Ve a: https://vercel.com/[tu-username]/runningeraclub/deployments
2. Click en los 3 puntos del último deployment
3. Click en "Redeploy"
4. Espera 2-3 minutos

---

## ⚠️ IMPORTANTE: Modo Test vs Modo Live

### **Modo Test (Desarrollo)**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- ✅ Usar en desarrollo local
- ✅ No hace cargos reales
- ❌ NO usar en producción

### **Modo Live (Producción)**
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

- ✅ Usar en producción (Vercel)
- ✅ Hace cargos reales
- ⚠️ Requiere cuenta Stripe activada

---

## 🔍 Verificar que Funciona

### **1. Revisar Logs en Vercel**

1. Ve a: https://vercel.com/[tu-username]/runningeraclub/logs
2. Filtra por "Error"
3. Busca mensajes como:
   - `❌ Error creating checkout session`
   - `Error de autenticación con Stripe`
   - `STRIPE_SECRET_KEY no está definido`

### **2. Probar el Flujo Completo**

1. **Elimina tu usuario** en Supabase
2. **Regístrate** desde un evento de pago
3. **Confirma tu email**
4. **Click en "REGÍSTRATE"**
5. **Verificar**:
   - ✅ No hay error 500
   - ✅ Se crea la sesión de Stripe
   - ✅ Redirige a Stripe Checkout
   - ✅ Puedes completar el pago

### **3. Verificar en Consola del Navegador**

Deberías ver logs como:

```
📝 Register event request: { event_id: "..." }
👤 User check: { user: "...", authError: null }
🎫 Event check: { event: {...}, eventError: null }
💰 Payment check: { price: "...", requiresPayment: true }
👥 Member check: { member: {...}, memberError: null }
✅ Registration check: { existingRegistration: null }
💳 Creating Stripe checkout session...
💳 Checkout response: { ok: true, data: {...} }
📋 Registration created: { registrationError: null }
```

---

## 🐛 Troubleshooting

### **Error: "STRIPE_SECRET_KEY no está definido"**

**Causa**: La variable no está configurada en Vercel

**Solución**:
1. Configura `STRIPE_SECRET_KEY` en Vercel
2. Redeploy
3. Espera 2-3 minutos

### **Error: "Error de autenticación con Stripe"**

**Causa**: La clave de Stripe es inválida

**Solución**:
1. Ve a https://dashboard.stripe.com/apikeys
2. Verifica que la clave esté correcta
3. Copia la clave de nuevo (Reveal)
4. Actualiza en Vercel
5. Redeploy

### **Error: "Invalid API Key provided"**

**Causa**: Clave de test en producción o viceversa

**Solución**:
1. Verifica que uses claves `sk_live_...` en producción
2. Verifica que uses claves `sk_test_...` en desarrollo
3. No mezcles claves de test y live

### **Error: "Perfil de miembro no encontrado"**

**Causa**: El trigger de BD no creó el perfil a tiempo

**Solución**:
1. Recarga la página
2. Intenta de nuevo
3. El fallback en `/api/members/register-event` debería crear el perfil

---

## 📋 Cambios Realizados

### **Archivo modificado:**
- `app/api/stripe/create-checkout/route.ts`

### **Cambios específicos:**

1. **Línea 128-132: `.single()` → `.maybeSingle()`**
   ```diff
   -  .single();
   +  .maybeSingle();
   ```

2. **Línea 134-138: Agregar validación de miembro**
   ```typescript
   if (!member) {
     return NextResponse.json(
       { error: 'Perfil de miembro no encontrado...' },
       { status: 404 }
     );
   }
   ```

3. **Línea 148: Agregar logging**
   ```typescript
   console.log('💳 Creando nuevo cliente en Stripe para:', customerEmail);
   ```

4. **Línea 171: `.single()` → `.maybeSingle()` para attendees**

5. **Línea 308-333: Mejorar manejo de errores**
   - Detectar errores específicos de Stripe
   - Mensajes más descriptivos
   - Hints para solucionar

---

## ✅ CHECKLIST

- [x] Cambiado `.single()` a `.maybeSingle()` en miembro
- [x] Cambiado `.single()` a `.maybeSingle()` en attendee
- [x] Agregado validación de miembro
- [x] Mejorado logging
- [x] Mejorado manejo de errores de Stripe
- [x] Cambios committed y pushed
- [ ] Variables de Stripe configuradas en Vercel
- [ ] Redeployed en Vercel
- [ ] Usuario prueba el flujo completo
- [ ] Sesión de Stripe se crea correctamente
- [ ] Usuario puede completar el pago

---

## 🎯 Próximos Pasos

1. **Configura las variables de Stripe en Vercel** (si no lo has hecho)
2. **Espera el deployment** (2-3 minutos)
3. **Prueba el flujo completo** de registro y pago
4. **Revisa los logs** en la consola del navegador
5. **Revisa los logs** en Vercel si hay errores

---

**Si el error persiste después de configurar las variables y redeploy, comparte:**
- Los logs de la consola del navegador
- Los logs de Vercel
- El mensaje de error exacto

**Para ayudarte mejor.**

