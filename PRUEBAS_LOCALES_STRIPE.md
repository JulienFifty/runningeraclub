# 🧪 Guía: Probar Stripe Localmente

## ✅ SÍ, puedes cambiar las API keys en `.env.local`

Cuando pruebas localmente, puedes usar **cualquier clave** (test o live) en tu `.env.local`. Esto **NO afecta** a Vercel.

---

## 🎯 Opciones para Probar

### **Opción 1: Usar Claves de TEST (Recomendado para desarrollo)**

**Ventajas:**
- ✅ No hace cargos reales
- ✅ Puedes probar sin riesgo
- ✅ Stripe Dashboard muestra datos de test
- ✅ Ideal para desarrollo y debugging

**Configuración:**

1. **Ve a Stripe Dashboard en modo TEST**:
   ```
   https://dashboard.stripe.com/test/apikeys
   ```
   (Nota el `/test/` en la URL)

2. **Copia las claves de TEST**:
   - `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `sk_test_...` → `STRIPE_SECRET_KEY`

3. **Para el webhook secret de TEST**:
   - Ve a: https://dashboard.stripe.com/test/webhooks
   - Click en tu webhook de test
   - Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

4. **Actualiza tu `.env.local`**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (del webhook de test)
   ```

5. **Reinicia tu servidor de desarrollo**:
   ```bash
   npm run dev
   ```

---

### **Opción 2: Usar Claves de LIVE (Solo si quieres probar con pagos reales)**

**⚠️ ADVERTENCIA:**
- ❌ Hace cargos **REALES**
- ❌ Dinero real se cobra
- ❌ Solo usar si estás seguro

**Configuración:**

1. **Ve a Stripe Dashboard en modo LIVE**:
   ```
   https://dashboard.stripe.com/apikeys
   ```
   (Sin `/test/` en la URL)

2. **Copia las claves de LIVE**:
   - `pk_live_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `sk_live_...` → `STRIPE_SECRET_KEY`

3. **Para el webhook secret de LIVE**:
   - Ve a: https://dashboard.stripe.com/webhooks
   - Click en tu webhook de producción
   - Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

4. **Actualiza tu `.env.local`**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (del webhook de live)
   ```

5. **Reinicia tu servidor de desarrollo**:
   ```bash
   npm run dev
   ```

---

## 🔄 Cómo Cambiar entre TEST y LIVE

### **Método 1: Cambiar en `.env.local`**

Simplemente edita el archivo `.env.local` y cambia las claves:

```env
# Para TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Para LIVE (comenta las de test y descomenta estas)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
```

Luego reinicia el servidor:
```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

---

### **Método 2: Tener dos archivos**

Puedes tener dos archivos y renombrarlos según necesites:

1. **`.env.local.test`** - Con claves de test
2. **`.env.local.live`** - Con claves de live

Para cambiar:
```bash
# Usar test
cp .env.local.test .env.local

# Usar live
cp .env.local.live .env.local
```

---

## ⚠️ IMPORTANTE: Consistencia

**Regla de oro**: Todas las claves deben ser del mismo modo:

✅ **CORRECTO**:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (de test)
```

❌ **INCORRECTO** (mezclar test y live):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_live_...  # ❌ Mezclado!
```

---

## 🧪 Probar con Tarjetas de Test

Si usas claves de **TEST**, puedes usar estas tarjetas de prueba:

### **Tarjetas que funcionan:**

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 0002` | ❌ Pago rechazado |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |

### **Datos de prueba:**

- **CVV**: Cualquier 3 dígitos (ej: `123`)
- **Fecha**: Cualquier fecha futura (ej: `12/25`)
- **Código postal**: Cualquier código (ej: `12345`)

---

## 🔍 Verificar que Funciona

### **1. Verificar en la Consola**

Cuando inicies el servidor, deberías ver:
```
✓ Ready in X ms
```

Si hay errores de Stripe, verás:
```
Error: STRIPE_SECRET_KEY no está definido
```

### **2. Probar un Pago**

1. Ve a: http://localhost:3000/eventos/[slug]
2. Click en "REGÍSTRATE"
3. Completa el registro
4. Deberías ser redirigido a Stripe Checkout
5. Usa una tarjeta de test
6. Completa el pago

### **3. Verificar en Stripe Dashboard**

- **Modo TEST**: https://dashboard.stripe.com/test/payments
- **Modo LIVE**: https://dashboard.stripe.com/payments

Deberías ver el pago en el dashboard correspondiente.

---

## 📋 Checklist para Probar Localmente

- [ ] Claves de Stripe configuradas en `.env.local`
- [ ] Todas las claves son del mismo modo (test o live)
- [ ] Webhook secret configurado correctamente
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Probado con tarjeta de test (si usas modo test)
- [ ] Verificado en Stripe Dashboard

---

## 🚨 Problemas Comunes

### **Error: "STRIPE_SECRET_KEY no está definido"**

**Causa**: La variable no está en `.env.local` o el servidor no se reinició.

**Solución**:
1. Verifica que `.env.local` existe y tiene `STRIPE_SECRET_KEY=...`
2. Detén el servidor (Ctrl+C)
3. Reinicia: `npm run dev`

---

### **Error: "Invalid API Key provided"**

**Causa**: Clave incorrecta o mezclada (test con live).

**Solución**:
1. Verifica que todas las claves sean del mismo modo
2. Copia las claves de nuevo desde Stripe Dashboard
3. Asegúrate de estar en el modo correcto (test o live)

---

### **Error: "Webhook signature verification failed"**

**Causa**: Webhook secret incorrecto o del modo equivocado.

**Solución**:
1. Verifica que el webhook secret sea del mismo modo (test o live)
2. Copia el secret de nuevo desde Stripe Dashboard
3. Asegúrate de estar en el modo correcto

---

## 💡 Recomendación

**Para desarrollo local**: Usa claves de **TEST**

**Razones**:
- ✅ No hace cargos reales
- ✅ Puedes probar sin riesgo
- ✅ Stripe Dashboard muestra datos de test
- ✅ Ideal para debugging

**Solo usa LIVE si**:
- Estás probando el flujo completo antes de producción
- Estás seguro de que quieres hacer un pago real
- Ya probaste todo en modo test

---

## 📝 Ejemplo de `.env.local` Completo

```env
# ==================== SUPABASE ====================
NEXT_PUBLIC_SUPABASE_URL=https://dvuacieikqwuffsfxucc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ==================== STRIPE (TEST) ====================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# ==================== APLICACIÓN ====================
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## ✅ Resumen

1. ✅ **SÍ puedes cambiar** las claves en `.env.local`
2. ✅ **Recomendado**: Usar claves de **TEST** para desarrollo
3. ✅ **Importante**: Todas las claves deben ser del mismo modo
4. ✅ **Reiniciar** el servidor después de cambiar `.env.local`
5. ✅ **Probar** con tarjetas de test si usas modo test

---

**¡Listo para probar localmente!** 🚀

