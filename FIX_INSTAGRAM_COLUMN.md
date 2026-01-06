# Solución: Error al crear perfil - Columna 'instagram' faltante

## Problema
El sistema intenta guardar el Instagram del usuario, pero la columna no existe en la base de datos.

**Error:** `Could not find the 'instagram' column of 'members' in the schema cache`

## Solución

### Paso 1: Agregar la columna en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc
2. Abre el **SQL Editor** (en el menú lateral izquierdo)
3. Copia y pega el contenido del archivo `supabase/add-instagram-column.sql`
4. Click en **RUN** (o presiona Ctrl+Enter)

### Paso 2: Verificar que se agregó correctamente

Ejecuta esta query en el SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;
```

Deberías ver la columna `instagram` en la lista.

### Paso 3: Probar el registro nuevamente

1. Intenta registrar un nuevo usuario
2. El perfil debería crearse correctamente ahora
3. El campo Instagram se guardará en la base de datos

## Verificación adicional

Si quieres verificar que los datos se guardan correctamente:

```sql
SELECT id, full_name, phone, instagram 
FROM members 
ORDER BY created_at DESC 
LIMIT 5;
```

## Problema adicional: Email no confirmado

También veo el error: `Email not confirmed`

### Para desarrollo (opcional):
Puedes deshabilitar la confirmación de email en desarrollo:

1. Ve a **Authentication** → **Settings**
2. Busca **Email confirmations**
3. Desactiva "Enable email confirmations" (solo para desarrollo)

### Para producción:
Los usuarios deben confirmar su email antes de poder iniciar sesión. Asegúrate de que:
- El usuario revise su correo (incluyendo spam)
- Los emails de Supabase se estén enviando correctamente

