# 📝 GUÍA: Configuración de Strava App

## ✅ Paso 1: Crear App en Strava

1. Ve a: https://www.strava.com/settings/api
2. Click en "Create App"
3. Completa el formulario:

### Campos del formulario:

**Application Name**: 
```
RUNNING ERA Club
```

**Category**: 
```
Training
```

**Club**: 
```
(Dejar vacío o seleccionar tu club si lo tienes)
```

**Website**: 
```
http://localhost:3000
```
(o tu dominio de producción cuando lo tengas)

**Application Description**: 
```
Plataforma de gestión y clasificación para RUNNING ERA Club. Permite a los miembros conectar sus cuentas de Strava y competir en leaderboards.
```

**Authorization Callback Domain** ⬅️ **ESTO ES LO QUE NECESITAS:**
```
localhost:3000
```

**O si ya tienes dominio de producción:**
```
tu-dominio.com
```

**⚠️ IMPORTANTE**: 
- Solo pon el dominio (sin http/https)
- Sin barra al final
- Para desarrollo local: `localhost:3000`
- Para producción: `runningera.mx` (o tu dominio)

---

## ✅ Paso 2: Obtener Credenciales

Después de crear la app, verás:

- **Client ID**: (un número, ej: 123456)
- **Client Secret**: (una cadena, ej: abc123def456...)

Guarda estos valores, los necesitarás para las variables de entorno.

---

## ✅ Paso 3: Configurar Variables de Entorno

Agrega al archivo `.env.local`:

```env
# Strava OAuth
STRAVA_CLIENT_ID=tu_client_id_aqui
STRAVA_CLIENT_SECRET=tu_client_secret_aqui
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback

# Para producción cambiar a:
# STRAVA_REDIRECT_URI=https://tu-dominio.com/api/strava/callback

# Webhook (para después)
STRAVA_WEBHOOK_VERIFY_TOKEN=random_token_seguro_123
STRAVA_WEBHOOK_CLIENT_SECRET=random_secret_seguro_456
```

---

## 🔄 Para Desarrollo vs Producción

### Desarrollo (localhost):
```
Authorization Callback Domain: localhost:3000
STRAVA_REDIRECT_URI: http://localhost:3000/api/strava/callback
```

### Producción:
```
Authorization Callback Domain: runningera.mx
STRAVA_REDIRECT_URI: https://runningera.mx/api/strava/callback
```

**Nota**: Puedes crear 2 apps diferentes en Strava, una para dev y otra para prod, o cambiar la URL cuando despliegues.

---

## ✅ Checklist

- [ ] App creada en Strava
- [ ] Client ID obtenido
- [ ] Client Secret obtenido
- [ ] Callback Domain configurado: `localhost:3000`
- [ ] Variables agregadas a `.env.local`
- [ ] Restart del servidor Next.js (para cargar nuevas vars)

---

**Una vez completado esto, podemos empezar con el código! 🚀**






