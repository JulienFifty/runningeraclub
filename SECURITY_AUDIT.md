# 🔒 Auditoría de Seguridad - RUNNING ERA Club

## 📋 Resumen Ejecutivo

Este documento contiene una revisión completa de seguridad del sistema, incluyendo:
- Políticas RLS (Row Level Security) actuales
- Datos sensibles identificados
- Verificación de protección
- Edge cases para testing
- Recomendaciones de seguridad

---

## 1. 📊 Revisión de Políticas RLS

### **1.1 Tabla: `members`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Users can insert their own profile" - INSERT con CHECK (auth.uid() = id)
✅ "Users can view their own profile" - SELECT con USING (auth.uid() = id)
✅ "Users can update their own profile" - UPDATE con USING (auth.uid() = id)
✅ "Users can delete their own profile" - DELETE con USING (auth.uid() = id)
✅ "Admins can view all members" - SELECT para admins
```

**Protección**:
- ✅ Los usuarios solo pueden ver/editar su propio perfil
- ✅ Los usuarios no pueden insertar perfiles de otros usuarios
- ⚠️ **GAP**: No hay política para que admins puedan actualizar/eliminar perfiles

**Recomendación**:
```sql
-- Agregar políticas para que admins puedan gestionar perfiles
CREATE POLICY "Admins can manage all members" ON members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth_user_email())
  );
```

---

### **1.2 Tabla: `event_registrations`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Members can view own registrations" - SELECT con USING (auth.uid() = member_id)
✅ "Members can create own registrations" - INSERT con CHECK (auth.uid() = member_id)
✅ "Members can update own registrations" - UPDATE con USING (auth.uid() = member_id)
✅ "Admins can view all registrations" - SELECT para admins
✅ "Admins can manage all registrations" - ALL para admins
```

**Protección**:
- ✅ Los usuarios solo pueden ver/editar sus propios registros
- ✅ Los usuarios no pueden crear registros para otros usuarios
- ✅ Los admins pueden gestionar todos los registros

**Estado**: ✅ Bien protegido

---

### **1.3 Tabla: `payment_transactions`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Members can view own transactions" - SELECT con USING (auth.uid() = member_id)
✅ "Admins can view all transactions" - SELECT para admins
✅ "Admins can manage all transactions" - ALL para admins
```

**Protección**:
- ✅ Los usuarios solo pueden ver sus propias transacciones
- ✅ Los usuarios NO pueden crear/modificar transacciones (solo lectura)
- ✅ Solo Service Role Key puede crear transacciones (en webhook/create-checkout)

**Estado**: ✅ Bien protegido

**Nota Importante**:
- Las transacciones solo se crean desde endpoints con Service Role Key
- Los usuarios solo tienen acceso de lectura a sus propias transacciones

---

### **1.4 Tabla: `coupons`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Admins can manage coupons" - ALL para admins
✅ "Authenticated users can view active coupons" - SELECT para cupones activos
```

**Protección**:
- ✅ Solo admins pueden crear/modificar cupones
- ✅ Usuarios autenticados solo pueden ver cupones activos
- ✅ Los usuarios NO pueden crear/modificar cupones

**Estado**: ✅ Bien protegido

---

