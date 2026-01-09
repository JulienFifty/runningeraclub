# Configuración de Notificaciones Push Web - RUNNING ERA

Este documento explica cómo configurar las notificaciones push web para que los usuarios reciban notificaciones incluso cuando no tienen la aplicación abierta.

## Requisitos Previos

- Node.js instalado
- Supabase configurado
- Acceso a la consola de Supabase

## Paso 1: Generar VAPID Keys

Las VAPID (Voluntary Application Server Identification) keys son necesarias para autenticar tu servidor con los servicios de push del navegador.

1. Ejecuta el script para generar las keys:

```bash
node scripts/generate-vapid-keys.js
```

2. El script generará dos claves:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Clave pública (segura para exponer en el cliente)
   - `VAPID_PRIVATE_KEY`: Clave privada (NUNCA exponer en el cliente)
   - `VAPID_EMAIL`: Email de contacto (formato: `mailto:tu-email@ejemplo.com`)

3. Agrega estas variables a tu archivo `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_EMAIL=mailto:runningeraclub@gmail.com
```

**⚠️ IMPORTANTE**: 
- La clave privada (`VAPID_PRIVATE_KEY`) es SECRETA. Nunca la expongas en el código del cliente.
- Agrega `.env.local` a tu `.gitignore` si no está ya incluido.

## Paso 2: Ejecutar el Esquema SQL en Supabase

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `supabase/push-notifications-schema.sql`
4. Ejecuta el script

Este script creará:
- Tabla `push_subscriptions` para almacenar las suscripciones de los usuarios
- Índices para mejorar el rendimiento
- Políticas RLS (Row Level Security) para proteger los datos
- Trigger para actualizar `updated_at` automáticamente

## Paso 3: Instalar Dependencias

Si no lo has hecho ya, instala las dependencias necesarias:

```bash
npm install
```

Esto instalará `web-push` y sus tipos TypeScript.

## Paso 4: Compilar y Desplegar

1. Compila tu aplicación:

```bash
npm run build
```

2. Asegúrate de que el Service Worker (`public/sw.js`) esté accesible en `/sw.js`

## Funcionalidades

### Para Usuarios

Los usuarios pueden:
- Activar/desactivar notificaciones push desde su dashboard
- Recibir notificaciones incluso cuando la aplicación no está abierta
- Hacer clic en las notificaciones para abrir la aplicación

### Para Administradores

Los administradores pueden enviar notificaciones push usando la API:

**Endpoint**: `POST /api/push/send`

**Body**:
```json
{
  "title": "Título de la notificación",
  "body": "Mensaje de la notificación",
  "url": "/miembros/dashboard", // URL a abrir cuando se hace clic
  "icon": "/assets/logo-running-era.png", // Icono opcional
  "tag": "notification-tag", // Tag opcional para agrupar notificaciones
  "user_id": "uuid-del-usuario", // Opcional: enviar a un usuario específico
  "all_users": true // Opcional: enviar a todos los usuarios
}
```

**Ejemplo de uso desde el admin**:

```typescript
const response = await fetch('/api/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '¡Nuevo evento disponible!',
    body: 'Inscríbete ahora al próximo evento de RUNNING ERA',
    url: '/eventos/nuevo-evento',
    all_users: true,
  }),
});
```

## Compatibilidad del Navegador

Las notificaciones push web funcionan en:
- ✅ Chrome (Android y Desktop)
- ✅ Firefox (Android y Desktop)
- ✅ Edge
- ✅ Safari (iOS 16.4+ y macOS)
- ❌ Safari (iOS < 16.4) - No soportado

## Notas Importantes

1. **HTTPS requerido**: Las notificaciones push solo funcionan en HTTPS (o localhost para desarrollo)
2. **Permisos del usuario**: Los usuarios deben otorgar permisos explícitos para recibir notificaciones
3. **Service Worker**: El Service Worker debe estar registrado y activo
4. **Límites de suscripciones**: Cada usuario puede tener múltiples suscripciones (uno por dispositivo/navegador)
5. **Limpieza automática**: Las suscripciones inválidas se eliminan automáticamente cuando fallan

## Solución de Problemas

### Las notificaciones no se reciben

1. Verifica que las VAPID keys estén configuradas correctamente
2. Verifica que el Service Worker esté registrado (Revisa la consola del navegador)
3. Verifica que el usuario haya otorgado permisos de notificación
4. Revisa los logs del servidor para ver si hay errores al enviar

### Error: "VAPID keys no configuradas"

Asegúrate de que las variables de entorno estén configuradas en `.env.local` y que el servidor esté reiniciado después de agregarlas.

### Error: "Subscription no válida"

Las suscripciones pueden volverse inválidas si:
- El usuario elimina los datos del navegador
- El usuario desinstala la aplicación
- La suscripción expira

El sistema elimina automáticamente las suscripciones inválidas.

## Ejemplos de Uso

### Enviar notificación cuando se crea un nuevo evento

```typescript
// En tu API route o función server-side
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '🎉 Nuevo evento disponible',
    body: `${event.title} - ${event.date}`,
    url: `/eventos/${event.slug}`,
    tag: `event-${event.id}`,
    all_users: true,
  }),
});
```

### Enviar notificación cuando un pago se completa

```typescript
// En el webhook de Stripe
await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '✅ Pago confirmado',
    body: 'Tu registro ha sido confirmado exitosamente',
    url: '/miembros/dashboard',
    user_id: userId, // Enviar solo al usuario específico
  }),
});
```

