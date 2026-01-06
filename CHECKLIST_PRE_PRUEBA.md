# ✅ Checklist Pre-Prueba - Sistema de Pagos Stripe

## 🔐 Variables de Entorno

Verifica que tu `.env.local` tenga TODAS estas variables:

```env
# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (opcional pero recomendado)

# Stripe (OBLIGATORIAS)
STRIPE_SECRET_KEY=sk_test_... (o sk_live_... en producción)
STRIPE_WEBHOOK_SECRET=whsec_... (ya lo agregaste ✅)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (opcional, para futuras mejoras)

# URL (recomendado)
NEXT_PUBLIC_URL=http://localhost:3000 (o tu URL de producción)
```

## 📊 Base de Datos - Migraciones SQL

**DEBES ejecutar estos 3 scripts en Supabase SQL Editor:**

### 1. ✅ Schema de pagos (OBLIGATORIO)
```sql
-- Ejecutar: supabase/stripe-schema.sql
```
**Qué hace:** Crea tabla `payment_transactions` y agrega campos a `attendees`

### 2. ✅ Campos de pago en registros (OBLIGATORIO)
```sql
-- Ejecutar: supabase/add-payment-to-registrations.sql
```
**Qué hace:** Agrega campos de pago a `event_registrations`

### 3. ✅ Stripe Customer ID (OBLIGATORIO)
```sql
-- Ejecutar: supabase/add-stripe-customers.sql
```
**Qué hace:** Agrega `stripe_customer_id` a `members` y `attendees`

**¿Cómo ejecutar?**
1. Ve a tu proyecto en Supabase
2. Abre SQL Editor
3. Copia y pega el contenido de cada archivo
4. Ejecuta uno por uno

## 🔄 Servidores que deben estar corriendo

### 1. Next.js Development Server
```bash
npm run dev
```
**Debe estar en:** http://localhost:3000

### 2. Stripe Webhook Listener (en otra terminal)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
**DEBE estar corriendo** para que los webhooks funcionen.

## ✅ Checklist Rápido

- [ ] Variables de entorno configuradas (especialmente `STRIPE_SECRET_KEY`)
- [ ] Migración 1 ejecutada: `stripe-schema.sql`
- [ ] Migración 2 ejecutada: `add-payment-to-registrations.sql`
- [ ] Migración 3 ejecutada: `add-stripe-customers.sql`
- [ ] Servidor Next.js corriendo (`npm run dev`)
- [ ] Stripe listener corriendo (`stripe listen`)
- [ ] Tienes un evento con precio en la BD (para probar)

## 🧪 Cómo Probar

### Paso 1: Crear un evento de prueba con precio
1. Ve a `/admin/eventos/nuevo`
2. Crea un evento
3. **IMPORTANTE:** Agrega un precio (ej: "$500 MXN" o "500")

### Paso 2: Probar registro y pago
1. Ve a la página del evento
2. Haz clic en "REGÍSTRATE"
3. Elige "Registro Rápido" o "Crear Cuenta"
4. Completa el formulario
5. Serás redirigido a Stripe Checkout

### Paso 3: Usar tarjeta de prueba
**Tarjeta de prueba de Stripe:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura (ej: 12/25)
- CVC: Cualquier 3 dígitos (ej: 123)
- Código postal: Cualquier código (ej: 12345)

### Paso 4: Verificar
1. Después del pago, verás página de éxito
2. En Stripe listener (terminal), verás eventos recibidos
3. En `/admin/pagos`, deberías ver la transacción
4. En Stripe Dashboard, verás el pago y el cliente

## 🚨 Problemas Comunes

### ❌ "STRIPE_SECRET_KEY no está definido"
**Solución:** Agrega `STRIPE_SECRET_KEY=sk_test_...` a `.env.local` y reinicia el servidor

### ❌ Webhooks no funcionan
**Solución:** Verifica que `stripe listen` esté corriendo en otra terminal

### ❌ "Evento no requiere pago"
**Solución:** Asegúrate de que el evento tenga un precio válido (no "0" ni "gratis")

### ❌ Error en migraciones SQL
**Solución:** Ejecuta las migraciones en orden, una por una. Si ya existen algunos campos, usa `IF NOT EXISTS`

## 📝 Próximos Pasos Después de Probar

1. ✅ Verificar que los pagos se registren correctamente
2. ✅ Probar el dashboard de admin (`/admin/pagos`)
3. ✅ Probar un reembolso
4. ✅ Verificar que se creen clientes en Stripe
5. ✅ Verificar que los webhooks actualicen la BD

---

**¿Listo para probar?** Sigue el checklist de arriba y luego prueba con un evento de prueba! 🚀



