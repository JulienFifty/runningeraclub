# Instrucciones para Configurar Notificaciones Push en Supabase

## Paso 1: Ejecutar el Esquema SQL en Supabase

Para habilitar las notificaciones push, necesitas ejecutar dos scripts SQL en Supabase:

### Script 1: Tabla de Suscripciones Push

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de `supabase/push-notifications-schema.sql`
4. Haz clic en **Run** (o presiona `Ctrl+Enter`)
5. Verifica que no haya errores

### Script 2: Tabla de Configuración de Notificaciones

1. En el mismo **SQL Editor** (o en una nueva pestaña)
2. Copia y pega el contenido completo de `supabase/push-notification-settings-schema.sql`
3. Haz clic en **Run** (o presiona `Ctrl+Enter`)
4. Verifica que no haya errores

## Paso 2: Verificar que las Tablas se Crearon Correctamente

Después de ejecutar los scripts, verifica que las tablas se crearon:

1. Ve a **Table Editor** en Supabase
2. Deberías ver dos nuevas tablas:
   - `push_subscriptions` - Para almacenar las suscripciones de los usuarios
   - `push_notification_settings` - Para configurar qué notificaciones están habilitadas

3. Verifica que `push_notification_settings` tenga 4 filas:
   - `new_event`
   - `payment_success`
   - `event_nearly_full`
   - `free_event_registration`

## Paso 3: Verificar las Políticas RLS

Las políticas RLS (Row Level Security) deben estar configuradas para que:
- Solo los administradores puedan ver/editar la configuración
- Los usuarios solo puedan gestionar sus propias suscripciones

Si tienes problemas de permisos, verifica las políticas en **Authentication > Policies**.

## Solución de Problemas

### Error: "Could not find the table 'public.push_notification_settings'"

Si ves este error, significa que el script SQL no se ejecutó correctamente. 

**Solución:**
1. Ve al SQL Editor en Supabase
2. Ejecuta manualmente este comando para crear la tabla:

```sql
CREATE TABLE IF NOT EXISTS push_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

3. Luego ejecuta el resto del script de `push-notification-settings-schema.sql`

### Error: "function update_updated_at_column() does not exist"

Este error significa que la función trigger no existe. 

**Solución:**
El script actualizado ahora crea la función automáticamente, pero si aún ves el error, ejecuta esto primero:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Verificar que las Configuraciones Existen

Ejecuta esta consulta para verificar:

```sql
SELECT * FROM push_notification_settings;
```

Deberías ver 4 filas. Si no las ves, inserta manualmente:

```sql
INSERT INTO push_notification_settings (setting_key, enabled, description) VALUES
  ('new_event', true, 'Notificar cuando se crea un nuevo evento'),
  ('payment_success', true, 'Notificar cuando se confirma un pago exitoso'),
  ('event_nearly_full', true, 'Notificar cuando quedan pocos lugares disponibles (10 o menos)'),
  ('free_event_registration', true, 'Notificar cuando se registra a un evento gratuito')
ON CONFLICT (setting_key) DO NOTHING;
```

