# 🧪 Plan de Testing - Edge Cases

## 📋 Objetivo

Este documento lista los escenarios edge cases que deben probarse para asegurar que el sistema funciona correctamente en situaciones inusuales o límite.

---

## 1. 🔐 Autenticación y Registro

### **Caso 1: Email Duplicado**
**Escenario**: Usuario intenta registrarse con email ya existente
- **Pasos**:
  1. Crear cuenta con `test@example.com`
  2. Intentar crear otra cuenta con `test@example.com`
- **Esperado**: Error "Email ya registrado" o redirect a login
- **Verificar**: No se crean cuentas duplicadas en `auth.users`

### **Caso 2: Crear Perfil de Otro Usuario**
**Escenario**: Usuario autenticado intenta crear perfil con ID diferente al suyo
- **Pasos**:
  1. Autenticarse como usuario A
  2. Intentar INSERT en `members` con `id = 'user-b-id'`
- **Esperado**: Error RLS (403 Forbidden)
- **Verificar**: Política `"Users can insert their own profile"` funciona

### **Caso 3: Ver Perfil de Otro Usuario**
**Escenario**: Usuario intenta ver perfil de otro usuario
- **Pasos**:
  1. Autenticarse como usuario A
  2. Intentar SELECT en `members` WHERE `id = 'user-b-id'`
- **Esperado**: Query retorna 0 filas
- **Verificar**: Política RLS previene acceso a datos de otros

### **Caso 4: Actualizar Perfil de Otro Usuario**
**Escenario**: Usuario intenta actualizar perfil de otro usuario
- **Pasos**:
  1. Autenticarse como usuario A
  2. Intentar UPDATE en `members` SET `full_name = 'Hacker'` WHERE `id = 'user-b-id'`
- **Esperado**: Error RLS (403 Forbidden) o UPDATE afecta 0 filas
- **Verificar**: Política `"Users can update their own profile"` funciona

### **Caso 5: Email No Confirmado**
**Escenario**: Usuario intenta acceder sin confirmar email
- **Pasos**:
  1. Crear cuenta pero no confirmar email
  2. Intentar acceder a `/miembros/dashboard`
- **Esperado**: Redirect a `/miembros/confirmar-email`
- **Verificar**: Validación de `email_confirmed` funciona

---

## 2. 📅 Registro de Eventos

### **Caso 6: Registro Duplicado**
**Escenario**: Usuario intenta registrarse dos veces al mismo evento
- **Pasos**:
  1. Registrarse a evento X
  2. Intentar registrarse nuevamente a evento X
- **Esperado**: 
  - Si está pagado: Error "Ya estás registrado"
  - Si está pendiente: Actualizar registro existente o error apropiado
- **Verificar**: No se crean registros duplicados (UNIQUE constraint)

### **Caso 7: Registro a Evento Sin Cupos**
**Escenario**: Usuario intenta registrarse a evento que está lleno
- **Pasos**:
  1. Llenar todos los cupos de un evento (`max_participants`)
  2. Intentar registrarse como nuevo usuario
- **Esperado**: Error "Cupo lleno" o deshabilitar botón de registro
- **Verificar**: Validación de cupos funciona en `register-event`

### **Caso 8: Ver Registros de Otros Usuarios**
**Escenario**: Usuario intenta ver registros de otro usuario
- **Pasos**:
  1. Autenticarse como usuario A
  2. Intentar SELECT en `event_registrations` WHERE `member_id = 'user-b-id'`
- **Esperado**: Query retorna 0 filas
- **Verificar**: Política RLS previene acceso

### **Caso 9: Registro Pendiente Antiguo**
**Escenario**: Registro pendiente de más de 2 horas
- **Pasos**:
  1. Crear registro con `payment_status = 'pending'` hace 3 horas
  2. Intentar registrarse al mismo evento
- **Esperado**: El sistema elimina o actualiza el registro antiguo
- **Verificar**: Lógica de cleanup funciona

### **Caso 10: Evento Eliminado**
**Escenario**: Usuario intenta registrarse a evento que fue eliminado
- **Pasos**:
  1. Eliminar evento X (como admin)
  2. Intentar registrarse a evento X
- **Esperado**: Error "Evento no encontrado"
- **Verificar**: Validación de existencia de evento

---

## 3. 💳 Pagos

### **Caso 11: Pago Exitoso pero Webhook Falla**
**Escenario**: Pago se completa en Stripe pero webhook no se ejecuta
- **Pasos**:
  1. Completar pago exitosamente
  2. Simular que el webhook falla o no llega
