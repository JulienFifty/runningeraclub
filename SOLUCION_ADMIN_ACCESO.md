# 🔧 Solución: "No tengo permiso de admin"

Si ya tienes el admin en la tabla pero el login te dice "Acceso denegado", el problema es que **faltan las políticas RLS** para la tabla `admins`.

## ✅ Solución Rápida:

### Paso 1: Ejecutar el script SQL

1. Ve a tu **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `supabase/admins-rls-policy.sql`
3. Ejecuta el script

O ejecuta directamente este SQL:

```sql
-- Crear función helper (si no existe)
CREATE OR REPLACE FUNCTION auth_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Crear política RLS para admins
DROP POLICY IF EXISTS "Users can check if they are admin" ON admins;

CREATE POLICY "Users can check if they are admin" ON admins
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    email = auth_user_email()
  );
```

### Paso 2: Verificar que el usuario existe en Auth

1. Ve a **Authentication** → **Users** en Supabase
2. Verifica que existe el usuario con email `zavalaaoe@gmail.com`
3. Si NO existe, créalo:
   - Click en "Add user"
   - Email: `zavalaaoe@gmail.com`
   - Password: tu contraseña
   - ✅ Marca "Auto Confirm User"
   - Click "Create user"

### Paso 3: Verificar en la tabla admins

```sql
-- Debe aparecer tu email
SELECT * FROM admins WHERE email = 'zavalaaoe@gmail.com';
```

### Paso 4: Probar login de nuevo

1. Ve a `http://localhost:3000/admin/login`
2. Email: `zavalaaoe@gmail.com`
3. Password: la que configuraste en Auth
4. Debería funcionar ahora

---

## 🔍 Verificación Completa

Ejecuta este SQL para verificar todo:

```sql
-- 1. Verificar que el admin existe en la tabla
SELECT * FROM admins;

-- 2. Verificar que el usuario existe en auth.users
SELECT email, id FROM auth.users WHERE email = 'zavalaaoe@gmail.com';

-- 3. Verificar las políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'admins';

-- 4. Verificar la función auth_user_email
SELECT auth_user_email();
```

---

## 🆘 Si todavía no funciona:

### Opción 1: Política más permisiva (solo para desarrollo)

Si la política anterior no funciona, prueba esta (menos segura pero permite el acceso):

```sql
DROP POLICY IF EXISTS "Users can check if they are admin" ON admins;

CREATE POLICY "Authenticated users can view admins" ON admins
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

### Opción 2: Verificar que RLS está habilitado

```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admins';

-- Si rowsecurity es false, habilítalo:
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

### Opción 3: Deshabilitar RLS temporalmente (solo para testing)

⚠️ **NO usar en producción**

```sql
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist Completo:

- [ ] Usuario existe en `auth.users` (Authentication → Users)
- [ ] Email está en la tabla `admins` (Table Editor)
- [ ] Políticas RLS creadas (ejecutar `admins-rls-policy.sql`)
- [ ] Función `auth_user_email()` existe
- [ ] RLS está habilitado en la tabla `admins`
- [ ] Email coincide exactamente en ambos lugares (case-sensitive)

---

**Después de ejecutar el script, el login debería funcionar** ✅



