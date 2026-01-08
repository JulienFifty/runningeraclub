/**
 * Helper functions para optimizar URLs de imágenes
 */

/**
 * Optimiza una URL de Cloudinary agregando parámetros de transformación
 * @param url - URL original de Cloudinary
 * @param width - Ancho deseado (opcional)
 * @param height - Alto deseado (opcional)
 * @param quality - Calidad (1-100, default: 80)
 * @param format - Formato (auto, webp, avif, jpg, png)
 * @returns URL optimizada
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  } = {}
): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop = 'fill',
  } = options;

  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{version}/{public_id}.{format}
    // Example: https://res.cloudinary.com/dhqq37qlu/image/upload/v1767661557/_VXV9636_fogsaj.jpg
    
    if (url.includes('/upload/')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const [base, rest] = parts;
        
        // Verificar si ya tiene transformaciones (empieza con w_, h_, c_, etc.)
        const hasTransforms = /^[a-z_0-9,]+/.test(rest);
        
        if (hasTransforms) {
          // Ya tiene transformaciones, no agregar más
          return url;
        }
        
        // Construir parámetros de transformación
        const transforms: string[] = [];
        
        if (width || height) {
          if (width) transforms.push(`w_${width}`);
          if (height) transforms.push(`h_${height}`);
          transforms.push(`c_${crop}`);
        }
        
        transforms.push(`q_${quality}`);
        transforms.push(`f_${format}`);
        
        const transformString = transforms.join(',');
        return `${base}/upload/${transformString}/${rest}`;
      }
    }
  } catch (error) {
    console.warn('Error optimizing Cloudinary URL:', error);
    return url;
  }

  return url;
}

/**
 * Optimiza una URL de Supabase Storage
 * @param url - URL original de Supabase
 * @param width - Ancho deseado
 * @param height - Alto deseado
 * @returns URL optimizada (si es posible)
 */
export function optimizeSupabaseUrl(
  url: string,
  width?: number,
  height?: number
): string {
  if (!url || !url.includes('supabase')) {
    return url;
  }

  // Supabase Storage no tiene transformaciones automáticas como Cloudinary
  // Pero podemos usar next/image que optimiza automáticamente
  return url;
}

/**
 * Obtiene el tamaño de imagen apropiado según el breakpoint
 */
export function getResponsiveImageSizes(
  sizes: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  } = {}
): string {
  const {
    mobile = 640,
    tablet = 768,
    desktop = 1024,
    large = 1280,
  } = sizes;

  return `(max-width: 640px) ${mobile}px, (max-width: 768px) ${tablet}px, (max-width: 1024px) ${desktop}px, ${large}px`;
}

