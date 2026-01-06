# 🔧 Solución: Email de Confirmación Redirige a Homepage

## 🔍 Problema Identificado

El enlace de confirmación de email está redirigiendo a:
```
https://www.runningeraclub.com/
```

En lugar de:
```
https://www.runningeraclub.com/auth/callback
```

**El enlace actual:**
```
https://dvuacieikqwuffsfxucc.supabase.co/auth/v1/verify?
  token=pkce_...
  &type=signup
  &redirect_to=https://www.runningeraclub.com/  ❌ MAL
```

**Debería ser:**
```
https://dvuacieikqwuffsfxucc.supabase.co/auth/v1/verify?
  token=pkce_...
  &type=signup
  &redirect_to=https://www.runningeraclub.com/auth/callback  ✅ CORRECTO
```

---

## ✅ Soluciones Implementadas

### 1. Código Actualizado

**Archivo: `app/miembros/login/page.tsx`**

Agregado `emailRedirectTo` en las opciones de signup:

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`, // ✅ AGREGADO
    data: {
      full_name: fullName,
      phone: phone,
      instagram: instagram,
    },
  },
});
```

---

## ⚙️ CONFIGURACIÓN CRÍTICA EN SUPABASE

### PASO 1: Configurar "Site URL"

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/url-configuration

2. Busca **"Site URL"**

3. Configura:
   ```
   https://www.runningeraclub.com
   ```
   (Sin trailing slash)

4. Guarda

---

### PASO 2: Configurar "Redirect URLs"

En la misma página, busca **"Redirect URLs"** y agrega:

```
http://localhost:3000/auth/callback
https://runningeraclub.com/auth/callback
https://www.runningeraclub.com/auth/callback
```

**Formato:**
- Una URL por línea
- Incluir `/auth/callback` al final
- Sin trailing slash

**⚠️ IMPORTANTE**: Deben coincidir EXACTAMENTE con las URLs que tu app usa.

---

### PASO 3: Verificar Variables de Entorno en Vercel

1. Ve a: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

2. Verifica que exista:
   ```
   NEXT_PUBLIC_URL = https://www.runningeraclub.com
   ```
   (Sin trailing slash ni `/auth/callback`)

3. Si no existe, agrégala:
   - Name: `NEXT_PUBLIC_URL`
   - Value: `https://www.runningeraclub.com`
   - Environments: Production, Preview, Development

4. **Redeploy** después de agregar

---

## 🔄 Flujo Correcto Después de la Corrección

```
1. Usuario se registra
   ↓
2. Supabase envía email con link:
   https://dvuacieikqwuffsfxucc.supabase.co/auth/v1/verify?
     token=...
     &type=signup
     &redirect_to=https://www.runningeraclub.com/auth/callback  ✅
   ↓
3. Usuario hace click en el link
   ↓
4. Supabase verifica el token
   ↓
5. Redirige a: https://www.runningeraclub.com/auth/callback
   ↓
6. El endpoint /auth/callback:
   - Intercambia el código por sesión
   - Crea/verifica perfil de member
   - Redirige a /cuenta-confirmada con parámetros del evento (si existe)
   ↓
7. Usuario ve página de "Cuenta Confirmada"
   ↓
8. Puede continuar con registro del evento o ir al dashboard
```

---

## 🧪 Cómo Probar

### Después de Hacer los Cambios:

1. **Deploy el código actualizado** (ya hecho)

2. **Configurar Supabase** (hazlo ahora):
   - Site URL: `https://www.runningeraclub.com`
   - Redirect URLs: incluir `/auth/callback`

3. **Probar con cuenta nueva:**
   ```
   a) Ve a /miembros/login
   b) Registra cuenta de prueba (usa email diferente)
   c) Revisa tu email (y spam)
   d) Click en el link de confirmación
   e) Verifica que te redirige a /cuenta-confirmada (NO homepage)
   f) Verifica que aparece el mensaje de éxito
   ```

4. **Verificar el link del email:**
   - Antes de hacer click, copia el link
   - Verifica que `redirect_to` incluya `/auth/callback`

---

## 📋 Checklist Completo

- [x] Código actualizado con `emailRedirectTo` en signup
- [x] Código subido a GitHub
- [x] Deploy automático en Vercel
- [ ] **TODO: Site URL configurada en Supabase**
- [ ] **TODO: Redirect URLs configuradas en Supabase**
- [ ] **TODO: NEXT_PUBLIC_URL verificada en Vercel**
- [ ] **TODO: Probado con cuenta nueva**

---

## ⚠️ Si Aún No Funciona

### Problema 1: Link Viejo Todavía en Tu Email

**Causa:** El email que recibiste fue generado ANTES de la corrección.

**Solución:**
1. Elimina el usuario actual en Supabase:
   - Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/users
   - Busca tu email
   - Elimina el usuario
2. Registra de nuevo con el mismo email
3. Recibirás un NUEVO email con el link correcto

---

### Problema 2: Site URL Mal Configurada

**Verifica:**
1. Site URL en Supabase: `https://www.runningeraclub.com` (sin trailing slash)
2. Redirect URLs incluyen: `https://www.runningeraclub.com/auth/callback`

---

### Problema 3: Cache del Navegador

**Solución:**
1. Abre ventana incógnito
2. Prueba desde ahí

---

## 🎯 Acción Inmediata

### AHORA MISMO:

1. **Ve a Supabase URL Configuration:**
   https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/url-configuration

2. **Configura Site URL:**
   ```
   https://www.runningeraclub.com
   ```

3. **Agrega Redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   https://runningeraclub.com/auth/callback
   https://www.runningeraclub.com/auth/callback
   ```

4. **Guarda**

5. **Elimina tu usuario actual** (porque el link viejo ya fue generado):
   - Auth Users → Buscar tu email → Delete

6. **Registra de nuevo** con el mismo email

7. **Revisa el NUEVO email**

8. **Click en el link** → Debería redirigir a `/cuenta-confirmada`

---

**El código ya está actualizado y deployed. Solo falta configurar Supabase.**

¿Ya configuraste el Site URL y Redirect URLs en Supabase?

