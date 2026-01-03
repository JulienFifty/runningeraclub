# Pasos para obtener STRIPE_WEBHOOK_SECRET

## Para DESARROLLO LOCAL:

### 1. Login en Stripe CLI
```bash
stripe login
```
Esto abrirá tu navegador para autenticarte.

### 2. Iniciar el listener (IMPORTANTE: usa puerto 3000, no 4242)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 3. Copiar el webhook secret
Después de ejecutar el comando anterior, verás algo como:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Copia ese `whsec_xxxxx` y agrégalo a tu `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Mantener el listener corriendo
**IMPORTANTE**: Debes mantener este comando corriendo mientras desarrollas. 
Abre una terminal separada para tu servidor de Next.js.

---

## Para PRODUCCIÓN:

### 1. Ve a Stripe Dashboard
https://dashboard.stripe.com/webhooks

### 2. Clic en "Add endpoint"

### 3. Configura:
- **Endpoint URL**: `https://tu-dominio.com/api/stripe/webhook`
- **Events to send**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`

### 4. Copia el "Signing secret"
Estará en la página del webhook, comienza con `whsec_`

### 5. Agrégalo a tus variables de entorno de producción
(En Vercel, Netlify, o tu servidor)

---

## Notas Importantes:

⚠️ **DIFERENCIA CLAVE:**
- La imagen muestra `localhost:4242/webhook`
- **TU aplicación usa**: `localhost:3000/api/stripe/webhook`
- Asegúrate de usar el puerto correcto (3000)

🔄 **El webhook secret cambia:**
- En desarrollo: Cada vez que ejecutas `stripe listen`, puede cambiar
- En producción: Es permanente mientras no elimines el webhook

✅ **Verificación:**
- El listener debe estar corriendo cuando pruebas pagos
- Verás los eventos en la terminal cuando se procesen
- Los pagos fallarán si el listener no está activo

