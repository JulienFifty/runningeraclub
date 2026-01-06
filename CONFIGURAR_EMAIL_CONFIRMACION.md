# Configuración de Confirmación de Email

## Flujo de Confirmación de Email Implementado

### 1. Registro de Usuario
1. El usuario se registra en `/miembros/login`
2. Supabase envía un email de confirmación
3. El usuario es redirigido a `/miembros/confirmar-email?email=[su_email]`
4. Se muestra un mensaje indicando que debe revisar su correo

### 2. Confirmación de Email
1. El usuario hace clic en el enlace del email
2. Supabase redirige a `/auth/callback` con un código
3. El sistema crea automáticamente el perfil del miembro si no existe
4. El usuario es redirigido a `/miembros/dashboard?email_confirmed=true`

### 3. Intento de Login sin Confirmar
1. Si el usuario intenta iniciar sesión sin confirmar el email
2. Se detecta el error "Email not confirmed"
3. El usuario es redirigido a `/miembros/confirmar-email?email=[su_email]`
4. Puede reenviar el correo de confirmación

## Configuración de Supabase (IMPORTANTE)

### Paso 1: Configurar la URL de Redirección

Ve a tu proyecto en Supabase Dashboard:

1. **Authentication** → **URL Configuration**
2. Agrega estas URLs a **Redirect URLs**:

**Para Desarrollo:**
```
http://localhost:3000/auth/callback
```

**Para Producción:**
```
https://runningeraclub.com/auth/callback
https://www.runningeraclub.com/auth/callback
```

### Paso 2: Configurar Email Templates (Opcional)

1. Ve a **Authentication** → **Email Templates**
2. Edita el template **"Confirm signup"**
3. Asegúrate de que el enlace use: `{{ .ConfirmationURL }}`

Ejemplo de template personalizado:
```html
<h2>¡Bienvenido a RUNNING ERA Club!</h2>
<p>Hola,</p>
<p>Gracias por registrarte. Para confirmar tu cuenta, haz clic en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi email</a></p>
<p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
<p>¡Nos vemos en la pista!</p>
<p>- Equipo RUNNING ERA</p>
```

### Paso 3: Configurar Opciones de Email

1. Ve a **Authentication** → **Settings**
2. **Enable email confirmations**: ✅ Activado (recomendado para producción)
3. **Secure email change**: ✅ Activado
4. **Double confirm email changes**: ✅ Activado (opcional)

## Para Desarrollo (Opcional)

Si quieres deshabilitar la confirmación de email durante el desarrollo:

1. Ve a **Authentication** → **Settings**
2. Desactiva **"Enable email confirmations"**
3. Los usuarios podrán iniciar sesión inmediatamente después de registrarse

⚠️ **NO desactivar en producción**

## Páginas Creadas

- `/app/miembros/confirmar-email/page.tsx` - Página que muestra mensaje de confirmación
- `/app/auth/callback/route.ts` - API route que maneja la confirmación

## Funcionalidades

✅ Mensaje claro después del registro
✅ Instrucciones para confirmar el email
✅ Botón para reenviar el correo de confirmación
✅ Manejo de errores si el email no está confirmado
✅ Creación automática del perfil al confirmar
✅ Redirección al dashboard después de confirmar

## Troubleshooting

### El email no llega
1. Revisa la carpeta de spam
2. Verifica que el email esté bien escrito
3. Usa el botón "Reenviar correo" en `/miembros/confirmar-email`

### Error: "Invalid redirect URL"
1. Verifica que agregaste las URLs de redirección en Supabase
2. Asegúrate de incluir tanto `http://localhost:3000/auth/callback` como tu dominio de producción

### El enlace dice "expirado"
1. Los enlaces de confirmación expiran después de 24 horas
2. El usuario debe registrarse nuevamente o usar el botón "Reenviar correo"

