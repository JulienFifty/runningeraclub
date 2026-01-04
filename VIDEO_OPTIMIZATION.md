# Optimización del Video del Hero

## ✅ Solución Implementada: CDN (Cloudinary)

**Recomendación: Usar CDN es MEJOR que comprimir localmente** porque:
- ✅ Compresión automática y optimización
- ✅ Servidores globales (carga más rápida)
- ✅ Múltiples formatos automáticos (WebM, MP4)
- ✅ Caché inteligente
- ✅ No carga tu servidor

## Optimizaciones Implementadas en el Código

1. ✅ **CDN Cloudinary**: Video servido desde Cloudinary con optimización automática
2. ✅ **Múltiples formatos**: WebM (mejor compresión) + MP4 (compatibilidad)
3. ✅ **Poster image**: Muestra la imagen mientras carga el video
4. ✅ **Preload metadata**: Carga solo metadata inicialmente
5. ✅ **Fallback**: Si el video falla, muestra la imagen estática

## 📤 Cómo Subir el Video a Cloudinary

### Opción 1: Dashboard Web (Más Fácil)
1. Ve a [Cloudinary Dashboard](https://cloudinary.com/console)
2. Ve a "Media Library"
3. Sube tu video `hero-video.mp4`
4. Copia la URL generada
5. Actualiza la URL en `Hero.tsx`

### Opción 2: CLI de Cloudinary
```bash
npm install -g cloudinary-cli
cloudinary uploader upload public/assets/hero-video.mp4 --folder v1
```

### Opción 3: API
```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/dhqq37qlu/video/upload \
  -F "file=@public/assets/hero-video.mp4" \
  -F "folder=v1" \
  -F "public_id=hero-video"
```

## 🎯 Parámetros de Optimización en Cloudinary

La URL usa estos parámetros automáticos:
- `f_auto`: Formato automático según navegador
- `q_auto:low`: Calidad optimizada para web
- `w_1920`: Ancho máximo 1920px (ajustable)

### Si quieres comprimir ANTES de subir (Opcional)

El archivo de video puede ser optimizado antes de subir. Usa estos comandos con **FFmpeg**:

### Opción 1: Compresión Alta (Recomendado para web)
```bash
ffmpeg -i public/assets/hero-video.mp4 -vcodec libx264 -crf 28 -preset fast -vf "scale=1920:1080" -an public/assets/hero-video-optimized.mp4
```

### Opción 2: Compresión Media (Mejor calidad)
```bash
ffmpeg -i public/assets/hero-video.mp4 -vcodec libx264 -crf 23 -preset medium -vf "scale=1920:1080" -an public/assets/hero-video-optimized.mp4
```

### Opción 3: WebM (Mejor para web moderna)
```bash
ffmpeg -i public/assets/hero-video.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -vf "scale=1920:1080" -an public/assets/hero-video-optimized.webm
```

## Parámetros Explicados

- `-crf 28/23`: Calidad (menor número = mejor calidad, mayor tamaño)
- `-preset fast/medium`: Velocidad de encoding
- `-vf "scale=1920:1080"`: Resolución reducida (ajustar según necesidad)
- `-an`: Elimina el audio (no necesario para video de fondo)

## Recomendaciones Adicionales

### 1. Usa un CDN
Sube el video a Cloudinary u otro CDN:

```typescript
const heroVideo = 'https://res.cloudinary.com/tu-cloud/video/upload/v1/hero-video.mp4';
```

### 2. Formatos Múltiples
```html
<video>
  <source src="/assets/hero-video.webm" type="video/webm">
  <source src="/assets/hero-video.mp4" type="video/mp4">
</video>
```

### 3. Lazy Loading
```typescript
preload="metadata" // En lugar de "auto"
```

### 4. Duración Corta
El video debe durar entre 10-15 segundos máximo para loop.

## Tamaño Objetivo

- **Ideal**: < 2MB
- **Aceptable**: < 5MB
- **Máximo**: < 10MB

## Verificar Tamaño Actual

```bash
ls -lh public/assets/hero-video.mp4
```

## Después de Optimizar

1. Reemplaza el archivo en `public/assets/`
2. Si usas WebM, actualiza la ruta en `Hero.tsx`
3. Limpia caché del navegador
4. Prueba la carga en modo incógnito

