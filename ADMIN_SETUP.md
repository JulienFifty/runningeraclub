# Panel de Administración - RUNNING ERA

## Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la URL del proyecto y la clave anónima (anon key)

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_segura
```

### 3. Ejecutar el esquema SQL

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `supabase/schema.sql`
4. Ejecuta el script

### 3.1. Migrar difficulty a array (Si ya tienes eventos creados)

Si ya creaste eventos antes y estás obteniendo un error al guardar:

1. En el SQL Editor de Supabase
2. Copia y pega el contenido de `supabase/migration-difficulty-array.sql`
3. Ejecuta el script
4. Esto actualizará la columna difficulty para aceptar arrays

### 3.2. Configurar Storage para imágenes (Opcional pero recomendado)

Para poder subir imágenes desde el panel de administración:

1. En el SQL Editor de Supabase
2. Copia y pega el contenido de `supabase/storage-setup.sql`
3. Ejecuta el script
4. Esto creará un bucket público llamado "images" para almacenar las imágenes de eventos

**Nota:** Si no configuras Storage, el componente de carga de imágenes usará URLs locales como fallback.

### 4. Insertar eventos de ejemplo (Opcional)

Si quieres empezar con eventos de ejemplo:

1. En el SQL Editor de Supabase
2. Copia y pega el contenido de `supabase/seed-events.sql`
3. Ejecuta el script
4. Esto insertará 9 eventos de ejemplo en tu base de datos

### 5. Acceder al panel de administración

1. Inicia el servidor: `npm run dev`
2. Ve a `http://localhost:3000/admin/login`
3. Ingresa la contraseña configurada en `NEXT_PUBLIC_ADMIN_PASSWORD`

## Funcionalidades

- ✅ Ver todos los eventos
- ✅ Crear nuevos eventos
- ✅ Editar eventos existentes
- ✅ Eliminar eventos
- ✅ Gestión completa de información de eventos

## Seguridad

⚠️ **IMPORTANTE**: En producción, implementa:
- Autenticación real con Supabase Auth
- Políticas de seguridad (RLS) más estrictas
- Cambiar la contraseña de administrador
- Usar variables de entorno seguras

## Estructura de Datos

Los eventos se almacenan en Supabase con la siguiente estructura:
- Información básica (título, fecha, ubicación, etc.)
- Detalles adicionales (duración, distancia, nivel, precio)
- Requisitos (array)
- Programa/horario (array de objetos)
- Highlights (array)
- Información de contacto (objeto)

