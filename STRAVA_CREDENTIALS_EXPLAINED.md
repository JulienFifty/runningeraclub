# 🔐 STRAVA - Credenciales y Secrets Explicados

## 📋 Lo que Ves en la Página de Strava:

En la página actual de Strava ves 3 cosas:

### 1. **Client Secret** (Secret du client) ✅
- **Este SÍ lo necesitas**
- Es el secreto de tu aplicación
- Click en "Afficher" para verlo
- **Guárdalo bien**, lo usarás en `.env.local` como:
  ```
  STRAVA_CLIENT_SECRET=el_secreto_que_ves_aqui
  ```

### 2. **Access Token** (Votre jeton d'accès) ❌
- Este es un token personal de PRUEBA
- Solo sirve para hacer requests manuales en la API
- **NO lo necesitas para nuestra integración**
- Lo ignoramos

### 3. **Refresh Token** (Votre jeton d'actualisation) ❌
- También es personal de prueba
- **NO lo necesitas**
- Lo ignoramos

---

## 🔍 ¿Dónde está el Client ID?

El **Client ID** debería estar visible en la parte superior de la página de tu app, o en la lista de aplicaciones. Es un número (ej: `123456`).

Si no lo ves, busca en:
- La lista de "My API Application"
- El título/nombre de tu app (a veces está ahí)
- O en la URL de la página de configuración

---

## 🤔 ¿Y el STRAVA_WEBHOOK_CLIENT_SECRET?

**Este NO existe todavía** porque:

1. Los webhooks de Strava usan un **"verify token"** 
2. Este token lo **TÚ GENERAS** (no Strava)
3. Se configura DESPUÉS, cuando creamos el endpoint de webhook
4. Es solo para validar que los requests vienen de Strava

Por ahora, para empezar, solo necesitas:

```env
STRAVA_CLIENT_ID=el_client_id_que_ves
STRAVA_CLIENT_SECRET=el_client_secret_que_ves_al_hacer_click_en_afficher
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

El `STRAVA_WEBHOOK_CLIENT_SECRET` lo configuraremos más adelante cuando hagamos los webhooks (Fase 4 del plan).

---

## ✅ Lo que Necesitas AHORA:

1. **Client ID**: Número visible en la página de tu app
2. **Client Secret**: 
   - Click en "Afficher" (Show) 
   - Copia el valor que aparece
   - Guárdalo en un lugar seguro

---

## 🚀 Próximos Pasos:

1. Obtén el **Client ID** y **Client Secret**
2. Agrégalos a `.env.local`
3. Empezamos con el código

¿Ya tienes el Client ID y el Client Secret? Si sí, podemos continuar! 🎯

