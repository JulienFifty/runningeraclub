# 🏃‍♂️ INTEGRACIÓN STRAVA - PLAN COMPLETO

## 🎯 Visión General

Crear un sistema de integración con Strava que permita:
1. **Vinculación de cuenta**: OAuth con Strava
2. **Dashboard Personal**: Ver estadísticas individuales
3. **Leaderboard Público**: Clasificación del club por km/actividades
4. **Sincronización Automática**: Webhook de Strava para actualizar en tiempo real

---

## 📋 FASE 1: PREPARACIÓN Y CONFIGURACIÓN (30 min)

### 1.1 Crear App en Strava
- [ ] Ir a https://www.strava.com/settings/api
- [ ] Crear nueva aplicación
- [ ] Obtener:
  - Client ID
  - Client Secret
  - Configurar Redirect URI: `http://localhost:3000/api/strava/callback`

### 1.2 Variables de Entorno
```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=random_token_123
STRAVA_WEBHOOK_CLIENT_SECRET=random_secret_456
NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

### 1.3 Schema de Base de Datos
Crear tablas:
- `strava_connections` - Vinculaciones de cuentas
- `strava_activities` - Actividades sincronizadas
- `strava_stats` - Estadísticas agregadas (cache)

---

## 📋 FASE 2: BASE DE DATOS (15 min)

### Script SQL a crear: `supabase/strava-schema.sql`

Tablas necesarias:
1. **strava_connections**:
   - member_id (FK a members)
   - strava_athlete_id
   - access_token (encriptado)
   - refresh_token (encriptado)
   - expires_at
   - athlete_data (JSONB)
   - connected_at

2. **strava_activities**:
   - member_id (FK)
   - activity_id (Strava ID)
   - name
   - type (Run, Ride, etc.)
   - distance (meters)
   - moving_time (seconds)
   - elapsed_time
   - total_elevation_gain
   - start_date
   - average_speed
   - max_speed
   - kudos_count
   - raw_data (JSONB)

3. **strava_stats**:
   - member_id (FK)
   - period (week/month/year/alltime)
   - total_distance
   - total_activities
   - total_time
   - total_elevation
   - updated_at

---

## 📋 FASE 3: AUTENTICACIÓN STRAVA (45 min)

### 3.1 Botón de Conexión
**Archivo**: `src/components/StravaConnectButton.tsx`
- Botón "Conectar con Strava" (branded)
- Redirige a OAuth de Strava

### 3.2 API Routes
**Archivos a crear**:
1. `/api/strava/auth` - Inicia OAuth flow
2. `/api/strava/callback` - Maneja callback de Strava
3. `/api/strava/disconnect` - Desconecta cuenta
4. `/api/strava/refresh` - Refresca token

### 3.3 Flujo de OAuth
```
Usuario → Click "Conectar Strava" 
       → Redirige a Strava OAuth 
       → Strava autoriza 
       → Callback con código 
       → Exchange código por tokens 
       → Guardar en DB 
       → Redirigir a dashboard
