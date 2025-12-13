-- Configuración de Supabase Storage para imágenes de eventos
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear bucket para imágenes (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

-- Política para permitir inserción (subida de archivos)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Política para permitir actualización
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'images');

-- Política para permitir eliminación
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'images');