- **Esperado**: 
  - Página de éxito actualiza el registro
  - Endpoint de sincronización funciona
- **Verificar**: Múltiples capas de protección funcionan

### **Caso 12: Pago Exitoso pero Registro No Existe**
**Escenario**: Webhook llega pero no encuentra registro en BD
- **Pasos**:
  1. Completar pago exitosamente
  2. Eliminar registro de `event_registrations` (manual)
  3. Procesar webhook
- **Esperado**: Webhook crea el registro automáticamente
- **Verificar**: Fallback en webhook funciona

### **Caso 13: Sesión de Stripe Expirada**
**Escenario**: Usuario intenta usar sesión de Stripe expirada
- **Pasos**:
  1. Crear sesión de Stripe
  2. Esperar hasta que expire (>24 horas)
  3. Intentar usar la URL de la sesión
- **Esperado**: Stripe muestra error o el sistema detecta y crea nueva sesión
- **Verificar**: Manejo de sesiones expiradas

### **Caso 14: Pago Duplicado**
**Escenario**: Usuario intenta pagar dos veces
- **Pasos**:
  1. Completar pago exitosamente
  2. Intentar iniciar otro pago para el mismo evento
- **Esperado**: Error "Ya estás registrado" o actualización de registro
- **Verificar**: No se cobra dos veces

### **Caso 15: Precio Menor al Mínimo de Stripe**
**Escenario**: Evento con precio menor a $10.00 MXN
- **Pasos**:
  1. Crear evento con precio $5 MXN
  2. Intentar registrarse y pagar
- **Esperado**: Error "Precio mínimo no alcanzado" o marcado como gratuito
- **Verificar**: Validación de precio mínimo funciona

### **Caso 16: Pago Fallido**
**Escenario**: Pago se rechaza en Stripe (tarjeta rechazada)
- **Pasos**:
  1. Usar tarjeta rechazada en Stripe (4000 0000 0000 0002)
  2. Completar checkout
- **Esperado**: Webhook `payment_intent.payment_failed` actualiza registro
- **Verificar**: Estado se actualiza a `payment_status = 'failed'`

### **Caso 17: Reembolso**
**Escenario**: Admin reembolsa un pago
- **Pasos**:
  1. Completar pago exitosamente
  2. Procesar reembolso en Stripe (como admin)
- **Esperado**: Webhook `charge.refunded` actualiza registro
- **Verificar**: Estado se actualiza a `payment_status = 'refunded'`

---

## 4. 🔔 Webhooks

### **Caso 18: Webhook Sin Firma**
**Escenario**: Webhook llega sin firma válida de Stripe
- **Pasos**:
  1. Enviar request POST a `/api/stripe/webhook` sin header `stripe-signature`
- **Esperado**: Error 400 "No signature provided"
- **Verificar**: Verificación de firma funciona

### **Caso 19: Webhook con Firma Inválida**
**Escenario**: Webhook llega con firma incorrecta
- **Pasos**:
  1. Enviar request con firma incorrecta
- **Esperado**: Error 400 "Webhook signature verification failed"
- **Verificar**: Verificación de firma rechaza firmas inválidas

### **Caso 20: Webhook sin Metadata**
**Escenario**: Webhook llega sin metadata requerida
- **Pasos**:
  1. Simular webhook `checkout.session.completed` sin `event_id` o `member_id`
- **Esperado**: Log de error pero retorna 200 (evita reintentos)
- **Verificar**: Manejo de errores no causa reintentos infinitos

### **Caso 21: Webhook Duplicado (Idempotencia)**
**Escenario**: Stripe envía el mismo webhook dos veces
- **Pasos**:
  1. Procesar webhook `payment_intent.succeeded`
  2. Enviar el mismo webhook nuevamente
- **Esperado**: 
  - Si ya procesado: No duplica transacciones
  - Las operaciones son idempotentes
- **Verificar**: No hay registros o transacciones duplicadas

### **Caso 22: payment_intent.succeeded sin checkout.session.completed**
**Escenario**: Stripe envía `payment_intent.succeeded` pero nunca `checkout.session.completed`
- **Pasos**:
  1. Simular solo `payment_intent.succeeded`
- **Esperado**: Webhook busca sesión de checkout y actualiza registro
- **Verificar**: Fallback en webhook funciona

---

## 5. 🎟️ Cupones

### **Caso 23: Cupón Expirado**
**Escenario**: Usuario intenta usar cupón que expiró
- **Pasos**:
  1. Crear cupón con `valid_until = NOW() - 1 day`
  2. Intentar usar el cupón
