# 🔧 Solución: Error "No API key found in request"

## 🔍 Problema

El error `"No API key found in request"` aparece en la homepage porque las **variables de entorno de Supabase no están configuradas en Vercel** (producción).

El código del cliente intenta crear una conexión a Supabase, pero las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están disponibles.

---

## ✅ SOLUCIÓN: Configurar Variables de Entorno en Vercel

### **PASO 1: Obtener las Claves de Supabase**

1. **Ve a tu proyecto en Supabase**:
   ```
   https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api
   ```

2. **Copia estas 2 claves**:
   - **Project URL**: algo como `https://dvuacieikqwuffsfxucc.supabase.co`
   - **anon/public key**: una clave larga que empieza con `eyJ...`

---

### **PASO 2: Configurar en Vercel**

1. **Ve a tu proyecto en Vercel**:
   ```
   https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables
   ```

2. **Agrega estas 2 variables de entorno**:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://dvuacieikqwuffsfxucc.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (la clave anon completa) |

3. **Selecciona todos los entornos**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Click en "Save"**

---

### **PASO 3: Redeployar**

Después de agregar las variables:

1. **Opción A: Redeploy automático**
   - Vercel detectará el cambio y redeployará automáticamente

2. **Opción B: Redeploy manual**
   - Ve a: https://vercel.com/[tu-username]/runningeraclub
   - Click en "Deployments"
   - Click en los 3 puntos del último deployment
   - Click en "Redeploy"

---

## 🔍 Verificar que Funcionó

1. **Espera 2-3 minutos** para que termine el deployment

2. **Abre tu sitio**: https://www.runningeraclub.com

3. **Abre la consola del navegador** (F12)

4. **Refresca la página**

5. **Verifica**:
   - ✅ No debería aparecer el error "No API key found"
   - ✅ La página debería cargar sin errores en la consola

---

## 📋 Variables de Entorno Necesarias

Tu proyecto necesita estas variables de entorno en Vercel:

### **Supabase (OBLIGATORIAS)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://dvuacieikqwuffsfxucc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### **Supabase Service Role (para webhooks)**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### **Stripe (para pagos)**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **URL del Sitio**
```env
NEXT_PUBLIC_URL=https://www.runningeraclub.com
```

---

## ⚠️ IMPORTANTE: Prefijo `NEXT_PUBLIC_`

Las variables que se usan en el **cliente** (navegador) DEBEN tener el prefijo `NEXT_PUBLIC_`:

✅ **Correcto**: `NEXT_PUBLIC_SUPABASE_URL`  
❌ **Incorrecto**: `SUPABASE_URL`

Las variables que se usan solo en el **servidor** NO necesitan el prefijo:

✅ **Correcto**: `SUPABASE_SERVICE_ROLE_KEY`  
✅ **Correcto**: `STRIPE_SECRET_KEY`

---

## 🔍 Troubleshooting

### **Si el error persiste después de configurar las variables:**

1. **Verifica que las variables estén bien escritas**:
   - Sin espacios extra
   - Sin comillas
   - Nombre exacto (case-sensitive)

2. **Verifica que el deployment se completó**:
   - Ve a: https://vercel.com/[tu-username]/runningeraclub/deployments
   - El último deployment debe tener estado "Ready"

3. **Limpia caché del navegador**:
   - Abre DevTools (F12)
   - Click derecho en el botón de refrescar
   - Click en "Empty Cache and Hard Reload"

4. **Verifica las variables en Vercel**:
   - Ve a: https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables
   - Asegúrate de que estén todas configuradas

### **Si las variables no aparecen en el deployment:**

1. **Verifica que seleccionaste "Production"** al agregar las variables
2. **Redeploya manualmente** después de agregarlas
3. **Espera a que termine el deployment** antes de probar

---

## 🎯 Resultado Esperado

Después de configurar las variables de entorno:

✅ **No más errores "No API key found"**  
✅ **Homepage carga sin errores**  
✅ **Autenticación funciona correctamente**  
✅ **Todas las features de Supabase funcionan**  

---

## 📋 CHECKLIST

- [ ] Copié las claves de Supabase (URL y anon key)
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_URL` en Vercel
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel
- [ ] Seleccioné Production, Preview y Development
- [ ] Guardé las variables
- [ ] Esperé a que termine el redeploy
- [ ] Refresqué la página con caché limpio
- [ ] No hay errores en la consola
- [ ] La página carga correctamente

---

## 🔑 Ubicación de las Claves

### **Supabase**
```
https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api
```

- **Project URL**: Section "Configuration"
- **anon/public key**: Section "Project API keys"
- **service_role key**: Section "Project API keys" (para webhooks)

### **Vercel**
```
https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables
```

---

**Configura las variables de entorno en Vercel ahora y el error desaparecerá.**

