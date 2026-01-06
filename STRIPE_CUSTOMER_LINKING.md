# Sistema de Vinculación de Clientes Stripe

## ✅ Sí, Estamos de Acuerdo

**Cada cuenta de miembro está vinculada con su cuenta cliente en Stripe.**

Cuando un nuevo usuario crea su cuenta y paga un evento:
1. ✅ Se crea un **cliente en Stripe** automáticamente
2. ✅ El `stripe_customer_id` se guarda en la tabla `members`
3. ✅ **Todos los futuros pagos** usan el mismo cliente de Stripe
4. ✅ El historial de pagos queda vinculado al mismo cliente

---

## 🔄 Cómo Funciona el Flujo

### **Primera Vez que un Usuario Paga:**

1. Usuario se registra en RUNNING ERA → Se crea cuenta en `members`
2. Usuario intenta registrarse en un evento de pago
3. Sistema verifica si tiene `stripe_customer_id` en `members`
4. **NO tiene** → Crea nuevo cliente en Stripe:
   ```javascript
   const customer = await stripe.customers.create({
     email: member.email,
     name: member.full_name,
     metadata: {
       member_id: member_id,
       source: 'runningeraclub',
     },
   });
   ```
5. Guarda `stripe_customer_id` en la tabla `members`
6. Usa ese cliente para el checkout de Stripe

### **Pagos Subsecuentes:**

1. Usuario intenta registrarse en otro evento
2. Sistema verifica si tiene `stripe_customer_id` en `members`
3. **SÍ tiene** → Reutiliza el mismo cliente:
   ```javascript
   stripeCustomerId = member.stripe_customer_id; // Reutilizar
   ```
4. Todos los pagos quedan vinculados al mismo cliente en Stripe

---

## 📊 Beneficios de Esta Vinculación

### **1. Historial Unificado**
- Todos los pagos del mismo usuario aparecen en un solo cliente en Stripe
- Fácil de ver el historial completo de pagos

### **2. Métodos de Pago Guardados**
- Stripe puede guardar métodos de pago del cliente
- El usuario puede pagar más rápido en futuros eventos

### **3. Mejor Experiencia**
- Stripe puede sugerir métodos de pago anteriores
- Menos fricción en el checkout

### **4. Reportes y Analytics**
- Puedes ver cuánto ha gastado cada miembro
- Fácil identificar clientes recurrentes

### **5. Reembolsos Más Fáciles**
- Todos los pagos están vinculados al mismo cliente
- Fácil procesar reembolsos desde Stripe Dashboard

---

## 🗄️ Estructura de Base de Datos

### **Tabla `members`:**
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,  -- ✅ Vinculación con Stripe
  ...
);
```

### **Tabla `payment_transactions`:**
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  stripe_customer_id TEXT,  -- ✅ También guardado aquí
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  ...
);
```

---

## 🔍 Verificar la Vinculación

### **En Supabase:**
```sql
-- Ver miembros con su cliente de Stripe vinculado
SELECT 
  id,
  email,
  full_name,
  stripe_customer_id,
  created_at
FROM members
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC;
```

### **En Stripe Dashboard:**
1. Ve a: https://dashboard.stripe.com/customers
2. Busca por email del usuario
3. Deberías ver **un solo cliente** con todos sus pagos

### **Verificar que Funciona:**
```sql
-- Ver todos los pagos de un miembro específico
SELECT 
  pt.id,
  pt.amount,
  pt.currency,
  pt.status,
  pt.stripe_customer_id,
  pt.created_at,
  e.title as event_title
FROM payment_transactions pt
JOIN events e ON pt.event_id = e.id
WHERE pt.member_id = 'UUID_DEL_MIEMBRO'
ORDER BY pt.created_at DESC;
```

---

## ⚙️ Configuración Requerida

### **1. Ejecutar Script SQL en Supabase:**

**Archivo:** `supabase/add-stripe-customers.sql`

```sql
-- Agregar campo stripe_customer_id a la tabla members
ALTER TABLE members
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Agregar campo stripe_customer_id a la tabla attendees
ALTER TABLE attendees
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_members_stripe_customer 
ON members(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;
```

### **2. Verificar que el Código Esté Actualizado:**

El código en `app/api/stripe/create-checkout/route.ts` ya está configurado para:
- ✅ Crear cliente en Stripe si no existe
- ✅ Guardar `stripe_customer_id` en `members`
- ✅ Reutilizar cliente existente para futuros pagos

---

## 🧪 Cómo Probar

### **Test 1: Primer Pago**
1. Crea un nuevo usuario
2. Regístrate en un evento de pago
3. Completa el pago
4. Verifica en Supabase que `stripe_customer_id` se guardó
5. Verifica en Stripe que se creó un nuevo cliente

### **Test 2: Segundo Pago**
1. Con el mismo usuario, regístrate en otro evento
2. Completa el pago
3. Verifica en Stripe que **se usó el mismo cliente** (no se creó uno nuevo)
4. Verifica que ambos pagos aparecen en el mismo cliente en Stripe

---

## 📝 Flujo Completo Visual

```
Usuario Nuevo
    ↓
Registrarse en RUNNING ERA
    ↓
Crear cuenta en `members` (sin stripe_customer_id)
    ↓
Intentar pagar evento #1
    ↓
¿Tiene stripe_customer_id? → NO
    ↓
Crear cliente en Stripe → cus_xxxxx
    ↓
Guardar en members.stripe_customer_id = 'cus_xxxxx'
    ↓
Usar cliente para checkout
    ↓
✅ Pago completado
    ↓
─────────────────────────────
    ↓
Intentar pagar evento #2
    ↓
¿Tiene stripe_customer_id? → SÍ (cus_xxxxx)
    ↓
Reutilizar mismo cliente
    ↓
Usar cliente para checkout
    ↓
✅ Pago completado (mismo cliente)
```

---

## ⚠️ Notas Importantes

### **Unicidad:**
- `stripe_customer_id` es **UNIQUE** en la tabla `members`
- Un miembro solo puede tener un cliente de Stripe
- Un cliente de Stripe solo puede estar vinculado a un miembro

### **Invitados (Guests):**
- Los invitados también pueden tener `stripe_customer_id`
- Si un invitado se registra después como miembro, se puede vincular su cliente existente

### **Seguridad:**
- El `stripe_customer_id` se guarda en la base de datos
- Solo se usa para crear checkouts, no expone información sensible
- Stripe maneja toda la información de pago de forma segura

---

## ✅ Checklist de Configuración

- [ ] Script SQL ejecutado en Supabase (`add-stripe-customers.sql`)
- [ ] Columna `stripe_customer_id` existe en tabla `members`
- [ ] Código actualizado para usar `full_name` (no `first_name`/`last_name`)
- [ ] Probado con primer pago (debe crear cliente)
- [ ] Probado con segundo pago (debe reutilizar cliente)
- [ ] Verificado en Stripe Dashboard que los pagos están vinculados

---

## 🎯 Resultado Final

**Cada miembro tiene un cliente único en Stripe que se reutiliza para todos sus pagos futuros.**

Esto permite:
- ✅ Historial unificado de pagos
- ✅ Métodos de pago guardados
- ✅ Mejor experiencia de usuario
- ✅ Reportes más precisos
- ✅ Reembolsos más fáciles

