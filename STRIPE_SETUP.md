# Guía de Configuración de Stripe

## Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
# Stripe Keys (obtener de https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (obtener después de crear el webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL pública (para webhooks y redirects)
NEXT_PUBLIC_URL=http://localhost:3000
```

## Configuración en Stripe Dashboard

### 1. Obtener API Keys

1. Ve a https://dashboard.stripe.com/apikeys
2. Copia la "Publishable key" (comienza con `pk_test_`)
3. Revela y copia la "Secret key" (comienza con `sk_test_`)

### 2. Configurar Webhooks

1. Ve a https://dashboard.stripe.com/webhooks
2. Clic en "Add endpoint"
3. URL del endpoint:
   - **Desarrollo**: `http://localhost:3000/api/stripe/webhook` (usa Stripe CLI)
   - **Producción**: `https://tu-dominio.com/api/stripe/webhook`

4. Selecciona los siguientes eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

5. Copia el "Signing secret" (comienza con `whsec_`)

### 3. Stripe CLI (Para desarrollo local)

Instala Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login:
```bash
stripe login
```

Forward webhooks a tu servidor local:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Esto te dará un webhook secret temporal para desarrollo.

## Ejecutar Migraciones de Base de Datos

Ejecuta los siguientes scripts SQL en tu Supabase:

1. **Agregar campos de pago a tablas existentes**:
   ```bash
   psql -h [your-supabase-host] -d postgres -f supabase/stripe-schema.sql
   ```

2. **Actualizar event_registrations**:
   ```bash
   psql -h [your-supabase-host] -d postgres -f supabase/add-payment-to-registrations.sql
   ```

3. **Agregar campos de Stripe Customer ID** (¡IMPORTANTE!):
   ```bash
   psql -h [your-supabase-host] -d postgres -f supabase/add-stripe-customers.sql
   ```

O ejecuta los scripts directamente en el SQL Editor de Supabase Dashboard.

## Verificar la Configuración

1. **Verificar variables de entorno**:
   - Reinicia el servidor de desarrollo después de agregar las variables
   - Verifica que todas las keys estén presentes

2. **Probar el flujo de pago**:
   - Regístrate en un evento de pago
   - Usa la tarjeta de prueba de Stripe: `4242 4242 4242 4242`
   - Fecha de expiración: cualquier fecha futura
   - CVC: cualquier 3 dígitos
   - Postal: cualquier código postal

3. **Verificar webhooks**:
   - En desarrollo, verifica que Stripe CLI esté corriendo
   - Completa un pago de prueba
   - Verifica que la transacción se actualice en la base de datos

## Dashboard de Admin

Accede a `/admin/pagos` para:
- Ver todas las transacciones
- Filtrar por evento
- Procesar reembolsos
- Ver estadísticas de ingresos

## Endpoints de la API

### POST `/api/stripe/create-checkout`
Crea una sesión de checkout de Stripe.

**Body**:
```json
{
  "event_id": "uuid",
  "member_id": "uuid" (opcional),
  "attendee_id": "uuid" (opcional),
  "is_guest": true/false
}
```

**Nota**: Automáticamente crea o vincula un cliente en Stripe para mantener historial.

### POST `/api/stripe/webhook`
Recibe eventos de webhook de Stripe (configurado automáticamente).

### POST `/api/stripe/refund`
Procesa un reembolso.

**Body**:
```json
{
  "payment_intent_id": "pi_...",
  "transaction_id": "uuid",
  "reason": "string" (opcional)
}
```

### GET `/api/stripe/customer?customer_id=cus_...`
Obtiene información del cliente y su historial de pagos en Stripe.

**Respuesta**:
```json
{
  "customer": {...},
  "payment_history": [...],
  "payment_methods": [...]
}
```

## Páginas de Usuario

- `/pago/exito?session_id=...` - Página de confirmación de pago exitoso
- `/pago/cancelado` - Página cuando el usuario cancela el pago

## Notas Importantes

1. **Modo Test vs Producción**:
   - En desarrollo, usa las keys de test (comienzan con `sk_test_` y `pk_test_`)
   - En producción, cambia a las keys de producción

2. **Webhooks en Producción**:
   - Asegúrate de configurar el webhook con tu URL de producción
   - Actualiza `STRIPE_WEBHOOK_SECRET` con el secret de producción

3. **Seguridad**:
   - Nunca expongas `STRIPE_SECRET_KEY` en el cliente
   - Usa `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` solo para el cliente
   - Verifica siempre las firmas de webhook

4. **Moneda**:
   - Por defecto configurado para MXN (pesos mexicanos)
   - Modifica en `src/lib/stripe.ts` si necesitas otra moneda

## Solución de Problemas

### "No signature provided" en webhooks
- Verifica que Stripe CLI esté corriendo en desarrollo
- Verifica que el webhook secret sea correcto

### "Payment intent not found"
- Verifica que el `payment_intent_id` sea correcto
- Asegúrate de usar las keys correctas (test vs producción)

### Transacciones no se actualizan
- Verifica que los webhooks estén funcionando
- Revisa los logs de Stripe Dashboard > Developers > Webhooks

## Recursos

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/api/events/types)

