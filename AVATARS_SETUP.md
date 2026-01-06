# Configuración de Fotos de Perfil (Avatares)

## Funcionalidad
Los miembros ahora pueden subir sus propias fotos de perfil desde la página de "Mi Perfil".

## Configuración en Supabase

### 1. Ejecutar el Script SQL

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script: `supabase/avatars-storage-setup.sql`

Este script:
- Crea el bucket `avatars` como público
- Configura las políticas RLS para permitir:
  - Los usuarios pueden subir sus propias fotos
  - Los usuarios pueden actualizar sus propias fotos
  - Los usuarios pueden eliminar sus propias fotos
  - Todos pueden ver las fotos de perfil (público)

### 2. Verificar en Storage

1. Ve a **Storage** en Supabase
2. Deberías ver el bucket `avatars`
3. Verifica que el bucket esté marcado como **Público**

## Características

✅ **Subida de Imágenes**: Los usuarios pueden subir JPG, PNG o GIF
✅ **Límite de Tamaño**: Máximo 5MB por imagen
✅ **Preview en Tiempo Real**: Los usuarios ven un preview antes de guardar
✅ **Fallback a Iniciales**: Si no hay foto, se muestran las iniciales del nombre
✅ **Optimización**: Las imágenes se suben con cache control de 1 hora
✅ **Seguridad**: Solo los usuarios pueden modificar sus propias fotos

## Cómo Usar

1. El usuario inicia sesión
2. Va a "Mi Perfil" desde el dashboard
3. En la sección "Foto de Perfil" hace clic en "Cambiar Foto"
4. Selecciona una imagen de su dispositivo
5. La imagen se sube automáticamente
6. La foto aparece en el dashboard y perfil

## Estructura de Almacenamiento

Las fotos se almacenan en:
```
avatars/
  └── profile-images/
      └── {user_id}-{timestamp}.{ext}
```

Ejemplo: `profile-images/123e4567-e89b-12d3-a456-426614174000-1704567890123.jpg`

## Notas Técnicas

- **Storage Bucket**: `avatars`
- **Path Pattern**: `profile-images/{user_id}-{timestamp}.{ext}`
- **Cache Control**: 3600 segundos (1 hora)
- **Upsert**: Activado (permite sobrescribir)
- **Validaciones**:
  - Tipo de archivo: Solo imágenes
  - Tamaño máximo: 5MB
  - Formato: JPG, PNG, GIF

## Troubleshooting

### Error: "Bucket does not exist"
Ejecuta el script SQL `supabase/avatars-storage-setup.sql`

### Error: "Policy not found"
Verifica que las políticas RLS se hayan creado correctamente en Storage > Policies

### Las imágenes no se muestran
Verifica que el bucket `avatars` esté marcado como **Público**