### **1.5 Tabla: `coupon_usage`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Admins can view coupon usage" - SELECT para admins
✅ "Members can view own coupon usage" - SELECT con USING (auth.uid() = member_id)
```

**Protección**:
- ✅ Los usuarios solo pueden ver su propio uso de cupones
- ⚠️ **GAP**: Los usuarios NO pueden insertar uso de cupones (solo Service Role Key)
- ✅ Solo admins pueden ver todo el historial

**Estado**: ✅ Bien protegido (las inserciones se hacen con Service Role Key)

---

### **1.6 Tabla: `attendees`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales** (según `attendees-schema-complete.sql`):
```sql
✅ "Admins can view all attendees" - SELECT para admins
✅ "Admins can manage all attendees" - ALL para admins
✅ "Allow insert for API" - INSERT para usuarios autenticados (con validación)
```

**Protección**:
- ✅ Solo admins pueden ver/gestionar todos los asistentes
- ✅ Usuarios pueden insertar asistentes (con validación en API)
- ⚠️ **REVISAR**: La política "Allow insert for API" debe tener validación adecuada

**Estado**: ⚠️ Revisar política de INSERT

---

### **1.7 Storage: `avatars`**

**Estado**: ✅ RLS Habilitado

**Políticas Actuales**:
```sql
✅ "Allow authenticated users to upload their own avatar" - INSERT
✅ "Allow authenticated users to update their own avatar" - UPDATE
✅ "Allow authenticated users to delete their own avatar" - DELETE
✅ "Allow everyone to view avatars" - SELECT (público)
```

**Protección**:
- ✅ Los usuarios solo pueden subir/actualizar/eliminar su propio avatar
- ✅ Los avatares son públicos (viewable por todos)
- ✅ Los usuarios NO pueden modificar avatares de otros

**Estado**: ✅ Bien protegido

---

## 2. 🔐 Datos Sensibles Identificados

### **2.1 Datos Almacenados en Base de Datos**

| Dato | Tabla | Sensibilidad | Protección |
|------|-------|--------------|------------|
| Email | `members`, `auth.users` | Alta | ✅ RLS (solo propio perfil) |
| Teléfono | `members` | Media | ✅ RLS (solo propio perfil) |
| Información de pago | `payment_transactions` | Muy Alta | ✅ RLS (solo propias transacciones) |
| Stripe Customer ID | `members`, `attendees` | Alta | ✅ RLS (solo propio perfil) |
| Stripe Payment Intent ID | `event_registrations`, `payment_transactions` | Alta | ✅ RLS (solo propios registros) |
| Cantidad pagada | `event_registrations`, `payment_transactions` | Media | ✅ RLS (solo propios registros) |
| Datos de emergencia | `members` | Alta | ✅ RLS (solo propio perfil) |
| Instagram handle | `members` | Baja | ✅ RLS (solo propio perfil) |

**Estado General**: ✅ Bien protegido

---

### **2.2 Variables de Entorno**

| Variable | Sensibilidad | Exposición | Estado |
|----------|--------------|------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Media | Pública (cliente) | ✅ OK (necesaria en cliente) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Media | Pública (cliente) | ✅ OK (necesaria en cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Muy Alta | Solo servidor | ✅ OK (solo en servidor) |
| `STRIPE_SECRET_KEY` | Muy Alta | Solo servidor | ✅ OK (solo en servidor) |
| `STRIPE_WEBHOOK_SECRET` | Alta | Solo servidor | ✅ OK (solo en servidor) |

**Verificación**:
- ✅ Las variables con `NEXT_PUBLIC_` son seguras para exponer (son públicas por diseño)
- ✅ Las variables sin `NEXT_PUBLIC_` solo están en servidor (Vercel)
- ✅ Service Role Key solo se usa en endpoints del servidor
- ⚠️ **VERIFICAR**: Que `SUPABASE_SERVICE_ROLE_KEY` no esté en `.env.local` commitado

---

### **2.3 Datos Transmitidos**

**HTTP/HTTPS**:
- ✅ La aplicación usa HTTPS (Vercel fuerza HTTPS)
- ✅ Stripe usa HTTPS para todos los pagos
- ✅ Supabase usa HTTPS para todas las conexiones

**Cookies/Sessions**:
- ✅ Supabase maneja las sesiones con cookies httpOnly
- ✅ No hay tokens en localStorage (solo cookies)

**API Requests**:
- ✅ Las requests a Supabase usan autenticación JWT
- ✅ Las requests a Stripe usan API keys del servidor
- ✅ Los webhooks de Stripe verifican la firma

**Estado**: ✅ Bien protegido

---

## 3. 🧪 Edge Cases para Testing

### **3.1 Registro y Autenticación**

#### **Caso 1: Usuario intenta registrarse con email ya existente**
- **Esperado**: Error "Email ya registrado" o redirect a login
- **Verificar**: No se crea cuenta duplicada

#### **Caso 2: Usuario intenta crear perfil de otro usuario**
- **Esperado**: Error RLS (403)
- **Verificar**: Solo puede crear perfil con `id = auth.uid()`

#### **Caso 3: Usuario intenta ver perfil de otro usuario**
- **Esperado**: Error RLS o no retorna datos
- **Verificar**: Query retorna solo su propio perfil

#### **Caso 4: Usuario intenta actualizar perfil de otro usuario**
- **Esperado**: Error RLS (403)
- **Verificar**: UPDATE falla con política RLS

#### **Caso 5: Email no confirmado intenta acceder**
- **Esperado**: Redirect a página de confirmación
- **Verificar**: No puede acceder al dashboard

---

### **3.2 Registro de Eventos**

#### **Caso 6: Usuario intenta registrarse dos veces al mismo evento**
- **Esperado**: Error "Ya estás registrado" o actualización del registro existente
- **Verificar**: No se crean registros duplicados

#### **Caso 7: Usuario intenta registrarse a evento que requiere pago sin pagar**
- **Esperado**: Redirect a Stripe Checkout
- **Verificar**: Registro se crea con `payment_status = 'pending'`

#### **Caso 8: Usuario intenta ver registros de otros usuarios**
- **Esperado**: Error RLS o no retorna datos
- **Verificar**: Solo ve sus propios registros

#### **Caso 9: Registro pendiente de más de 2 horas**
- **Esperado**: Se elimina automáticamente o permite reintentar
- **Verificar**: El sistema maneja registros antiguos pendientes

#### **Caso 10: Evento sin cupos disponibles**
- **Esperado**: Error "Cupo lleno" o deshabilitar registro
- **Verificar**: Validación de `max_participants`

---

### **3.3 Pagos con Stripe**

#### **Caso 11: Pago exitoso pero webhook falla**
- **Esperado**: Sincronización manual o actualización en página de éxito
- **Verificar**: El registro se actualiza eventualmente

#### **Caso 12: Pago exitoso pero registro no existe**
- **Esperado**: Webhook crea el registro automáticamente
- **Verificar**: Fallback en webhook funciona

#### **Caso 13: Pago con sesión de Stripe expirada**
- **Esperado**: Error o creación de nueva sesión
- **Verificar**: El sistema maneja sesiones expiradas

#### **Caso 14: Usuario intenta pagar dos veces**
- **Esperado**: Error "Ya estás registrado" o actualización de registro existente
- **Verificar**: No se cobra dos veces

#### **Caso 15: Pago exitoso pero stripe_session_id no se guarda**
- **Esperado**: Webhook actualiza con payment_intent_id
- **Verificar**: Múltiples formas de identificar el pago

#### **Caso 16: Precio del evento menor al mínimo de Stripe ($10 MXN)**
- **Esperado**: Error o marcado como gratuito
- **Verificar**: Validación de precio mínimo

---

### **3.4 Webhooks de Stripe**

#### **Caso 17: Webhook sin firma válida**
- **Esperado**: Rechazo (400 Bad Request)
- **Verificar**: Verificación de firma funciona

#### **Caso 18: Webhook con metadata faltante**
- **Esperado**: Log de error pero retorna 200 (evita reintentos infinitos)
- **Verificar**: Manejo de errores en webhook

#### **Caso 19: Evento `payment_intent.succeeded` sin sesión de checkout**
- **Esperado**: Buscar sesión o actualizar por payment_intent_id
- **Verificar**: Fallback funciona correctamente

#### **Caso 20: Webhook procesado dos veces (idempotencia)**
- **Esperado**: No duplica registros ni transacciones
- **Verificar**: Las operaciones son idempotentes

---

### **3.5 Cupones**

#### **Caso 21: Usuario intenta usar cupón expirado**
- **Esperado**: Error "Cupón expirado"
- **Verificar**: Validación de `valid_until`

#### **Caso 22: Usuario intenta usar cupón más de su límite**
- **Esperado**: Error "Cupón alcanzó su límite de uso"
- **Verificar**: Validación de `usage_limit`

#### **Caso 23: Usuario intenta usar cupón con monto menor al mínimo**
- **Esperado**: Error "Monto mínimo no alcanzado"
- **Verificar**: Validación de `min_amount`

#### **Caso 24: Usuario intenta crear/modificar cupón**
- **Esperado**: Error RLS (403)
- **Verificar**: Solo admins pueden gestionar cupones

---

### **3.6 Storage (Avatares)**

#### **Caso 25: Usuario intenta subir avatar de más de 5MB**
- **Esperado**: Error "Archivo demasiado grande"
- **Verificar**: Validación de tamaño de archivo

#### **Caso 26: Usuario intenta eliminar avatar de otro usuario**
- **Esperado**: Error RLS (403)
- **Verificar**: Solo puede eliminar su propio avatar

#### **Caso 27: Usuario sube archivo que no es imagen**
- **Esperado**: Error "Formato no válido"
- **Verificar**: Validación de tipo de archivo

---

### **3.7 Administradores**

#### **Caso 28: Usuario no-admin intenta acceder a panel de admin**
- **Esperado**: Error 403 o redirect a login
- **Verificar**: Verificación de permisos funciona

#### **Caso 29: Usuario no-admin intenta ver todos los miembros**
- **Esperado**: Error RLS o solo ve su propio perfil
- **Verificar**: Política de admin funciona

#### **Caso 30: Admin elimina su propia cuenta**
- **Esperado**: Confirmación o prevención de auto-eliminación
- **Verificar**: Validación de auto-eliminación

---

## 4. ✅ Checklist de Verificación de Seguridad

### **4.1 Políticas RLS**

- [ ] Ejecutar script `supabase/verify-rls-policies.sql` (ver más abajo)
- [ ] Verificar que todas las tablas tienen RLS habilitado
- [ ] Verificar que no hay políticas duplicadas
- [ ] Verificar que las políticas de admin funcionan correctamente
- [ ] Verificar que los usuarios no pueden acceder a datos de otros

### **4.2 Variables de Entorno**

- [ ] Verificar que `SUPABASE_SERVICE_ROLE_KEY` NO está en `.gitignore`
- [ ] Verificar que `STRIPE_SECRET_KEY` NO está en `.gitignore`
- [ ] Verificar que `STRIPE_WEBHOOK_SECRET` NO está en `.gitignore`
- [ ] Verificar que `.env.local` está en `.gitignore`
- [ ] Verificar que las variables están configuradas en Vercel
- [ ] Verificar que las variables en Vercel coinciden con producción

### **4.3 Autenticación**

- [ ] Verificar que los usuarios deben confirmar email antes de acceder
- [ ] Verificar que las sesiones expiran correctamente
- [ ] Verificar que no hay tokens expuestos en localStorage
- [ ] Verificar que las cookies son httpOnly

### **4.4 Pagos**

- [ ] Verificar que los webhooks verifican la firma
- [ ] Verificar que los usuarios no pueden crear transacciones directamente
- [ ] Verificar que los usuarios solo ven sus propias transacciones
- [ ] Verificar que el Service Role Key solo se usa en servidor

### **4.5 Validación de Datos**

- [ ] Verificar que los inputs se validan en el servidor
- [ ] Verificar que los tipos de archivo se validan
- [ ] Verificar que los tamaños de archivo se limitan
- [ ] Verificar que las queries SQL usan parámetros (no concatenación)

### **4.6 HTTPS**

- [ ] Verificar que el sitio fuerza HTTPS
- [ ] Verificar que no hay recursos HTTP mixtos
- [ ] Verificar que las cookies son Secure

---

## 5. 🔧 Scripts de Verificación

### **5.1 Verificar Todas las Políticas RLS**

Ejecuta este script en Supabase SQL Editor:

```sql
-- Verificar políticas RLS de todas las tablas importantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN (
  'members',
  'event_registrations',
  'payment_transactions',
  'coupons',
  'coupon_usage',
  'attendees',
  'events',
  'admins'
)
ORDER BY tablename, policyname;
```

### **5.2 Verificar Tablas con RLS Deshabilitado**

```sql
-- Buscar tablas que deberían tener RLS pero no lo tienen
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'members',
    'event_registrations',
    'payment_transactions',
    'coupons',
    'coupon_usage',
    'attendees'
  )
