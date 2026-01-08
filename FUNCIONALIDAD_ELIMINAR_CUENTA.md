# 🗑️ Funcionalidad: Eliminar Cuenta de Usuario

## ✅ Implementado

Se ha agregado la opción para que los usuarios puedan eliminar permanentemente su cuenta y todos sus datos desde su perfil.

---

## 📍 Ubicación

**Página de Perfil**: `/miembros/perfil`

La opción aparece al final del formulario de perfil, en una sección llamada **"Zona Peligrosa"**.

---

## 🔧 Funcionalidades Implementadas

### 1. **Botón de Eliminar Cuenta**

- Ubicado en una sección destacada con advertencia visual (rojo)
- Muestra claramente que la acción es permanente
- Al hacer click, abre un modal de confirmación

### 2. **Modal de Confirmación**

El modal incluye:

✅ **Advertencia clara**:
- Acción permanente e irreversible
- Lista de todo lo que se eliminará

✅ **Doble verificación**:
- El usuario debe escribir "ELIMINAR" (en mayúsculas) para confirmar
- El botón de eliminar solo se activa cuando se escribe correctamente

✅ **Feedback visual**:
- Iconos de alerta
- Colores rojos para indicar peligro
- Estado de carga mientras se elimina

### 3. **Proceso de Eliminación Completo**

La eliminación se realiza en el siguiente orden:

1. **Registros de eventos** (`event_registrations`)
   - Todos los registros del usuario en eventos

2. **Conexiones de Strava** (`strava_connections`)
   - Si el usuario conectó Strava

3. **Avatar en Storage** (`avatars`)
   - Foto de perfil en Supabase Storage

4. **Perfil de miembro** (`members`)
   - Todos los datos personales

5. **Cuenta de autenticación** (`auth.users`)
   - Usuario de Supabase Auth

6. **Cierre de sesión**
   - Limpia cookies y sesión
   - Redirige al homepage

---

## 🔐 Seguridad

### **Verificación de Autenticación**
- Solo el usuario autenticado puede eliminar su propia cuenta
- El endpoint API verifica la sesión antes de proceder

### **Confirmación Doble**
- El usuario debe escribir "ELIMINAR" para confirmar
- Previene eliminaciones accidentales

### **Service Role Key**
- La eliminación de Auth Users requiere Service Role Key
- Se usa el cliente admin de Supabase con permisos elevados

---

## 📁 Archivos Modificados/Creados

### **Creado:**

#### `app/api/members/delete-account/route.ts`
Endpoint API para eliminar la cuenta del usuario.

**Responsabilidades:**
- Verificar autenticación
- Eliminar datos en cascada (registros, strava, storage, member, auth)
- Logging detallado de cada paso
- Manejo de errores robusto
- Cerrar sesión

### **Modificado:**

#### `app/miembros/perfil/page.tsx`
Página de perfil del usuario.

**Cambios:**
- Agregado botón "Eliminar Cuenta" en sección "Zona Peligrosa"
- Agregado modal de confirmación con validación
- Agregado estados (`deleting`, `showDeleteModal`, `deleteConfirmText`)
- Agregado función `handleDeleteAccount()`
- Importado iconos `Trash2`, `AlertTriangle`

---

## 🔍 Flujo Completo

```
1. Usuario va a /miembros/perfil
   ↓
2. Scroll hasta el final → ve "Zona Peligrosa"
   ↓
3. Click en "Eliminar Cuenta"
   ↓
4. Modal se abre con advertencias
   ↓
5. Usuario lee que se eliminará:
   - Perfil y datos personales
   - Registros de eventos
   - Fotos y archivos
   - Conexiones y configuraciones
   - Cuenta de autenticación
   ↓
6. Usuario escribe "ELIMINAR" (en mayúsculas)
   ↓
7. Botón de eliminar se activa
   ↓
8. Click en "Eliminar Cuenta"
   ↓
9. Llamada a /api/members/delete-account (DELETE)
   ↓
10. API verifica autenticación
    ↓
11. API elimina en orden:
    - event_registrations
    - strava_connections
    - avatars (storage)
    - members
    - auth.users
    ↓
12. API cierra sesión
    ↓
13. Toast de éxito: "Cuenta eliminada"
    ↓
14. Redirección a homepage (/)
    ↓
15. Usuario ve homepage como visitante
```

