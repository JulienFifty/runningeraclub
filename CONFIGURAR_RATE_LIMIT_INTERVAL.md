# ⏱️ Configurar "Minimum Interval Per User" en Supabase

## 🎯 ¿Qué es "Minimum Interval Per User"?

Es el **tiempo mínimo** (en segundos) que debe pasar entre intentos de reenvío de email de confirmación **para el mismo usuario**.

**Ejemplo:**
- Si configuras `60 segundos`
- Un usuario solo puede solicitar un nuevo email cada 60 segundos
- Esto previene spam y abuso

---

## 📍 Dónde Configurarlo

### **PASO 1: Ir a Configuración de Auth**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Scroll hasta **"Rate Limits"** o **"Email Settings"**

3. Busca: **"Minimum interval per user"** o **"Email rate limit interval"**

---

## ✅ Valor Recomendado

### **Para Producción:**
```
Minimum interval per user: 60 segundos
```

**Razones:**
- ✅ Previene spam y abuso
- ✅ Suficiente para que el usuario reciba el email
- ✅ No es demasiado restrictivo
- ✅ Estándar de la industria

### **Para Testing/Desarrollo:**
```
Minimum interval per user: 30 segundos
```

**Razones:**
- ✅ Más rápido para testing
- ⚠️ No recomendado para producción

### **Muy Restrictivo (No Recomendado):**
```
Minimum interval per user: 300 segundos (5 minutos)
```

**Problemas:**
- ❌ Usuarios frustrados si necesitan reenviar
- ❌ Mala experiencia de usuario

---

## 🔧 Cómo Configurarlo

### **Opción 1: En la Interfaz de Supabase**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/settings/auth

2. Busca la sección **"Rate Limits"**

3. Busca el campo: **"Minimum interval per user"** o **"Email rate limit interval"**

4. Ingresa: `60` (segundos)

5. Click **"Save"**

---

### **Opción 2: Si No Aparece en la Interfaz**

Algunas configuraciones avanzadas solo están disponibles vía API o SQL. En ese caso:

#### **A. Verificar en SQL Editor**

1. Ve a: https://supabase.com/dashboard/project/dvuacieikqwuffsfxucc/sql/new

2. Ejecuta esta query para ver la configuración actual:

```sql
SELECT 
  name,
  value,
  description
FROM auth.config
WHERE name LIKE '%email%' OR name LIKE '%rate%' OR name LIKE '%interval%';
```

#### **B. Configurar vía API (si es necesario)**

Si necesitas configurarlo vía API, contacta a Supabase Support o revisa la documentación de su API.

---

## 📊 Configuración Completa Recomendada

### **Para RUNNING ERA CLUB:**

```
Rate limit for sending emails: 30-50 emails/h
Minimum interval per user: 60 segundos
```

**Explicación:**
- **30-50 emails/h**: Suficiente para tu volumen de usuarios
- **60 segundos**: Previene spam pero no es restrictivo

---

## 🔍 Dónde Ver Esta Configuración

### **En Supabase Dashboard:**

1. **Settings → Auth → Rate Limits**
   - Aquí verás todos los rate limits
   - Busca "Minimum interval per user" o "Email rate limit interval"

2. **Settings → Auth → Email Settings**
   - Algunas configuraciones de email pueden estar aquí

3. **Settings → Auth → Templates**
   - No está aquí, pero es bueno saber dónde están los templates

---

## ⚠️ Si No Encuentras Esta Opción

### **Posibles Razones:**

1. **Plan Free Tier**: Algunas opciones avanzadas no están disponibles
2. **UI Actualizada**: La interfaz puede haber cambiado
3. **Configuración Automática**: Puede estar en un valor por defecto

### **Valor por Defecto de Supabase:**

Si no puedes configurarlo, Supabase usa un valor por defecto de:
- **~60 segundos** (típicamente)

---

## 🧪 Cómo Probar

### **Test 1: Verificar Intervalo**

1. Intenta reenviar email de confirmación
2. Inmediatamente intenta reenviar de nuevo
3. Deberías ver un error o mensaje indicando que debes esperar

### **Test 2: Esperar y Reintentar**

1. Intenta reenviar email
2. Espera 60 segundos (o el intervalo configurado)
3. Intenta reenviar de nuevo
4. Debería funcionar

---

## 📋 Checklist

- [ ] Encontré la opción "Minimum interval per user" en Supabase
- [ ] Configuré el valor a 60 segundos (recomendado)
- [ ] Guardé los cambios
- [ ] Probé que funciona (intento inmediato falla, después de 60s funciona)
- [ ] Verifiqué que no afecta negativamente la experiencia del usuario

---

## 🎯 Resumen

**Valor Recomendado: `60 segundos`**

**Dónde:**
- Supabase Dashboard → Settings → Auth → Rate Limits
- Busca "Minimum interval per user" o "Email rate limit interval"

**Por qué 60 segundos:**
- ✅ Balance entre seguridad y UX
- ✅ Previene spam
- ✅ No es demasiado restrictivo
- ✅ Estándar de la industria

---

**¿Encontraste esta opción en tu dashboard de Supabase? Si no, puede que esté en un valor por defecto de 60 segundos.**

