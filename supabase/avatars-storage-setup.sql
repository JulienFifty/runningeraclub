-- Script para configurar el Storage de avatares de perfil
-- Este script debe ejecutarse una sola vez en Supabase SQL Editor

-- 1. Crear el bucket 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir que los usuarios suban sus propias fotos
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Política para permitir que los usuarios actualicen sus propias fotos
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Política para permitir que todos vean los avatares (bucket público)
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 5. Política para permitir que los usuarios eliminen sus propias fotos
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);


