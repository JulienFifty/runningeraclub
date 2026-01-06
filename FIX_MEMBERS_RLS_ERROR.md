# 🔧 Solución: Error al Crear Perfil (RLS Policy)

## 🔍 Errores Identificados

```
❌ "No API key found in request"
❌ "new row violates row-level security policy for table 'members'"
```

---

## 📊 Causa del Problema

Las **políticas de Row Level Security (RLS)** en la tabla `members` están bloqueando la creación de perfiles cuando los usuarios se registran.

Esto sucede porque:
1. RLS está habilitado en la tabla `members`
2. No hay una política que permita a los usuarios crear su propio perfil
3. O la política existente está mal configurada

---

## ✅ SOLUCIÓN: Ejecutar Script SQL

### **PASO 1: Abrir SQL Editor en Supabase**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/sql/new

2. Verás el editor SQL

---

### **PASO 2: Ejecutar el Script**

1. **Abre el archivo**: `supabase/fix-members-rls-policies.sql`

2. **Copia TODO el contenido** del archivo

3. **Pega en el SQL Editor** de Supabase

4. Click en el botón **"Run"** (esquina inferior derecha)

5. **Espera confirmación**: Deberías ver "Success. No rows returned"

---

### **PASO 3: Verificar las Políticas**

Después de ejecutar el script, verás una tabla con las políticas creadas:

```
policyname                           | cmd    | roles
-------------------------------------|--------|-------------
Users can insert their own profile   | INSERT | authenticated
Users can view their own profile     | SELECT | authenticated
Users can update their own profile   | UPDATE | authenticated
Users can delete their own profile   | DELETE | authenticated
```

---

## 🎯 Qué Hace el Script

### **1. Limpia Políticas Antiguas**
Elimina cualquier política que pueda estar causando conflictos.

### **2. Crea Políticas Nuevas**

#### **INSERT (Crear perfil)**
```sql
CREATE POLICY "Users can insert their own profile"
ON members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```
✅ Permite que usuarios autenticados creen su propio perfil.

#### **SELECT (Ver perfil)**
```sql
CREATE POLICY "Users can view their own profile"
ON members
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```
✅ Permite que usuarios vean su propio perfil.

#### **UPDATE (Actualizar perfil)**
```sql
CREATE POLICY "Users can update their own profile"
ON members
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```
✅ Permite que usuarios actualicen su propio perfil.

#### **DELETE (Eliminar perfil)**
```sql
CREATE POLICY "Users can delete their own profile"
ON members
FOR DELETE
TO authenticated
USING (auth.uid() = id);
```
✅ Permite que usuarios eliminen su propio perfil.

---

## 🧪 Probar Después del Fix

### **PASO 1: Elimina tu Usuario Actual**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/auth/users
2. Busca tu email: `basurabusiness@gmail.com`
3. Click en el usuario → **"Delete user"**
4. Confirma

### **PASO 2: Registra de Nuevo**

1. Ve a: https://www.runningeraclub.com/miembros/login
2. Cambia a "Crear Cuenta"
3. Llena el formulario
4. Click en "Crear Cuenta"

### **PASO 3: Verifica en la Consola**

Ahora NO deberías ver:
- ❌ "No API key found in request"
- ❌ "new row violates row-level security policy"

Deberías ver:
- ✅ "¡Registro exitoso!"
- ✅ Redirección a la página de confirmación de email

---

## 🔍 Verificar en Supabase

### **Verificar Políticas Actuales**

Ejecuta esta query en SQL Editor:

```sql
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;
```

Deberías ver 4 políticas:
1. Users can insert their own profile
2. Users can view their own profile
3. Users can update their own profile
4. Users can delete their own profile

---

## 📋 CHECKLIST

- [ ] Abrí SQL Editor en Supabase
- [ ] Copié el contenido de `supabase/fix-members-rls-policies.sql`
- [ ] Pegué en el SQL Editor
- [ ] Ejecuté el script (Click "Run")
- [ ] Vi "Success. No rows returned"
- [ ] Verifiqué que se crearon 4 políticas
- [ ] Eliminé mi usuario actual en Auth Users
- [ ] Me registré de nuevo
- [ ] El registro funcionó sin errores
- [ ] Se creó mi perfil en la tabla `members`

---

## ⚠️ IMPORTANTE

### **Sobre el Error "No API key found"**

Este error también puede aparecer si:

1. **El cliente de Supabase no está inicializado correctamente**
   - Verifica que las variables de entorno estén correctas en Vercel
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Estás haciendo requests desde el cliente sin autenticación**
   - Las políticas RLS requieren que el usuario esté autenticado

### **Después de Ejecutar el Script**

El error principal ("new row violates row-level security policy") debería desaparecer.

Si el error "No API key found" persiste, puede ser por:
- Cache del navegador (limpia cache y recarga)
- Variables de entorno mal configuradas

---

## 🎯 Resultado Final

Después de ejecutar el script, los usuarios podrán:

✅ **Registrarse** sin problemas  
✅ **Crear su perfil** automáticamente  
✅ **Ver su perfil** en el dashboard  
✅ **Actualizar su información** personal  
✅ **Eliminar su cuenta** si lo desean  

---

## 📞 Si Aún Tienes Problemas

1. **Toma screenshot de**:
   - El error en la consola
   - Las políticas en Supabase (resultado de la query de verificación)
   - El resultado de ejecutar el script SQL

2. **Verifica**:
   - Que el script se ejecutó sin errores
   - Que las 4 políticas se crearon
   - Que tu usuario fue eliminado antes de registrarte de nuevo

---

**Ejecuta el script SQL ahora y después prueba registrarte de nuevo.**

