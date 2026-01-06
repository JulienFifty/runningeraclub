# 🔧 Configurar Resend en Vercel DNS

## 📊 Situación Actual

✅ **DNS gestionado por Vercel** (no Hostinger)
- Nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
- Ya existe registro `resend._domainkey` (configuración previa)

---

## 🎯 PASOS PARA CONFIGURAR RESEND

### **PASO 1: Agregar Dominio en Resend**

1. Ve a: https://resend.com/domains
2. Click **"Add Domain"**
3. Ingresa: `runningeraclub.com`
4. Click **"Add"**

---

### **PASO 2: Obtener Registros DNS de Resend**

Resend te dará **3-4 registros DNS** que necesitas agregar:

**Ejemplo de lo que Resend te dará:**

```
1. TXT Record (Verificación de dominio):
   Name: @
   Value: resend-domain-verification=abc123xyz...

2. TXT Record (DKIM):
   Name: resend._domainkey
   Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...

3. CNAME Record (opcional):
   Name: resend._domainkey
   Value: resend._domainkey.resend.com
```

**⚠️ IMPORTANTE**: Copia EXACTAMENTE lo que Resend te dé.

---

### **PASO 3: Agregar Registros en Vercel**

#### **3.1. Ir a Vercel Dashboard**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: `runningeraclub`
3. Ve a: **Settings** → **Domains**
4. Click en `runningeraclub.com`
5. Click en **"DNS Records"** o **"Configure DNS"**

#### **3.2. Agregar Registro TXT de Verificación**

1. Click **"Add Record"** o **"Add DNS Record"**
2. Configura:
   ```
   Type: TXT
   Name: @ (o dejar vacío para dominio raíz)
   Value: [El valor que Resend te dio para verificación]
   TTL: 60 (o por defecto)
   ```
3. Click **"Save"** o **"Add"**

#### **3.3. Actualizar Registro DKIM Existente**

**Ya tienes un registro `resend._domainkey`**, pero necesitas actualizarlo con el valor nuevo de Resend:

1. Busca el registro existente: `resend._domainkey` (TXT)
2. Click en el menú (3 puntos) → **"Edit"** o **"Update"**
3. Reemplaza el **Value** con el nuevo valor que Resend te dio
4. Guarda

**O si prefieres crear uno nuevo:**
1. Click **"Add Record"**
2. Configura:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [El nuevo valor DKIM que Resend te dio]
   TTL: 60
   ```
3. Guarda
4. Elimina el registro viejo después

#### **3.4. Agregar Registro MX (Opcional, para recibir emails)**

Si Resend te da un registro MX:

1. Click **"Add Record"**
2. Configura:
   ```
   Type: MX
   Name: @ (o dejar vacío)
   Value: feedback-smtp.resend.com (o el que Resend te dé)
   Priority: 10 (o el que Resend te dé)
   TTL: 60
   ```
3. Guarda

---

### **PASO 4: Esperar Propagación DNS**

- ⏳ **Tiempo típico**: 5-30 minutos
- ⏳ **Máximo**: 24 horas (raro)

**Cómo verificar:**
- Usa: https://dnschecker.org
- Busca `runningeraclub.com`
- Verifica que los registros TXT aparezcan

---

### **PASO 5: Verificar Dominio en Resend**

1. Ve a Resend Dashboard: https://resend.com/domains
2. Busca `runningeraclub.com`
3. Click **"Verify"** o espera verificación automática
4. Cuando esté verificado:
   - ✅ Verás un check verde
   - ✅ Status: "Verified"

---

### **PASO 6: Configurar en Supabase**

Una vez verificado en Resend:

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth
2. Scroll hasta **"SMTP Settings"**
3. Activa **"Enable Custom SMTP"**
4. Configura:

```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Tu API Key de Resend]
Sender Email: noreply@runningeraclub.com
Sender Name: RUNNING ERA Club
```

5. Guarda

---

## 🔍 TROUBLESHOOTING

### ❌ No puedo editar DNS en Vercel

**Causa**: Puede que no tengas permisos o el dominio esté bloqueado

**Solución**:
1. Verifica que eres el owner del proyecto en Vercel
2. Ve a Settings → Domains → `runningeraclub.com`
3. Verifica que el dominio esté correctamente conectado

---

### ❌ El registro `resend._domainkey` ya existe pero es viejo

**Solución**:
1. **Opción A**: Edita el registro existente y actualiza el Value
2. **Opción B**: Crea uno nuevo con el nombre exacto, luego elimina el viejo

---

### ❌ Dominio no se verifica en Resend después de agregar registros

**Verifica**:
1. ✅ Los registros están guardados en Vercel
2. ✅ Los valores son EXACTOS (sin espacios extra)
3. ✅ Esperaste 5-30 minutos para propagación
4. ✅ Usa https://dnschecker.org para verificar que los registros aparecen globalmente

**Si aún no funciona**:
- Espera hasta 24 horas (raro, pero puede pasar)
- Verifica que copiaste los valores correctos de Resend
- Contacta soporte de Resend si persiste

---

### ❌ Conflicto con Amazon SES (`send` subdominio)

**No hay conflicto**: 
- Amazon SES usa el subdominio `send.runningeraclub.com`
- Resend usa el dominio principal `runningeraclub.com`
- Pueden coexistir sin problemas

---

## 📋 CHECKLIST COMPLETO

- [ ] Dominio agregado en Resend
- [ ] Registros DNS copiados de Resend
- [ ] Registro TXT de verificación agregado en Vercel
- [ ] Registro `resend._domainkey` actualizado en Vercel
- [ ] Registro MX agregado (si es necesario)
- [ ] Esperado 5-30 minutos para propagación
- [ ] Verificado en dnschecker.org que los registros aparecen
- [ ] Dominio verificado en Resend Dashboard
- [ ] API Key de Resend obtenida
- [ ] SMTP configurado en Supabase
- [ ] Email de prueba enviado
- [ ] Email recibido correctamente

---

## 🎯 RESUMEN RÁPIDO

1. **Resend Dashboard** → Agregar dominio → Copiar registros DNS
2. **Vercel Dashboard** → Settings → Domains → `runningeraclub.com` → DNS Records
3. **Agregar registros** que Resend te dio (TXT, DKIM, MX)
4. **Esperar 5-30 min** para propagación
5. **Verificar en Resend** → Debería aparecer como "Verified"
6. **Configurar en Supabase** → SMTP Settings → Usar `noreply@runningeraclub.com`

---

## ⚡ NOTA IMPORTANTE

**Ya tienes un registro `resend._domainkey` en Vercel**, lo que significa que:
- ✅ Ya intentaste configurar Resend antes
- ⚠️ Necesitas **actualizar ese registro** con el nuevo valor que Resend te dé
- ✅ O crear uno nuevo y eliminar el viejo

**El valor DKIM cambia cada vez que agregas un dominio en Resend**, así que necesitas el valor actualizado.

---

**¿Necesitas ayuda con algún paso específico? ¿Ya agregaste el dominio en Resend y tienes los registros DNS?**

