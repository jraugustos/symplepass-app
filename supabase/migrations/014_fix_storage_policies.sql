-- Migration: Fix Storage Policies for File Uploads
-- Description: Drop and recreate storage policies with corrected syntax and permissions
-- Created: 2025-01-21

-- ============================================================================
-- STEP 1: Drop existing policies if they exist
-- ============================================================================

DROP POLICY IF EXISTS "Admins e organizadores podem fazer upload de banners" ON storage.objects;
DROP POLICY IF EXISTS "Banners são públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Admins e organizadores podem deletar banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins e organizadores podem atualizar banners" ON storage.objects;

-- ============================================================================
-- STEP 2: Ensure bucket exists and is public
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-banners',
  'event-banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id)
DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- ============================================================================
-- STEP 3: Create permissive storage policies
-- ============================================================================

-- Policy: Allow public read access to all files in event-banners
CREATE POLICY "event_banners_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

-- Policy: Allow authenticated users with admin/organizer roles to upload
CREATE POLICY "event_banners_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners'
  AND (
    -- Check if user has admin or organizer role
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- Policy: Allow authenticated users with admin/organizer roles to update their uploads
CREATE POLICY "event_banners_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
)
WITH CHECK (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- Policy: Allow authenticated users with admin/organizer roles to delete
CREATE POLICY "event_banners_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- ============================================================================
-- STEP 4: Create policies for other buckets
-- ============================================================================

-- Create other buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('event-media', 'event-media', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('event-documents', 'event-documents', true, 52428800, ARRAY['application/pdf']),
  ('event-routes', 'event-routes', true, 20971520, ARRAY['application/gpx+xml', 'application/xml', 'text/xml']),
  ('kit-items', 'kit-items', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('organizer-assets', 'organizer-assets', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies for other buckets
DROP POLICY IF EXISTS "event_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "event_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_documents_public_read" ON storage.objects;
DROP POLICY IF EXISTS "event_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_routes_public_read" ON storage.objects;
DROP POLICY IF EXISTS "event_routes_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "kit_items_public_read" ON storage.objects;
DROP POLICY IF EXISTS "kit_items_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "organizer_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "organizer_assets_authenticated_upload" ON storage.objects;

-- Event Media policies
CREATE POLICY "event_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-media');

CREATE POLICY "event_media_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- Event Documents policies
CREATE POLICY "event_documents_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-documents');

CREATE POLICY "event_documents_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- Event Routes policies
CREATE POLICY "event_routes_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-routes');

CREATE POLICY "event_routes_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-routes'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- Kit Items policies
CREATE POLICY "kit_items_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kit-items');

CREATE POLICY "kit_items_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-items'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- User Avatars policies (any authenticated user can upload their own avatar)
CREATE POLICY "user_avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "user_avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

-- Organizer Assets policies
CREATE POLICY "organizer_assets_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organizer-assets');

CREATE POLICY "organizer_assets_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizer-assets'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  )
);

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

-- Ensure the authenticated role can access storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
