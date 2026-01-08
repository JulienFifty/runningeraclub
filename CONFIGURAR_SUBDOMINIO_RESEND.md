# 🌐 Configurar Subdominio para Resend (Recomendado)

## 🤔 ¿Necesitas un Subdominio?

### **Respuesta Corta:**
- ❌ **NO es necesario** para empezar (puedes usar `onboarding@resend.dev`)
- ✅ **SÍ es recomendado** para producción profesional
- ✅ **Mejor opción**: Usar tu dominio principal `runningeraclub.com` directamente

---

## 📊 OPCIONES DISPONIBLES

### **Opción 1: Sin Subdominio (Más Simple)** ⭐ RECOMENDADO

**Usar el dominio principal directamente:**
```
Sender Email: noreply@runningeraclub.com
```

**Ventajas:**
- ✅ Más simple (no necesitas crear subdominio)
- ✅ Más profesional (emails vienen de tu dominio principal)
- ✅ Menos configuración DNS
- ✅ Funciona perfectamente para emails transaccionales

**Desventajas:**
- ⚠️ Si cambias de proveedor de email, afecta el dominio principal

---

### **Opción 2: Subdominio Específico (Más Profesional)**

**Crear un subdominio solo para emails:**
```
Sender Email: noreply@mail.runningeraclub.com
```

**Ventajas:**
- ✅ Aislamiento (emails separados del dominio principal)
- ✅ Más flexible (puedes cambiar proveedor sin afectar el dominio principal)
- ✅ Mejor organización
- ✅ Puedes tener múltiples subdominios para diferentes propósitos

**Desventajas:**
- ⚠️ Requiere configuración DNS adicional
- ⚠️ Un paso más en el proceso

---

### **Opción 3: Temporal (Para Testing)**

**Usar el dominio de Resend:**
```
Sender Email: onboarding@resend.dev
```

**Ventajas:**
- ✅ Funciona inmediatamente (sin configuración DNS)
- ✅ Perfecto para testing

**Desventajas:**
- ❌ No es profesional (emails vienen de `resend.dev`)
- ❌ Puede ir a spam más fácilmente
- ❌ No es para producción

---

## 🎯 RECOMENDACIÓN PARA RUNNING ERA CLUB

### **Para Producción: Usar Dominio Principal**

```
Sender Email: noreply@runningeraclub.com
```

**Razones:**
1. ✅ Es más simple y directo
2. ✅ Los usuarios reconocen el dominio
3. ✅ Mejor deliverability (menos spam)
4. ✅ Menos configuración

---

## 📋 CÓMO CONFIGURAR DOMINIO EN RESEND

### **PASO 1: Agregar Dominio en Resend**

1. Ve a Resend Dashboard: https://resend.com/domains
2. Click **"Add Domain"**
3. Ingresa: `runningeraclub.com` (o `mail.runningeraclub.com` si prefieres subdominio)
4. Click **"Add"**

---

### **PASO 2: Configurar DNS**

Resend te dará **3-4 registros DNS** que debes agregar en tu proveedor de DNS.

#### **A. Si usas el dominio principal (`runningeraclub.com`):**

Resend te dará algo como:

```
Tipo: TXT
Nombre: @
Valor: resend-domain-verification=abc123...

Tipo: CNAME
Nombre: resend._domainkey
Valor: resend._domainkey.resend.com

Tipo: MX (opcional, para recibir emails)
Nombre: @
Valor: feedback-smtp.resend.com
```

#### **B. Si usas subdominio (`mail.runningeraclub.com`):**

```
Tipo: TXT
Nombre: mail
Valor: resend-domain-verification=abc123...

Tipo: CNAME
Nombre: resend._domainkey.mail
Valor: resend._domainkey.resend.com
```

---

### **PASO 3: Agregar Registros en tu Proveedor DNS**

**Dónde agregar los registros:**