---

## 📊 Datos Eliminados

### **1. Tabla: `event_registrations`**
```sql
DELETE FROM event_registrations WHERE member_id = [user_id];
```

### **2. Tabla: `strava_connections`**
```sql
DELETE FROM strava_connections WHERE user_id = [user_id];
```

### **3. Storage: `avatars`**
```typescript
supabase.storage.from('avatars').remove([`${userId}/*`]);
```

### **4. Tabla: `members`**
```sql
DELETE FROM members WHERE id = [user_id];
```

### **5. Auth: `auth.users`**
```typescript
supabaseAdmin.auth.admin.deleteUser(userId);
```

---

## ⚠️ IMPORTANTE: Service Role Key

### **Requisito:**

El endpoint API requiere la variable de entorno:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**Dónde obtenerla:**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api

2. Copia la **Service Role Key** (no la anon key)

3. Agrégala a tu `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Agrégala a **Vercel** (Producción):
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [tu service role key]
   - Redeploy

**⚠️ CRÍTICO:**
- La Service Role Key tiene permisos administrativos completos
- NUNCA la expongas en el cliente (solo úsala en backend/API routes)
- NO la subas a GitHub (está en `.gitignore`)

---

## 🧪 Cómo Probar

### **1. Desarrollo Local:**

```bash
# Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en .env.local
npm run dev
```

1. Crea una cuenta de prueba
2. Ve a `/miembros/perfil`
3. Scroll hasta "Zona Peligrosa"
4. Click en "Eliminar Cuenta"
5. Escribe "ELIMINAR"
6. Click en "Eliminar Cuenta"
7. Verifica:
   - Toast de éxito
   - Redirección a homepage
   - Sesión cerrada
   - Usuario eliminado de Supabase Dashboard

### **2. Producción:**

⚠️ **Solo prueba con cuenta de prueba**, no con cuenta real.

1. Agrega `SUPABASE_SERVICE_ROLE_KEY` a Vercel
2. Redeploy
3. Crea cuenta de prueba en producción
4. Sigue los pasos de arriba

---

## 📋 Checklist de Implementación

- [x] Endpoint API creado (`/api/members/delete-account`)
- [x] Verificación de autenticación
- [x] Eliminación de `event_registrations`
- [x] Eliminación de `strava_connections`
- [x] Eliminación de avatars en Storage
- [x] Eliminación de perfil en `members`
- [x] Eliminación de usuario en Auth
- [x] Cierre de sesión
- [x] Botón en página de perfil
- [x] Modal de confirmación
- [x] Validación de texto "ELIMINAR"
- [x] Estados de carga
- [x] Feedback con toasts
- [x] Redirección después de eliminar
- [x] Logging detallado
- [x] Manejo de errores
- [ ] **TODO: Agregar `SUPABASE_SERVICE_ROLE_KEY` a Vercel**

---

## 🔄 Siguiente Paso: Configurar Service Role Key en Vercel

### **PASO 1: Obtener Service Role Key**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api
2. Copia la **Service Role Key** (la larga, no la anon key)

### **PASO 2: Agregar a Vercel**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: `runningeraclub`
3. Settings → Environment Variables
4. Click "Add New"
5. Configura:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [pega tu service role key]
   Environment: Production, Preview, Development (marca todos)
   ```
6. Click "Save"

### **PASO 3: Redeploy**

1. Ve a la pestaña "Deployments"
2. Click en el último deployment
3. Click en "Redeploy"
4. Espera que termine

### **PASO 4: Probar**

1. Crea cuenta de prueba en producción
2. Ve a perfil
3. Intenta eliminar cuenta
4. Verifica que funcione

---

## 🎯 Resultado Final

Los usuarios ahora pueden:

✅ **Eliminar su cuenta** desde su perfil  
✅ **Ver claramente** que la acción es permanente  
✅ **Confirmar la acción** escribiendo "ELIMINAR"  
✅ **Recibir feedback** durante el proceso  
✅ **Ser redirigidos** al homepage después  

**Cumple con regulaciones como GDPR** que requieren dar a los usuarios control sobre sus datos.

---

**Deploy completando en 1-2 minutos.**

Después del deploy, **agrega la Service Role Key en Vercel** y prueba la funcionalidad.