- **Esperado**: Error "Cupón expirado"
- **Verificar**: Validación de fecha funciona

### **Caso 24: Cupón Alcanzó Límite**
**Escenario**: Usuario intenta usar cupón que alcanzó su límite de uso
- **Pasos**:
  1. Crear cupón con `usage_limit = 1`
  2. Usar el cupón una vez
  3. Intentar usarlo nuevamente
- **Esperado**: Error "Cupón alcanzó su límite de uso"
- **Verificar**: Validación de límite funciona

### **Caso 25: Cupón con Monto Mínimo**
**Escenario**: Usuario intenta usar cupón sin alcanzar monto mínimo
- **Pasos**:
  1. Crear cupón con `min_amount = 100`
  2. Intentar aplicarlo a evento de $50
- **Esperado**: Error "Monto mínimo no alcanzado"
- **Verificar**: Validación de monto mínimo funciona

### **Caso 26: Crear Cupón como Usuario Normal**
**Escenario**: Usuario no-admin intenta crear cupón
- **Pasos**:
  1. Autenticarse como usuario normal
  2. Intentar INSERT en `coupons`
- **Esperado**: Error RLS (403 Forbidden)
- **Verificar**: Solo admins pueden crear cupones

---

## 6. 📤 Storage (Avatares)

### **Caso 27: Archivo Demasiado Grande**
**Escenario**: Usuario intenta subir avatar de más de 5MB
- **Pasos**:
  1. Intentar subir imagen de 10MB
- **Esperado**: Error "Archivo demasiado grande"
- **Verificar**: Validación de tamaño funciona

### **Caso 28: Archivo No Imagen**
**Escenario**: Usuario intenta subir archivo que no es imagen
- **Pasos**:
  1. Intentar subir archivo PDF como avatar
- **Esperado**: Error "Formato no válido"
- **Verificar**: Validación de tipo de archivo funciona

### **Caso 29: Eliminar Avatar de Otro Usuario**
**Escenario**: Usuario intenta eliminar avatar de otro usuario
- **Pasos**:
  1. Autenticarse como usuario A
  2. Intentar eliminar avatar de usuario B
- **Esperado**: Error RLS (403 Forbidden)
- **Verificar**: Política de storage funciona

---

## 7. 👥 Administradores

### **Caso 30: Usuario No-Admin Accede Panel Admin**
**Escenario**: Usuario normal intenta acceder a `/admin`
- **Pasos**:
  1. Autenticarse como usuario normal
  2. Intentar acceder a `/admin/eventos`
- **Esperado**: Error 403 o redirect a login
- **Verificar**: Verificación de permisos funciona

### **Caso 31: Usuario No-Admin Ve Todos los Miembros**
**Escenario**: Usuario normal intenta ver lista de todos los miembros
- **Pasos**:
  1. Autenticarse como usuario normal
  2. Intentar SELECT * FROM members
- **Esperado**: Solo ve su propio perfil
- **Verificar**: Política de admin funciona

### **Caso 32: Admin Elimina Su Propia Cuenta**
**Escenario**: Admin intenta eliminar su propia cuenta
- **Pasos**:
  1. Autenticarse como admin
  2. Intentar eliminar su propia cuenta
- **Esperado**: Prevención de auto-eliminación o confirmación especial
- **Verificar**: Validación de auto-eliminación (si está implementada)

---

## 8. 🔄 Race Conditions

### **Caso 33: Registro Simultáneo al Último Cupo**
**Escenario**: Dos usuarios intentan registrarse al último cupo simultáneamente
- **Pasos**:
  1. Evento con 1 cupo disponible
  2. Dos usuarios hacen click en "REGÍSTRATE" al mismo tiempo
- **Esperado**: Solo uno puede registrarse, el otro recibe error
- **Verificar**: Validación atómica funciona

### **Caso 34: Pago Simultáneo con Mismo Cupón**
**Escenario**: Dos usuarios intentan usar el último uso de cupón simultáneamente
- **Pasos**:
  1. Cupón con `usage_limit = 1`
  2. Dos usuarios aplican cupón al mismo tiempo
- **Esperado**: Solo uno puede usar el cupón
- **Verificar**: Transacciones atómicas funcionan

---

## 9. ⚡ Performance y Límites

### **Caso 35: Muchos Registros Pendientes**
**Escenario**: Sistema con muchos registros pendientes antiguos
- **Pasos**:
  1. Crear 100 registros pendientes de >2 horas
  2. Ejecutar cleanup
