-- Script para configurar políticas de storage no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Política para bucket event-media
-- Permitir leitura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'event-media');

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-media'
  AND auth.role() = 'authenticated'
);

-- Permitir update para usuários autenticados
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-media'
  AND auth.role() = 'authenticated'
);

-- Permitir delete para usuários autenticados
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-media'
  AND auth.role() = 'authenticated'
);

-- Política para bucket event-documents
CREATE POLICY "Public Access Documents" ON storage.objects
FOR SELECT USING (bucket_id = 'event-documents');

CREATE POLICY "Authenticated can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-documents'
  AND auth.role() = 'authenticated'
);

-- Política para bucket event-routes
CREATE POLICY "Public Access Routes" ON storage.objects
FOR SELECT USING (bucket_id = 'event-routes');

CREATE POLICY "Authenticated can upload routes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-routes'
  AND auth.role() = 'authenticated'
);

-- Política para bucket kit-items
CREATE POLICY "Public Access Kit Items" ON storage.objects
FOR SELECT USING (bucket_id = 'kit-items');

CREATE POLICY "Authenticated can upload kit items" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kit-items'
  AND auth.role() = 'authenticated'
);

-- Política para bucket user-avatars
CREATE POLICY "Public Access Avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
);

-- Política para bucket organizer-assets
CREATE POLICY "Public Access Organizer Assets" ON storage.objects
FOR SELECT USING (bucket_id = 'organizer-assets');

CREATE POLICY "Authenticated can upload organizer assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'organizer-assets'
  AND auth.role() = 'authenticated'
);