```

---

## 📋 FASE 4: SINCRONIZACIÓN DE ACTIVIDADES (1 hora)

### 4.1 Sincronización Inicial
**Archivo**: `/api/strava/sync`
- Obtener últimas 30 actividades
- Guardar en `strava_activities`
- Calcular stats

### 4.2 Webhook de Strava (Real-time)
**Archivo**: `/api/strava/webhook`
- Endpoint para subscripción
- Recibir eventos de nuevas actividades
- Actualizar automáticamente

### 4.3 Sincronización Manual
- Botón "Sincronizar ahora" en dashboard
- Loading state
- Feedback al usuario

---

## 📋 FASE 5: DASHBOARD PERSONAL (1.5 horas)

### 5.1 Componente de Stats
**Archivo**: `src/components/strava/PersonalStats.tsx`

Mostrar:
- **Card de Conexión**: Estado de Strava
- **Stats del Mes**:
  - Total km
  - Total actividades
  - Tiempo total
  - Elevación ganada
  - Promedio por actividad
- **Gráfica**: Km por semana (Chart.js o Recharts)
- **Actividades Recientes**: Lista de últimas 10

### 5.2 Diseño Premium
- Cards minimalistas
- Iconos de Strava
- Colores brand de Strava (#FC4C02)
- Animaciones suaves
- Responsive

---

## 📋 FASE 6: LEADERBOARD PÚBLICO (2 horas)

### 6.1 Página de Clasificación
**Archivo**: `app/leaderboard/page.tsx`

Features:
- **Filtros**:
  - Este mes / Este año / Todo el tiempo
  - Solo correr / Todas las actividades
  - Por club members verificados
  
- **Vista de Tabla**:
  - Posición
  - Avatar + Nombre
  - Total km
  - Total actividades
  - Promedio km/actividad
  - Badge de Strava verificado

- **Vista de Podio**:
  - Top 3 destacados
  - Animaciones
  - Medallas/trofeos

### 6.2 Componente de Tabla
**Archivo**: `src/components/strava/Leaderboard.tsx`
- Tabla sorteable
- Paginación
- Highlighting usuario actual
- Link a perfil de miembro

### 6.3 API para Leaderboard
**Archivo**: `/api/strava/leaderboard`
- Query optimizado
- Cache (revalidar cada hora)
- Filtros por período

---

## 📋 FASE 7: FEATURES PREMIUM (1 hora)

### 7.1 Badges y Logros
- Primer 100km del mes
- Más consistente (7 días seguidos)
- Rey/Reina de la montaña (más elevación)
- Velocista (mejor pace promedio)

### 7.2 Comparación de Stats
- Ver perfil de otro miembro
- Comparar stats side-by-side

### 7.3 Feed de Actividades
- Feed social de últimas actividades del club
- Kudos internos
- Comentarios

---

## 🎨 DISEÑO UI/UX

### Paleta de Colores
- **Strava Orange**: `#FC4C02`
- **Fondo**: Mismo que sitio principal
- **Cards**: Minimalistas con bordes sutiles
- **Hover Effects**: Transiciones suaves

### Tipografía
- Títulos: `font-display font-light`
- Stats grandes: `font-title`
- Textos: `font-body`

### Iconos
- Strava logo oficial
- Lucide icons para acciones
- Flags/badges personalizados

---

## 📊 STACK TÉCNICO

### Frontend
- React/Next.js 14
- TailwindCSS
- Recharts o Chart.js (gráficas)
- Framer Motion (animaciones)
- SWR (cache y revalidación)

### Backend
- Next.js API Routes
- Supabase (PostgreSQL)
- Strava API v3
- Webhooks

### Seguridad
- Tokens encriptados
- Rate limiting
- CORS configurado
- Validación de webhooks

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### Día 1: Base
1. ✅ Schema de BD
2. ✅ Variables de entorno
3. ✅ OAuth flow básico
4. ✅ Botón conectar Strava

### Día 2: Datos
5. ✅ Sincronización inicial
6. ✅ API endpoints
7. ✅ Dashboard personal básico

### Día 3: Leaderboard
8. ✅ Página de clasificación
9. ✅ Tabla con filtros
10. ✅ Diseño premium

### Día 4: Polish
11. ✅ Webhooks
12. ✅ Badges y logros
13. ✅ Testing y refinamiento

---

## 📝 CHECKLIST PRE-INICIO

Antes de empezar a codear:
- [ ] App creada en Strava
- [ ] Client ID y Secret obtenidos
- [ ] Variables en `.env.local`
- [ ] Leer documentación de Strava API
- [ ] Decidir librería de gráficas
- [ ] Mockups del diseño (opcional)

---

## 🎯 RESULTADO FINAL

Al terminar tendremos:
1. ✅ Miembros conectan su Strava en 2 clicks
2. ✅ Dashboard personal con stats hermosas
3. ✅ Leaderboard público del club
4. ✅ Sincronización automática
5. ✅ Sistema de badges
6. ✅ Diseño premium y moderno
7. ✅ Todo responsive y rápido

---

## 💡 FEATURES FUTURAS (v2)

- Crear retos/challenges del club
- Comparar con stats de meses anteriores
- Integración con eventos (km durante el evento)
- Exportar stats a PDF
- Notificaciones push de nuevos logros
- Integración con otras apps (Garmin, Apple Health)

---

**Tiempo estimado total: 6-8 horas**  
**Complejidad: Media-Alta**  
**Impacto en usuarios: 🔥 ALTO**

¿Listo para empezar? 🚀



