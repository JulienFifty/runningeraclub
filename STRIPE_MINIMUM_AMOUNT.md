# 💰 Límite Mínimo de Stripe: $10.00 MXN

## 🔍 Problema

Stripe requiere un **mínimo de $10.00 MXN** por transacción de Checkout. Si un evento tiene un precio menor a $10 MXN, Stripe rechazará la creación de la sesión de checkout con este error:

```
The Checkout Session's total amount due must add up to at least $10.00 mxn
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Validación Antes de Crear Sesión**

Ahora validamos el precio **antes** de intentar crear la sesión de Stripe:

```typescript
// ✅ VALIDAR MÍNIMO DE STRIPE ($10.00 MXN = 1000 centavos)
const STRIPE_MINIMUM_AMOUNT = 1000; // $10.00 MXN en centavos
if (amount < STRIPE_MINIMUM_AMOUNT) {
  return NextResponse.json(
    { 
      error: 'Precio mínimo no alcanzado', 
      details: `Stripe requiere un mínimo de $${STRIPE_MINIMUM_AMOUNT / 100} MXN por transacción. El precio del evento ($${amount / 100} MXN) es menor al mínimo requerido.`,
      hint: 'Considera ajustar el precio del evento o usar un método de pago alternativo para eventos de bajo costo.'
    },
    { status: 400 }
  );
}
```

### **Mensaje de Error Claro**

El usuario verá un mensaje claro explicando el problema:

```
Error: Precio mínimo no alcanzado
Stripe requiere un mínimo de $10.00 MXN por transacción. 
El precio del evento ($5.00 MXN) es menor al mínimo requerido.
```

---

## 🎯 Opciones para Eventos de Bajo Costo

### **Opción 1: Ajustar el Precio del Evento** (Recomendado)

Si el evento cuesta menos de $10 MXN, considera:

1. **Aumentar el precio a $10 MXN mínimo**
2. **Hacer el evento gratuito** (si es posible)
3. **Combinar con otros servicios** para alcanzar el mínimo

**Ejemplo:**
- Evento original: $5 MXN
- Opción A: Aumentar a $10 MXN
- Opción B: Hacerlo gratuito
- Opción C: Agregar "Kit de corredor" por $5 MXN adicional = $10 MXN total

---

### **Opción 2: Usar Payment Links de Stripe**

Para eventos de bajo costo, puedes usar **Stripe Payment Links** que tienen un límite menor, pero requieren configuración manual.

**Pasos:**
1. Ve a: https://dashboard.stripe.com/payment-links
2. Crea un Payment Link para el evento
3. Usa ese link en lugar de Checkout Session

**Limitación**: Requiere crear un link manual para cada evento.

---

### **Opción 3: Acumular Múltiples Eventos**

Permitir que los usuarios registren múltiples eventos en una sola transacción para alcanzar el mínimo.

**Ejemplo:**
- Evento 1: $5 MXN
- Evento 2: $5 MXN
- Total: $10 MXN ✅

---

### **Opción 4: Pago Manual o Transferencia**

Para eventos muy económicos, ofrecer pago manual:

1. Mostrar instrucciones de transferencia bancaria
2. Confirmar registro manualmente después del pago
3. No usar Stripe para estos eventos

---

## 📋 Precios Recomendados

### **Para Usar Stripe Checkout:**

| Precio | Estado | Recomendación |
|--------|--------|---------------|
| $0 MXN | ✅ Gratis | Marcar como evento gratuito |
| $1 - $9 MXN | ❌ Menor al mínimo | Usar opción alternativa |
| $10+ MXN | ✅ Válido | Usar Stripe Checkout normalmente |

---

## 🔧 Configuración Actual

### **Validación Implementada:**

- ✅ Verifica precio antes de crear sesión
- ✅ Muestra error claro al usuario
- ✅ Previene errores de Stripe
- ✅ Considera descuentos de cupones

### **Dónde se Valida:**

1. **En `/api/stripe/create-checkout`**:
   - Después de aplicar cupones
   - Antes de crear la sesión de Stripe
   - Devuelve error 400 si es menor al mínimo

2. **En el Frontend**:
   - Muestra el mensaje de error detallado
   - Informa al usuario sobre el problema

---

## 🧪 Probar la Validación

### **Caso 1: Precio Menor a $10 MXN**

1. Crea un evento con precio `$5` o `$9`
2. Intenta registrarte
3. Deberías ver:
   ```
   Error: Precio mínimo no alcanzado
   Stripe requiere un mínimo de $10.00 MXN por transacción.
   ```

### **Caso 2: Precio Igual o Mayor a $10 MXN**

1. Crea un evento con precio `$10` o más
2. Intenta registrarte
3. Debería funcionar normalmente

### **Caso 3: Cupón que Reduce el Precio**

1. Crea un evento con precio `$15`
2. Aplica un cupón de `$10` de descuento
3. Precio final: `$5` ❌
4. Debería mostrar error de precio mínimo

---

## 📊 Límites de Stripe por País

| País | Moneda | Mínimo |
|------|--------|--------|
| México | MXN | $10.00 |
| Estados Unidos | USD | $0.50 |
| Canadá | CAD | $0.50 |
| Reino Unido | GBP | £0.30 |

**Nota**: Estos límites pueden cambiar. Verifica en: https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts

---

## 🔍 Verificar Precio Actual

Para verificar el precio de un evento:

```sql
SELECT id, title, price 
FROM events 
WHERE id = 'tu-event-id';
```

O en Supabase Dashboard:
1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/editor
2. Tabla `events`
3. Busca el evento
4. Revisa la columna `price`

---

## ✅ Checklist para Eventos

Antes de publicar un evento con precio:

- [ ] Precio es `$0` o `gratis` → ✅ Evento gratuito
- [ ] Precio es `$10` o más → ✅ Usar Stripe Checkout
- [ ] Precio es `$1 - $9` → ⚠️ Usar método alternativo
- [ ] Precio con cupón aplicado es `$10` o más → ✅ Válido
- [ ] Precio con cupón aplicado es menor a `$10` → ❌ Error

---

## 💡 Recomendaciones

1. **Establecer precio mínimo**: Configurar que todos los eventos pagados sean al menos $10 MXN
2. **Validar en el admin**: Agregar validación en el formulario de creación de eventos
3. **Documentar para usuarios**: Informar sobre el mínimo requerido
4. **Considerar eventos gratuitos**: Para eventos de bajo costo, hacerlos gratuitos

---

## 🆘 Si Necesitas Eventos de Bajo Costo

Si realmente necesitas eventos de menos de $10 MXN:

1. **Contacta a Stripe**: Pueden hacer excepciones en casos especiales
2. **Usa Payment Links**: Tienen límites diferentes
3. **Implementa pago manual**: Para casos muy específicos
4. **Combina eventos**: Permite múltiples registros en una transacción

---

**El sistema ahora valida automáticamente el precio mínimo y muestra un error claro si no se cumple.**

