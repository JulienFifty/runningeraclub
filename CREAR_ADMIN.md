# 🔐 Crear Usuario Admin - Guía Completa

## Opción 1: Crear Admin desde Supabase Dashboard (Recomendado)

### Paso 1: Crear usuario en Supabase Auth

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral, ve a **Authentication** → **Users**
3. Click en **"Add user"** o **"Create user"**
4. Completa el formulario:
   - **Email**: `tu@email.com` (tu email)
   - **Password**: Crea una contraseña segura
   - **Auto Confirm User**: ✅ Marca esta opción (para evitar verificación de email)
5. Click en **"Create user"**

### Paso 2: Agregar a tabla admins

1. Ve a **SQL Editor** en Supabase
2. Copia y pega este SQL (cambia `tu@email.com` por tu email):

```sql
INSERT INTO admins (email)
VALUES ('tu@email.com')
ON CONFLICT (email) DO NOTHING;
```

3. Ejecuta el script
4. Verifica que se creó:

```sql
SELECT * FROM admins;
```

### Paso 3: Probar login

1. Ve a `http://localhost:3000/admin/login`
2. Ingresa tu email y contraseña
3. Deberías poder acceder al panel admin

---

## Opción 2: Usar el script SQL completo

Si ya tienes el usuario creado en auth.users:

1. Ve a **SQL Editor** en Supabase
2. Copia el contenido de `supabase/create-admin.sql`
3. **Cambia `tu@email.com` por tu email real**
4. Ejecuta el script

---

## Opción 3: Crear desde la línea de comandos (Supabase CLI)

Si tienes Supabase CLI instalado:

```bash
# 1. Crear usuario en auth
supabase auth users create \
  --email tu@email.com \
  --password tu_contraseña_segura \
  --email-confirmed

# 2. Ejecutar SQL para agregar a tabla admins
supabase db execute -f supabase/create-admin.sql
```

---

## ✅ Verificación

Después de crear el admin, verifica que todo funciona:

```sql
-- Ver todos los admins
SELECT * FROM admins;

-- Verificar que el usuario existe en auth
SELECT email FROM auth.users WHERE email = 'tu@email.com';
```

---

## 🔒 Seguridad

- ✅ Usa contraseñas seguras (mínimo 8 caracteres, con números y símbolos)
- ✅ No compartas tus credenciales
- ✅ El email debe ser único en la tabla `admins`
- ✅ Solo usuarios en la tabla `admins` pueden acceder al panel

---

## 🆘 Problemas Comunes

### "Acceso denegado" al hacer login
- ✅ Verifica que el email esté en la tabla `admins`
- ✅ Verifica que el usuario existe en `auth.users`
- ✅ El email debe coincidir exactamente (mayúsculas/minúsculas)

### "Usuario no encontrado"
- ✅ Asegúrate de crear el usuario primero en Authentication → Users
- ✅ Verifica que el email esté correcto en ambos lugares

### "Email already registered"
- ✅ El usuario ya existe en auth.users
- ✅ Solo necesitas agregarlo a la tabla `admins` con el SQL

---

**Listo! Ahora puedes hacer login en `/admin/login` con tu email y contraseña** 🎉





