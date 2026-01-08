# Sistema de Miembros - RUNNING ERA

## Configuración de Supabase

### 1. Ejecutar el esquema SQL para miembros

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `supabase/members-schema.sql`
4. Ejecuta el script

Este script creará:
- Tabla `members` para perfiles de miembros
- Tabla `event_registrations` para registros de eventos
- Políticas de seguridad (RLS) para proteger los datos
- Índices para mejorar el rendimiento

### 2. Habilitar autenticación por email en Supabase

1. Ve a Authentication > Providers en tu proyecto de Supabase
2. Asegúrate de que "Email" esté habilitado
3. Configura las opciones de email según tus preferencias

### 3. Configurar políticas de seguridad

Las políticas RLS ya están incluidas en el script SQL, pero puedes ajustarlas según tus necesidades:

- Los miembros solo pueden ver/editar su propio perfil
- Los miembros solo pueden ver sus propios registros de eventos
- Los administradores pueden ver y gestionar todo

## Funcionalidades

### Para Miembros

- ✅ Registro de cuenta (email + contraseña)
- ✅ Login/Logout
- ✅ Dashboard personal con eventos registrados
- ✅ Perfil editable (nombre, teléfono, contacto de emergencia, etc.)
- ✅ Registro a eventos desde la página del evento
- ✅ Visualización del estado de registros (registrado, confirmado, cancelado, etc.)

### Rutas Disponibles

- `/miembros/login` - Login y registro de miembros
- `/miembros/dashboard` - Dashboard del miembro con sus eventos
- `/miembros/perfil` - Perfil editable del miembro

### API Routes

- `POST /api/members/register-event` - Registrar miembro a un evento
  - Body: `{ event_id: string }`
  - Requiere autenticación

## Flujo de Registro a Eventos

1. El miembro navega a la página de un evento (`/eventos/[slug]`)
2. Si no está autenticado, el botón "REGÍSTRATE" lo lleva al login
3. Si está autenticado, puede registrarse directamente
4. El registro se guarda en `event_registrations`
5. El miembro puede ver sus eventos registrados en su dashboard

## Estructura de Datos

### Tabla `members`
- `id` - UUID (referencia a auth.users)
- `email` - Email del miembro
- `full_name` - Nombre completo
- `phone` - Teléfono (opcional)
- `date_of_birth` - Fecha de nacimiento (opcional)
- `emergency_contact` - Contacto de emergencia (opcional)
- `emergency_phone` - Teléfono de emergencia (opcional)
- `membership_type` - Tipo de membresía (regular, premium, vip)
- `membership_status` - Estado (active, inactive, suspended)
- `profile_image` - URL de imagen de perfil (opcional)
- `bio` - Biografía (opcional)

### Tabla `event_registrations`
- `id` - UUID
- `member_id` - Referencia al miembro
- `event_id` - Referencia al evento
- `registration_date` - Fecha de registro
- `status` - Estado (registered, confirmed, cancelled, attended, no_show)
- `payment_status` - Estado de pago (pending, paid, refunded)
- `notes` - Notas adicionales (opcional)

## Seguridad

⚠️ **IMPORTANTE**: 
- Las políticas RLS protegen los datos de los miembros
- Solo los miembros pueden ver/editar su propia información
- Los administradores tienen acceso completo para gestión
- En producción, considera agregar validaciones adicionales

## Próximas Mejoras Sugeridas

- [ ] Verificación de email obligatoria
- [ ] Recuperación de contraseña
- [ ] Notificaciones por email al registrarse a eventos
- [ ] Historial de eventos asistidos
- [ ] Estadísticas personales del miembro
- [ ] Subida de foto de perfil
- [ ] Integración con sistema de pagos








