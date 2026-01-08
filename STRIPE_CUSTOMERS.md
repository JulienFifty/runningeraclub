# Gestión de Clientes en Stripe

## Cómo Funciona

### ✅ Implementación Actual (Mejorada)

Ahora **SÍ** creamos clientes únicos en Stripe para cada usuario:

#### Para Miembros:
1. Cuando un miembro hace su **primer pago**:
   - Se crea un cliente en Stripe con su email y nombre
   - Se guarda `stripe_customer_id` en la tabla `members`
   - Metadata incluye `member_id` para referencia

2. En pagos **subsiguientes**:
   - Se reutiliza el mismo `stripe_customer_id`
   - Todos los pagos quedan vinculados al mismo cliente
   - Historial completo visible en Stripe Dashboard

#### Para Invitados (sin cuenta):
1. Cuando un invitado hace un pago:
   - Si tiene email, buscamos si ya existe un cliente en Stripe con ese email
   - Si existe, lo reutilizamos
   - Si no, creamos uno nuevo
   - Se guarda `stripe_customer_id` en la tabla `attendees`

## Beneficios

### 🎯 Para Ti (Admin):
- **Historial unificado**: Ver todos los pagos de un cliente en Stripe Dashboard
- **Mejores reportes**: Análisis de clientes recurrentes
- **Gestión centralizada**: Un solo lugar para ver la actividad de cada cliente
- **Identificación fácil**: Metadata conecta Stripe con tu BD

### 👤 Para el Cliente:
- **Métodos de pago guardados**: En futuras compras pueden usar la misma tarjeta sin volver a ingresarla
- **Portal de cliente**: Pueden acceder a `customer_portal` de Stripe para ver historial y gestionar pagos
- **Facturas automáticas**: Stripe puede generar facturas por cliente
- **Mejor experiencia**: Checkout más rápido en compras futuras

## Ejemplo de Flujo

### Primer Evento:
```
Usuario: Juan Pérez (juan@email.com)
Evento: Carrera Nocturna - $500 MXN

1. Juan se registra y paga
2. Sistema crea cliente en Stripe: cus_ABC123
3. Se guarda en BD:
   members.stripe_customer_id = "cus_ABC123"
4. Pago procesado y vinculado al cliente
```

### Segundo Evento:
```
Usuario: Juan Pérez (mismo)
Evento: Trail Run - $750 MXN

1. Juan se registra y paga
2. Sistema encuentra stripe_customer_id existente: cus_ABC123
3. Usa el mismo cliente para el pago
4. Ahora en Stripe, Juan tiene 2 pagos en su historial
```

### En Stripe Dashboard:
```
Cliente: cus_ABC123
Nombre: Juan Pérez
Email: juan@email.com

Pagos:
- $500.00 MXN - Carrera Nocturna - 15 Ene 2026
- $750.00 MXN - Trail Run - 5 Feb 2026

Total pagado: $1,250.00 MXN
```

## Estructura en Base de Datos

### Tabla `members`:
```sql
members
├── id (UUID)
├── email
├── first_name
├── last_name
└── stripe_customer_id (TEXT) ← NUEVO
    Ejemplo: "cus_PQRfYZ1234abcd"
```

### Tabla `attendees`:
```sql
attendees
├── id (UUID)
├── name
├── email
└── stripe_customer_id (TEXT) ← NUEVO
    Ejemplo: "cus_ABCxyz9876dcba"
```

### Tabla `payment_transactions`:
```sql
payment_transactions
├── id (UUID)
├── stripe_payment_intent_id
└── metadata (JSONB)
    └── stripe_customer_id ← Referencia al cliente
```

## API Endpoint: Ver Historial de Cliente

Puedes consultar el historial completo de un cliente:

```bash
GET /api/stripe/customer?customer_id=cus_ABC123
```

**Respuesta**:
```json
{
  "customer": {
    "id": "cus_ABC123",
    "email": "juan@email.com",
    "name": "Juan Pérez",
    "created": 1704067200
  },
  "payment_history": [
    {
      "id": "pi_1234",
      "amount": 50000,
      "currency": "mxn",
      "status": "succeeded",
      "created": 1704067200
    },
    {
      "id": "pi_5678",
      "amount": 75000,
      "currency": "mxn",
      "status": "succeeded",
      "created": 1706745600
    }
  ],
  "payment_methods": [
    {
      "id": "pm_1234",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242"
      }
    }
  ]
}
```

## Ver en Admin Dashboard

En el dashboard de pagos (`/admin/pagos`), ahora verás:
- Nombre del cliente
- Email
- **Customer ID** de Stripe (primeros 20 caracteres)

Esto te permite hacer clic e ir directamente al perfil del cliente en Stripe Dashboard.

## Casos Especiales

### 1. Cliente sin Email (Invitado):
- No se crea customer en Stripe
- El pago se procesa sin customer asociado
- No hay historial persistente

### 2. Email Duplicado (Invitado):
- Se busca customer existente con ese email
- Si existe, se reutiliza
- Esto unifica invitados con el mismo email

### 3. Miembro que antes fue Invitado:
- Si un invitado crea cuenta después
- Idealmente, deberías migrar su stripe_customer_id
- (Puedes implementar esto si lo necesitas)

## Mejores Prácticas

1. **Siempre pide email**: Incluso para invitados, para poder crear customers

2. **Valida emails**: Evita duplicados y errores tipográficos

3. **Sincroniza datos**: Si un miembro actualiza su nombre/email, actualiza también en Stripe:
   ```typescript
   await stripe.customers.update(stripe_customer_id, {
     name: newName,
     email: newEmail
   });
   ```

4. **No elimines customers**: Mantén el historial incluso si un miembro se da de baja

## Testing

### Tarjeta de Prueba:
```
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura
CVC: Cualquier 3 dígitos
```

### Verificar Cliente Creado:
1. Completa un pago de prueba
2. Ve a Stripe Dashboard > Customers
3. Busca por email del usuario
4. Verifica que el customer_id coincida con tu BD

## Migración de Datos Existentes

Si ya tienes pagos sin customers, puedes crear un script de migración:

```typescript
// Script de ejemplo (NO ejecutar automáticamente)
const migrateExistingPayments = async () => {
  // 1. Obtener todos los members sin stripe_customer_id
  // 2. Para cada uno, crear customer en Stripe
  // 3. Actualizar la BD con el nuevo customer_id
  // 4. Buscar sus payment_intents en Stripe
  // 5. Vincularlos al nuevo customer
};
```

¿Necesitas ayuda con esto?

## Resumen

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Cliente en Stripe | ❌ No se crea | ✅ Se crea automáticamente |
| Historial de pagos | ❌ Disperso | ✅ Unificado por cliente |
| Segundo pago | ❌ Cliente nuevo | ✅ Mismo cliente |
| Métodos guardados | ❌ No disponible | ✅ Disponible |
| Portal de cliente | ❌ No funciona | ✅ Funciona |
| Reportes | ❌ Difíciles | ✅ Fáciles |

---

**Conclusión**: Ahora cada miembro tiene una cuenta única en Stripe, y todos sus pagos quedan registrados en la misma cuenta de cliente. Esto mejora significativamente la gestión y experiencia de usuario.