1. **Si tu dominio está en:**
   - **Vercel**: Ve a tu proyecto → Settings → Domains → DNS Records
   - **Cloudflare**: Dashboard → DNS → Records
   - **GoDaddy**: My Products → DNS → Manage
   - **Namecheap**: Domain List → Manage → Advanced DNS
   - **Google Domains**: DNS → Custom Records

2. **Agrega cada registro** que Resend te dio:
   - Tipo (TXT, CNAME, MX)
   - Nombre (@ o mail)
   - Valor (lo que Resend te dio)
   - TTL (dejar por defecto o 3600)

3. **Guarda** los cambios

---

### **PASO 4: Esperar Propagación DNS**

- ⏳ **Tiempo típico**: 5-30 minutos
- ⏳ **Máximo**: 24 horas (raro)

**Cómo verificar:**
- Usa: https://dnschecker.org
- Busca tu dominio
- Verifica que los registros aparezcan

---

### **PASO 5: Verificar en Resend**

1. Ve a Resend Dashboard → Domains
2. Click **"Verify"** en tu dominio
3. Espera confirmación (puede tardar unos minutos)

**Cuando esté verificado:**
- ✅ Verás un check verde
- ✅ Podrás usar `noreply@runningeraclub.com` como Sender Email

---

## 🔧 CONFIGURACIÓN EN SUPABASE

Una vez que el dominio esté verificado en Resend:

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth
2. Scroll hasta **"SMTP Settings"**
3. Configura:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Tu API Key de Resend]
Sender Email: noreply@runningeraclub.com
   (O mail@runningeraclub.com, o el que prefieras)
Sender Name: RUNNING ERA Club
```

4. Guarda

---

## 📧 OPCIONES DE SENDER EMAIL

Una vez que tengas el dominio verificado, puedes usar:

### **Opciones Recomendadas:**

```
noreply@runningeraclub.com          ⭐ Más común
mail@runningeraclub.com             ⭐ Simple y claro
notificaciones@runningeraclub.com  ⭐ En español
info@runningeraclub.com             ⭐ Para respuestas
```

### **Si usas Subdominio:**

```
noreply@mail.runningeraclub.com
notificaciones@mail.runningeraclub.com
```

---

## ⚡ FLUJO RÁPIDO (Recomendado)

### **Para Empezar YA (Testing):**

1. ✅ Configura Resend con `onboarding@resend.dev`
2. ✅ Prueba que funcione
3. ✅ Mientras tanto, configura el dominio en Resend
4. ✅ Cuando esté verificado, cambia a `noreply@runningeraclub.com`

### **Para Producción Directa:**

1. ✅ Agrega dominio en Resend
2. ✅ Configura DNS (5-30 min)
3. ✅ Verifica en Resend
4. ✅ Configura en Supabase con `noreply@runningeraclub.com`

---

## 🎯 MI RECOMENDACIÓN FINAL

**Para RUNNING ERA CLUB:**

1. **Usa el dominio principal** (`runningeraclub.com`) - NO necesitas subdominio
2. **Sender Email**: `noreply@runningeraclub.com`
3. **Configuración**: Simple y directa
4. **Resultado**: Emails profesionales que los usuarios reconocen

**¿Por qué NO subdominio?**
- Es más simple
- Los usuarios reconocen mejor `@runningeraclub.com`
- Menos configuración DNS
- Funciona perfectamente para emails transaccionales

---

## ✅ CHECKLIST

- [ ] Decidir: Dominio principal o subdominio
- [ ] Agregar dominio en Resend
- [ ] Copiar registros DNS de Resend
- [ ] Agregar registros en tu proveedor DNS
- [ ] Esperar propagación (5-30 min)
- [ ] Verificar dominio en Resend
- [ ] Configurar Sender Email en Supabase
- [ ] Probar envío de email
- [ ] Verificar que llegue correctamente

---

**¿Tienes acceso a la configuración DNS de `runningeraclub.com`?**

Si sí, te recomiendo usar el dominio principal directamente. Si no, podemos usar `onboarding@resend.dev` temporalmente.


