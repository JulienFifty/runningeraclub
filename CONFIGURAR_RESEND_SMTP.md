# 📧 Configurar Resend SMTP en Supabase

## 🎯 Objetivo

Configurar Resend como proveedor SMTP externo para Supabase, permitiendo enviar emails de confirmación sin límites estrictos.

---

## 📋 PASO 1: Crear Cuenta en Resend

### 1.1. Ir a Resend

Ve a: https://resend.com

### 1.2. Crear Cuenta

1. Click en **"Sign Up"** (arriba derecha)
2. Ingresa tu email (puede ser el mismo de Supabase)
3. Crea contraseña
4. Confirma tu email

### 1.3. Verificar Email

- Revisa tu bandeja de entrada
- Click en el enlace de verificación

---

## 📋 PASO 2: Configurar Dominio (Opcional pero Recomendado)

### 2.1. Agregar Dominio

1. En Resend Dashboard, ve a **"Domains"**
2. Click **"Add Domain"**
3. Ingresa: `runningeraclub.com`
4. Click **"Add"**

### 2.2. Configurar DNS

Resend te dará registros DNS para agregar:

**Ejemplo de registros:**
```
Tipo: TXT
Nombre: @
Valor: [lo que Resend te dé]
```

**Pasos:**
1. Ve a tu proveedor de DNS (donde compraste el dominio)
2. Agrega los registros que Resend te indique
3. Espera 5-10 minutos para que se propaguen

### 2.3. Verificar Dominio

1. En Resend, click **"Verify"** en tu dominio
2. Espera confirmación (puede tardar hasta 24h, pero usualmente es rápido)

---

## 📋 PASO 3: Obtener API Key de Resend

### 3.1. Ir a API Keys

1. En Resend Dashboard, ve a **"API Keys"** (menú lateral)
2. Click **"Create API Key"**

### 3.2. Crear API Key

1. **Name**: `Supabase SMTP` (o el nombre que prefieras)
2. **Permission**: `Sending access` (suficiente)
3. Click **"Add"**

### 3.3. Copiar API Key

⚠️ **IMPORTANTE**: Copia el API Key **INMEDIATAMENTE**. Solo se muestra una vez.

**Guárdalo en un lugar seguro**, lo necesitarás en el siguiente paso.

---

## 📋 PASO 4: Configurar SMTP en Supabase

### 4.1. Ir a Configuración de Auth

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Scroll hasta **"SMTP Settings"**

### 4.2. Activar Custom SMTP

1. Activa el toggle **"Enable Custom SMTP"**

### 4.3. Configurar Credenciales

Ingresa los siguientes valores:

```
✅ Enable Custom SMTP: ON

Host: smtp.resend.com
Port: 587
Username: resend
Password: [Tu API Key de Resend - la que copiaste]
Sender Email: noreply@runningeraclub.com
   (O si no tienes dominio verificado: onboarding@resend.dev)
Sender Name: RUNNING ERA Club
```

**Notas:**
- **Host**: `smtp.resend.com` (fijo)
- **Port**: `587` (TLS) o `465` (SSL) - usa `587`
- **Username**: `resend` (fijo)
- **Password**: Tu API Key de Resend (la que copiaste)
- **Sender Email**: 
  - Si verificaste dominio: `noreply@runningeraclub.com`
  - Si NO verificaste: `onboarding@resend.dev` (temporal)

### 4.4. Guardar

1. Click **"Save"** al final de la página
2. Espera confirmación

---

## 📋 PASO 5: Probar Configuración

### 5.1. Verificar en Supabase

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Verifica que **"Enable Custom SMTP"** esté **ON** (verde)

3. Verifica que los campos estén guardados correctamente

### 5.2. Probar Envío

1. Ve a tu app: https://runningeraclub.com/miembros/confirmar-email

2. Ingresa un email de prueba

3. Click **"Reenviar correo"**

4. Espera 1-2 minutos

5. Revisa tu email (y spam)

### 5.3. Verificar en Resend

1. Ve a Resend Dashboard: https://resend.com/emails

2. Deberías ver el email enviado en el log

3. Verifica:
   - ✅ Status: `delivered` o `sent`
   - ✅ Recipient: Tu email
   - ✅ Subject: Email de confirmación

---

## 🔍 TROUBLESHOOTING

### ❌ Error: "Authentication failed"

**Causa**: API Key incorrecta o mal copiada

**Solución**:
1. Ve a Resend → API Keys
2. Crea una nueva API Key
3. Copia exactamente (sin espacios)
4. Pégala en Supabase → Password
5. Guarda

---

### ❌ Error: "Domain not verified"

**Causa**: Estás usando `noreply@runningeraclub.com` pero el dominio no está verificado

**Solución Temporal**:
1. Usa `onboarding@resend.dev` como Sender Email
2. Esto funciona para testing
3. Luego verifica tu dominio y cambia

---

### ❌ Email no llega

**Verifica**:
1. ✅ SMTP está activado en Supabase
2. ✅ API Key es correcta
3. ✅ Sender Email es válido
4. ✅ Revisa spam/junk
5. ✅ Revisa logs en Resend Dashboard

---

### ❌ Rate limit aún aparece

**Causa**: Supabase puede tener rate limits adicionales

**Solución**:
1. Aumenta el rate limit en Supabase Settings → Auth → Rate Limits
2. O espera unos minutos entre intentos

---

## 📊 VENTAJAS DE RESEND

✅ **Plan Gratuito Generoso**:
- 3,000 emails/mes gratis
- 100 emails/día gratis

✅ **Sin Rate Limits Estrictos**:
- No tienes el límite de 2 emails/h de Supabase

✅ **Mejor Deliverability**:
- Emails llegan a inbox (no spam)
- Mejor reputación que emails genéricos

✅ **Dashboard Completo**:
- Ver todos los emails enviados
- Ver status (delivered, bounced, etc.)
- Analytics

✅ **Fácil de Configurar**:
- Solo necesitas API Key
- No necesitas servidor propio

---

## 🎯 CONFIGURACIÓN FINAL RECOMENDADA

### Para Producción:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Tu API Key]
Sender Email: noreply@runningeraclub.com
Sender Name: RUNNING ERA Club
```

### Para Testing (sin dominio):

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Tu API Key]
Sender Email: onboarding@resend.dev
Sender Name: RUNNING ERA Club
```

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta creada en Resend
- [ ] Email verificado en Resend
- [ ] API Key creada y copiada
- [ ] SMTP activado en Supabase
- [ ] Credenciales configuradas correctamente
- [ ] Configuración guardada en Supabase
- [ ] Email de prueba enviado
- [ ] Email recibido (revisar spam si es necesario)
- [ ] Verificado en Resend Dashboard

---

## 🚀 SIGUIENTE PASO

**Después de configurar Resend:**

1. ✅ Prueba enviar un email de confirmación
2. ✅ Verifica que llegue
3. ✅ Revisa Resend Dashboard para confirmar
4. ✅ Si todo funciona, puedes aumentar el rate limit en Supabase (ya no es crítico)

---

**¿Necesitas ayuda con algún paso específico?**


