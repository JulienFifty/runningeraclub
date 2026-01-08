# 🔧 Solución: Crear Perfil Automáticamente con Trigger

## 🔍 Problema

El error `"new row violates row-level security policy"` ocurre porque:

1. Cuando un usuario se registra, **aún no está autenticado** (necesita confirmar email)
2. RLS requiere que `auth.uid() = id`, pero `auth.uid()` es NULL hasta que confirme el email
3. Intentar crear el perfil en el signup falla por RLS

---

## ✅ SOLUCIÓN: Trigger Automático

En lugar de crear el perfil en el código, usaremos un **trigger de base de datos** que se ejecuta automáticamente cuando el usuario confirma su email.

---

## 📋 PASOS PARA IMPLEMENTAR

### **PASO 1: Ejecutar Script del Trigger**

1. **Ve a SQL Editor en Supabase**:
   ```
   https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/sql/new
   ```

2. **Abre el archivo**: `supabase/create-member-profile-trigger.sql`

3. **Copia TODO el contenido** del archivo

4. **Pega en el SQL Editor** de Supabase

5. **Click en "Run"**

6. **Verifica**: Deberías ver "Success" y una tabla con el trigger creado

---

### **PASO 2: Verificar que el Trigger Funciona**

Ejecuta esta query para verificar:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_confirmed';
```

Deberías ver:
```
on_auth_user_confirmed | UPDATE | users
```

---

### **PASO 3: Probar el Flujo Completo**

1. **Elimina tu usuario actual**:
   - Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/users
   - Busca tu email
   - Elimina el usuario

2. **Regístrate de nuevo**:
   - Ve a: https://www.runningeraclub.com/miembros/login
   - Crea una cuenta nueva

3. **Confirma tu email**:
   - Revisa tu email
   - Click en el enlace de confirmación

4. **Verifica que el perfil se creó**:
   - Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/editor
   - Tabla `members`
   - Busca tu email
   - ✅ Deberías ver tu perfil creado automáticamente

---

## 🎯 Cómo Funciona el Trigger

### **1. Función `handle_new_user()`**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (
    id, email, full_name, phone, instagram,
    membership_type, membership_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'instagram',
    'regular',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Características:**
- ✅ Usa `SECURITY DEFINER` para evitar problemas de RLS
- ✅ Extrae datos de `raw_user_meta_data` (lo que pasamos en signup)
- ✅ `ON CONFLICT DO NOTHING` previene errores si ya existe

### **2. Trigger `on_auth_user_confirmed`**

```sql
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
```

**Cuándo se ejecuta:**
- ✅ Cuando `email_confirmed_at` cambia de `NULL` a un timestamp
- ✅ Es decir, cuando el usuario confirma su email
- ✅ En ese momento, el usuario YA está autenticado, así que RLS funciona

---

## 🔄 Flujo Completo

```
1. Usuario se registra en /miembros/login
   ↓
2. Supabase crea usuario en auth.users (email_confirmed_at = NULL)
   ↓
3. Email de confirmación enviado
   ↓
4. Usuario hace click en el enlace
   ↓
5. Supabase actualiza auth.users (email_confirmed_at = timestamp)
   ↓
6. TRIGGER se ejecuta automáticamente
   ↓
7. Función handle_new_user() crea perfil en members
   ↓
8. Usuario redirigido a /cuenta-confirmada
   ↓
9. Perfil ya existe, todo funciona ✅
```

---

## ✅ Ventajas de Esta Solución

1. **No más errores de RLS**: El trigger usa `SECURITY DEFINER`
2. **Automático**: No necesitas código adicional
3. **Confiable**: Se ejecuta siempre que se confirma un email
4. **Sin duplicados**: `ON CONFLICT DO NOTHING` previene errores
5. **Backward compatible**: Crea perfiles para usuarios existentes

---

## 📋 CHECKLIST

- [ ] Ejecuté el script `create-member-profile-trigger.sql`
- [ ] Verifiqué que el trigger se creó correctamente
- [ ] Eliminé mi usuario actual en Auth Users
- [ ] Me registré de nuevo
- [ ] Confirmé mi email
- [ ] Verifiqué que mi perfil se creó en la tabla `members`
- [ ] No hay errores en la consola
- [ ] Puedo acceder a mi dashboard

---

## 🔍 Troubleshooting

### **Si el trigger no se crea:**

1. Verifica que tienes permisos de administrador en Supabase
2. Verifica que la tabla `members` existe
3. Revisa los errores en el SQL Editor

### **Si el perfil no se crea después de confirmar email:**

1. Verifica que el trigger existe:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_confirmed';
   ```

2. Verifica que la función existe:
   ```sql
   SELECT * FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. Verifica que el usuario confirmó su email:
   ```sql
   SELECT id, email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'tu@email.com';
   ```

### **Si hay errores de permisos:**

El trigger usa `SECURITY DEFINER`, así que debería funcionar. Si hay problemas:

1. Verifica que el usuario que ejecutó el script tiene permisos
2. Verifica que la función tiene `SECURITY DEFINER`

---

## 🎯 Resultado Final

Después de implementar el trigger:

✅ **No más errores de RLS** al registrarse  
✅ **Perfil creado automáticamente** al confirmar email  
✅ **Sin código adicional** necesario  
✅ **Funciona para usuarios nuevos y existentes**  

---

**Ejecuta el script del trigger ahora y prueba registrarte de nuevo.**