- **Esperado**: Cleanup elimina registros antiguos
- **Verificar**: Performance del cleanup es aceptable

### **Caso 36: Usuario con Muchos Registros**
**Escenario**: Usuario registrado a muchos eventos (>100)
- **Pasos**:
  1. Crear usuario con 150 registros
  2. Cargar dashboard
- **Esperado**: Dashboard carga en tiempo razonable (<3 segundos)
- **Verificar**: Paginación o límites funcionan

---

## 10. 📱 Compatibilidad y UX

### **Caso 37: Registro desde Mobile**
**Escenario**: Usuario completa pago desde dispositivo móvil
- **Pasos**:
  1. Abrir sitio en móvil
  2. Registrarse a evento
  3. Completar pago en Stripe
- **Esperado**: Todo funciona correctamente en móvil
- **Verificar**: UI es responsive y funcional

### **Caso 38: Múltiples Pestañas**
**Escenario**: Usuario tiene múltiples pestañas abiertas
- **Pasos**:
  1. Abrir dashboard en dos pestañas
  2. Registrar evento en una pestaña
  3. Verificar que la otra pestaña se actualiza
- **Esperado**: Estados se sincronizan o hay refresh manual
- **Verificar**: UX es clara

---

## ✅ Checklist de Testing

Usa este checklist para asegurar que todos los casos críticos han sido probados:

### **Autenticación** (5 casos)
- [ ] Caso 1: Email duplicado
- [ ] Caso 2: Crear perfil de otro usuario
- [ ] Caso 3: Ver perfil de otro usuario
- [ ] Caso 4: Actualizar perfil de otro usuario
- [ ] Caso 5: Email no confirmado

### **Registro de Eventos** (5 casos)
- [ ] Caso 6: Registro duplicado
- [ ] Caso 7: Evento sin cupos
- [ ] Caso 8: Ver registros de otros
- [ ] Caso 9: Registro pendiente antiguo
- [ ] Caso 10: Evento eliminado

### **Pagos** (7 casos)
- [ ] Caso 11: Pago exitoso pero webhook falla
- [ ] Caso 12: Pago exitoso pero registro no existe
- [ ] Caso 13: Sesión expirada
- [ ] Caso 14: Pago duplicado
- [ ] Caso 15: Precio menor al mínimo
- [ ] Caso 16: Pago fallido
- [ ] Caso 17: Reembolso

### **Webhooks** (5 casos)
- [ ] Caso 18: Webhook sin firma
- [ ] Caso 19: Webhook con firma inválida
- [ ] Caso 20: Webhook sin metadata
- [ ] Caso 21: Webhook duplicado
- [ ] Caso 22: payment_intent sin checkout.session

### **Cupones** (4 casos)
- [ ] Caso 23: Cupón expirado
- [ ] Caso 24: Cupón alcanzó límite
- [ ] Caso 25: Cupón con monto mínimo
- [ ] Caso 26: Crear cupón como usuario

### **Storage** (3 casos)
- [ ] Caso 27: Archivo demasiado grande
- [ ] Caso 28: Archivo no imagen
- [ ] Caso 29: Eliminar avatar de otro

### **Admins** (3 casos)
- [ ] Caso 30: Usuario no-admin en panel
- [ ] Caso 31: Usuario no-admin ve todos miembros
- [ ] Caso 32: Admin elimina propia cuenta

### **Race Conditions** (2 casos)
- [ ] Caso 33: Registro simultáneo último cupo
- [ ] Caso 34: Pago simultáneo mismo cupón

### **Performance** (2 casos)
- [ ] Caso 35: Muchos registros pendientes
- [ ] Caso 36: Usuario con muchos registros

### **UX** (2 casos)
- [ ] Caso 37: Registro desde mobile
- [ ] Caso 38: Múltiples pestañas

---

## 🎯 Priorización

### **🔥 Críticos (Probar Primero)**
- Caso 2, 3, 4: Acceso a datos de otros usuarios
- Caso 11, 12: Pago exitoso sin actualización
- Caso 18, 19: Webhook sin/inválido
- Caso 30: Acceso no autorizado a admin

### **⚠️ Importantes (Probar Después)**
- Caso 6, 7: Registro duplicado y cupos
- Caso 14, 15: Pago duplicado y precio mínimo
- Caso 23, 24, 25: Validación de cupones
- Caso 33, 34: Race conditions

### **📋 Deseables (Probar Finalmente)**
- Caso 35, 36: Performance
- Caso 37, 38: UX y compatibilidad

---

**Última actualización**: 2026-01-07

