# 🚨 SOLUCIÓN: Rate Limit de Emails Muy Bajo

## 🔍 PROBLEMA ENCONTRADO

**Rate limit for sending emails: `2 emails/h`**

Esto significa que Supabase solo permite **2 emails por hora** en tu proyecto.

Por eso:
- ✅ Request devuelve `200 OK` (Supabase acepta la solicitud)
- ❌ Email NO se envía (se bloquea por el límite)
- 📊 Logs muestran `mail_from: null` y `mail_to: null`

---

## ✅ SOLUCIÓN: Aumentar el Rate Limit

### **Opción 1: Aumentar Manualmente (Recomendado)**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Scroll hasta **"Rate Limits"**

3. Busca **"Rate limit for sending emails"**

4. Cambia el valor de `2` a **`30`** (o más según necesites)

5. Click **"Save"**

**Límites Recomendados:**
- **Desarrollo/Testing**: `10-20 emails/h`
- **Producción pequeña**: `30-50 emails/h`
- **Producción mediana**: `100+ emails/h`

---

### **Opción 2: Verificar Plan de Supabase**

El límite puede estar restringido por tu plan:

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/billing

2. Revisa tu plan actual:
   - **Free Tier**: Límites muy bajos
   - **Pro Plan**: Límites más altos

3. Si estás en Free Tier y necesitas más:
   - Considera actualizar a **Pro Plan** ($25/mes)
   - O usa un **SMTP externo** (Gmail, SendGrid, etc.)

---

### **Opción 3: Configurar SMTP Externo (Mejor para Producción)**

Usar un servicio de email dedicado es mejor para producción:

#### **A. Gmail SMTP (Gratis, hasta 500 emails/día)**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Scroll hasta **"SMTP Settings"**

3. Activa **"Enable Custom SMTP"**

4. Configura:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: tu-email@gmail.com
   Password: [App Password de Gmail]
   Sender Email: tu-email@gmail.com
   Sender Name: RUNNING ERA Club
   ```

5. **Para obtener App Password de Gmail:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Genera una contraseña de aplicación
   - Úsala en el campo "Password"

#### **B. SendGrid (Gratis hasta 100 emails/día)**

1. Crea cuenta en: https://sendgrid.com

2. Obtén API Key

3. Configura en Supabase:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Tu API Key de SendGrid]
   ```

#### **C. Resend (Recomendado para Producción)**

1. Crea cuenta en: https://resend.com

2. Obtén API Key

3. Configura en Supabase:
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Tu API Key de Resend]
   ```

---

## 🎯 ACCIÓN INMEDIATA

### **PASO 1: Aumentar Rate Limit (2 minutos)**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Busca **"Rate limit for sending emails"**

3. Cambia de `2` a **`30`**

4. Click **"Save"**

### **PASO 2: Esperar 1 Minuto**

⏳ Espera 1 minuto para que se aplique el cambio

### **PASO 3: Probar de Nuevo**

1. Ve a: https://runningeraclub.com/miembros/confirmar-email

2. Click **"Reenviar correo"**

3. Espera 2-5 minutos

4. Revisa tu email (y spam)

---

## 📊 LÍMITES POR PLAN

### **Free Tier**
- Rate Limit: `2-10 emails/h` (muy bajo)
- Recomendación: Aumentar manualmente o usar SMTP externo

### **Pro Plan ($25/mes)**
- Rate Limit: `100+ emails/h`
- Incluye SMTP mejorado

### **Team Plan**
- Rate Limit: `1000+ emails/h`
- SMTP dedicado

---

## 🔧 CONFIGURACIÓN RECOMENDADA PARA PRODUCCIÓN

**Para un club de running con eventos y registros:**

1. **Rate Limit**: `50-100 emails/h` (suficiente para inicio)
2. **SMTP Externo**: Resend o SendGrid (más confiable)
3. **Monitoring**: Revisar logs semanalmente

---

## ✅ DESPUÉS DE CAMBIAR EL LÍMITE

1. ✅ Espera 1 minuto
2. ✅ Intenta reenviar email
3. ✅ Revisa logs en Supabase
4. ✅ Verifica que `mail_from` y `mail_to` ya no sean `null`

---

## 🚨 SI AÚN NO FUNCIONA DESPUÉS DE AUMENTAR

1. **Verifica que guardaste el cambio** (recarga la página)
2. **Espera 2 minutos** después de guardar
3. **Revisa otros rate limits** que puedan estar bloqueando:
   - Rate limit for sign-ups: Debe ser `30+ requests/5 min`
4. **Considera configurar SMTP externo** (más confiable)

---

**¡Ese era el problema! Con solo aumentar el límite a 30, debería funcionar.**

¿Pudiste aumentar el límite en Supabase?


