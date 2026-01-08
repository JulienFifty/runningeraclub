# 🔐 Configuración de Variables de Entorno

## Variables de Entorno Necesarias

Copia este contenido a tu archivo `.env.local` y completa con tus valores.

```env
# ==================== SUPABASE ====================
# Obtén estas claves en: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api

# URL de tu proyecto Supabase (OBLIGATORIA - cliente)
NEXT_PUBLIC_SUPABASE_URL=https://dvuacieikqwuffsfxucc.supabase.co

# Anon/Public key de Supabase (OBLIGATORIA - cliente)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role key de Supabase (OBLIGATORIA - servidor, webhooks)
# ⚠️ NUNCA expongas esta clave en el cliente
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==================== STRIPE ====================
# Obtén estas claves en: https://dashboard.stripe.com/apikeys

# Publishable key de Stripe (OBLIGATORIA - cliente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Secret key de Stripe (OBLIGATORIA - servidor)
# ⚠️ NUNCA expongas esta clave en el cliente
STRIPE_SECRET_KEY=sk_live_...

# Webhook secret de Stripe (OBLIGATORIA - webhooks)
# Obtén esta clave en: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# ==================== APLICACIÓN ====================

# URL base de tu aplicación (OBLIGATORIA)
# En desarrollo: http://localhost:3000
# En producción: https://www.runningeraclub.com
NEXT_PUBLIC_URL=https://www.runningeraclub.com
```

---

## 📋 Dónde Obtener Cada Clave

### **Supabase**
1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/api
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### **Stripe**
1. Ve a: https://dashboard.stripe.com/apikeys
2. Copia:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
3. Para el webhook secret:
   - Ve a: https://dashboard.stripe.com/webhooks
   - Click en tu webhook
   - Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## ⚠️ IMPORTANTE: Configurar en Vercel

Las mismas variables deben estar configuradas en Vercel:

1. Ve a: https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables

2. Agrega cada variable:
   - Click en "Add New"
   - Nombre: el nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: el valor correspondiente
   - Environments: selecciona **Production, Preview, Development**
   - Click en "Save"

3. Redeploya después de agregar las variables

---

## 🔍 Notas de Seguridad

### **Variables con `NEXT_PUBLIC_`:**
- Se exponen en el cliente (navegador)
- Cualquier persona puede verlas en el código del navegador
- Usar solo para claves públicas (anon keys, publishable keys)

### **Variables sin `NEXT_PUBLIC_`:**
- Solo disponibles en el servidor
- Nunca se exponen en el cliente
- Usar para claves secretas (service role, secret keys)

### **⚠️ NUNCA:**
- Commitear `.env.local` al repositorio (ya está en `.gitignore`)
- Exponer `SERVICE_ROLE_KEY` en el cliente
- Exponer `STRIPE_SECRET_KEY` en el cliente
- Compartir estas claves públicamente

---

## ✅ Verificar Configuración

### **En Desarrollo (local):**
```bash
# Verifica que el archivo .env.local existe
ls -la .env.local

# Si no existe, créalo
cp ENV_VARIABLES_SETUP.md .env.local
# Y edita el archivo con tus valores reales
```

### **En Producción (Vercel):**
1. Ve a: https://vercel.com/[tu-username]/runningeraclub/settings/environment-variables
2. Verifica que todas las variables estén configuradas
3. Verifica que "Production" esté seleccionado para cada una

---

## 🐛 Troubleshooting

### **Error: "Missing Supabase environment variables"**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén en `.env.local` (local) o Vercel (producción)
- Reinicia el servidor de desarrollo después de agregar las variables

### **Error: "No API key found in request"**
- Las variables no están configuradas en Vercel
- Sigue los pasos en `FIX_NO_API_KEY_ERROR.md`

### **Error: "Invalid Stripe publishable key"**
- Verifica que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` esté configurada
- Verifica que la clave empiece con `pk_` (test o live)

### **Error: "Webhook signature verification failed"**
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurada
- Verifica que la clave empiece con `whsec_`


