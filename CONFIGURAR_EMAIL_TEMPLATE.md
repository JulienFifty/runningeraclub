# Configurar Email Template de Confirmación en Español

## 📧 Email Template Personalizado

He creado un email template profesional en español para el registro de usuarios.

**Archivo:** `supabase/email-template-confirm-signup-es.html`

---

## 🚀 Cómo Configurar en Supabase

### Paso 1: Ir a Email Templates

1. Ve a tu proyecto en Supabase
2. **Authentication** → **Email Templates**
3. Busca **"Confirm signup"**

### Paso 2: Copiar el Template

1. Abre el archivo `supabase/email-template-confirm-signup-es.html`
2. Copia **TODO** el contenido (desde `<html>` hasta `</html>`)

### Paso 3: Pegar en Supabase

1. En Supabase, borra todo el contenido actual del template
2. Pega el nuevo código HTML
3. Click en **Save**

---

## ✨ Características del Template

- ✅ **Diseño profesional y moderno**
- ✅ **Totalmente en español**
- ✅ **Responsive** (se ve bien en móvil)
- ✅ **Branding de RUNNING ERA**
- ✅ **Botón grande de CTA** ("CONFIRMAR MI EMAIL")
- ✅ **Enlace de respaldo** (por si el botón no funciona)
- ✅ **Lista de beneficios** del club
- ✅ **Footer con información de contacto**
- ✅ **Nota de seguridad** (enlace expira en 24h)

---

## 🎨 Personalización (Opcional)

Si quieres cambiar algo en el template:

### Cambiar Colores:

```css
/* Color del header y botón (actualmente negro) */
background-color: #000000;

/* Para cambiar a otro color, por ejemplo azul: */
background-color: #0066cc;
```

### Cambiar Texto:

Busca y modifica cualquier texto directamente en el HTML.

### Agregar Logo:

Reemplaza la línea del `<h1>` con tu logo:

```html
<!-- Reemplazar esto: -->
<h1>RUNNING ERA</h1>

<!-- Con esto: -->
<img src="https://tu-dominio.com/logo.png" alt="RUNNING ERA" style="height: 50px;">
```

---

## 📝 Variables de Supabase Disponibles

El template usa estas variables automáticas de Supabase:

| Variable | Descripción |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Enlace único de confirmación |
| `{{ .SiteURL }}` | URL de tu sitio |
| `{{ .CurrentYear }}` | Año actual |

**⚠️ IMPORTANTE:** NO borres `{{ .ConfirmationURL }}` - es el enlace que confirma el email.

---

## 🧪 Probar el Template

1. Después de guardar el template en Supabase
2. Registra un nuevo usuario de prueba
3. Revisa el email recibido
4. Debería verse profesional y con todos los estilos aplicados

---

## 📱 Vista Previa

El email se verá así:

```
┌─────────────────────────────────┐
│     [Header Negro]              │
│      RUNNING ERA                │
├─────────────────────────────────┤
│                                 │
│  ¡Bienvenido a RUNNING ERA! 🎉 │
│                                 │
│  Gracias por registrarte...    │
│                                 │
│  ┌──────────────────────────┐  │
│  │ CONFIRMAR MI EMAIL       │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ ¿El botón no funciona?   │  │
│  │ Copia este enlace...     │  │
│  └──────────────────────────┘  │
│                                 │
│  Una vez confirmado podrás:    │
│  • Registrarte en eventos      │
│  • Acceder a tu dashboard      │
│  • Conectar con Strava         │
│  ...                           │
├─────────────────────────────────┤
│     [Footer Gris]              │
│  ¿Necesitas ayuda? Contáctanos │
│  Instagram | Sitio Web         │
│  © 2025 RUNNING ERA Club       │
└─────────────────────────────────┘
```

---

## 🔄 Otros Templates de Email

También puedes personalizar estos otros templates en Supabase:

1. **Magic Link** - Para login sin contraseña
2. **Change Email Address** - Para cambiar email
3. **Reset Password** - Para restablecer contraseña

Usa el mismo estilo del template de confirmación para mantener consistencia.

---

## ✅ Checklist Final

- [ ] Template copiado en Supabase
- [ ] Guardado correctamente
- [ ] Probado con usuario de prueba
- [ ] Email se ve bien en escritorio
- [ ] Email se ve bien en móvil
- [ ] Botón funciona correctamente
- [ ] Enlace de respaldo funciona
- [ ] Redirección va al dashboard

---

## 📞 Contacto en el Email

El template incluye:
- **Email de soporte:** support@runningeraclub.com
- **Instagram:** @runningeraclub
- **Sitio web:** runningeraclub.com

Asegúrate de que estos contactos sean correctos. Si necesitas cambiarlos, edita el HTML directamente en Supabase.