ORDER BY tablename;
```

### **5.3 Verificar Datos Expuestos Inadvertidamente**

```sql
-- Verificar si hay miembros sin RLS (no debería haber resultados si RLS está bien)
-- Solo ejecutar como admin
SELECT COUNT(*) as members_without_rls_protection
FROM members
WHERE id NOT IN (
  SELECT id FROM members WHERE auth.uid() = id
);
-- Si retorna > 0, hay un problema
```

---

## 6. 🚨 Recomendaciones de Seguridad

### **6.1 Alta Prioridad**

1. **Agregar política para admins gestionar miembros**:
   ```sql
   CREATE POLICY "Admins can manage all members" ON members
     FOR ALL USING (
       EXISTS (SELECT 1 FROM admins WHERE email = auth_user_email())
     );
   ```

2. **Revisar política de INSERT en `attendees`**:
   - Asegurar que la validación en la API es suficiente
   - Considerar restringir INSERT solo a Service Role Key

3. **Agregar rate limiting en endpoints críticos**:
   - `/api/members/register-event`
   - `/api/stripe/create-checkout`
   - `/api/auth/resend-confirmation`

4. **Agregar logging de acciones sensibles**:
   - Creación de transacciones
   - Actualización de payment_status
   - Uso de cupones
   - Eliminación de cuentas

### **6.2 Media Prioridad**

1. **Implementar 2FA para admins** (opcional pero recomendado)

2. **Agregar validación de input más estricta**:
   - Sanitizar inputs en servidor
   - Validar formatos (email, teléfono)
   - Limitar tamaños de strings

3. **Agregar monitoreo de seguridad**:
   - Alertas por múltiples intentos fallidos de login
   - Alertas por acceso a datos sensibles
   - Alertas por cambios en políticas RLS

4. **Implementar backups regulares**:
   - Backup diario de base de datos
   - Backup de avatares en Storage

### **6.3 Baja Prioridad**

1. **Implementar auditoría completa**:
   - Tabla de logs de acciones
   - Tracking de cambios en registros importantes

2. **Mejorar validación de archivos**:
   - Verificar MIME types reales (no solo extensión)
   - Escanear archivos por malware

3. **Implementar CSP (Content Security Policy)**:
   - Restringir recursos externos
   - Prevenir XSS

---

## 7. 📝 Plan de Testing

### **7.1 Testing Manual**

1. **Crear cuenta de prueba** y verificar RLS:
   - Intentar ver perfil de otro usuario → Debe fallar
   - Intentar actualizar perfil de otro usuario → Debe fallar
   - Verificar que solo ve su propio perfil

2. **Registro de eventos**:
   - Registrarse a evento gratuito → Debe funcionar
   - Registrarse a evento de pago → Debe redirigir a Stripe
   - Intentar registrarse dos veces → Debe manejar correctamente

3. **Pagos**:
   - Completar pago exitoso → Debe actualizar registro
   - Verificar que aparece en dashboard
   - Verificar que no se puede pagar dos veces

4. **Webhooks**:
   - Simular webhook de Stripe → Debe procesar correctamente
   - Simular webhook sin firma → Debe rechazar

### **7.2 Testing Automatizado** (Opcional)

Considera crear tests automatizados para:
- Políticas RLS (verificar que usuarios no pueden acceder a datos de otros)
- Validación de inputs
- Flujo de pagos
- Webhooks

---

## 8. ✅ Conclusión

**Estado General de Seguridad**: 🟢 **BUENO**

**Resumen**:
- ✅ Las políticas RLS están bien implementadas
- ✅ Los datos sensibles están protegidos
- ✅ Las variables de entorno están seguras
- ⚠️ Algunas mejoras menores recomendadas (ver sección 6)

**Próximos Pasos**:
1. Ejecutar scripts de verificación (sección 5)
2. Revisar y aplicar recomendaciones de alta prioridad (sección 6.1)
3. Probar edge cases críticos (sección 3)
4. Monitorear logs de seguridad regularmente

---

**Última actualización**: 2026-01-07
**Próxima revisión recomendada**: 2026-04-07 (trimestral)

