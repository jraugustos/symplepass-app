-- Migration: Storage Ownership RLS
-- Description: Restrict event-related storage uploads to event owners only
-- Created: 2025-01-25
-- Issue: Organizers can upload to any event's bucket, not just their own events

-- ============================================================================
-- STEP 1: Drop existing permissive policies for event buckets
-- ============================================================================

DROP POLICY IF EXISTS "event_banners_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_banners_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "event_banners_authenticated_delete" ON storage.objects;

DROP POLICY IF EXISTS "event_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_routes_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "kit_items_authenticated_upload" ON storage.objects;

-- ============================================================================
-- STEP 2: Create ownership-based policies for event-banners
-- Path format expected: {event_id}/banner.{ext} or {event_slug}/banner.{ext}
-- ============================================================================

-- Upload: Admin can upload anywhere, organizer only to their own events
CREATE POLICY "event_banners_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners'
  AND (
    -- Admins can upload to any event
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Organizers can only upload to events they own (by event_id folder)
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- Update: Admin can update anywhere, organizer only their own events
CREATE POLICY "event_banners_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- Delete: Admin can delete anywhere, organizer only their own events
CREATE POLICY "event_banners_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- ============================================================================
-- STEP 3: Create ownership-based policies for event-media
-- ============================================================================

CREATE POLICY "event_media_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

CREATE POLICY "event_media_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'event-media'
);

CREATE POLICY "event_media_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- ============================================================================
-- STEP 4: Create ownership-based policies for event-documents
-- ============================================================================

CREATE POLICY "event_documents_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

CREATE POLICY "event_documents_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- ============================================================================
-- STEP 5: Create ownership-based policies for event-routes
-- ============================================================================

CREATE POLICY "event_routes_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-routes'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

CREATE POLICY "event_routes_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-routes'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- ============================================================================
-- STEP 6: Create ownership-based policies for kit-items
-- ============================================================================

CREATE POLICY "kit_items_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-items'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

CREATE POLICY "kit_items_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kit-items'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.organizer_id = auth.uid()
      AND (
        events.id::text = (storage.foldername(name))[1]
        OR events.slug = (storage.foldername(name))[1]
      )
    )
  )
);

-- ============================================================================
-- STEP 7: Organizer assets - organizer can only manage their own folder
-- Path format: {organizer_id}/filename
-- ============================================================================

DROP POLICY IF EXISTS "organizer_assets_authenticated_upload" ON storage.objects;

CREATE POLICY "organizer_assets_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizer-assets'
  AND (
    -- Admins can upload anywhere
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Organizers can only upload to their own folder
    (
      (storage.foldername(name))[1] = auth.uid()::text
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'organizer'
      )
    )
  )
);

CREATE POLICY "organizer_assets_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organizer-assets'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    (
      (storage.foldername(name))[1] = auth.uid()::text
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'organizer'
      )
    )
  )
);

-- ============================================================================
-- Add comment
-- ============================================================================

COMMENT ON POLICY "event_banners_owner_upload" ON storage.objects IS
  'Only event owners (or admins) can upload banners to their events. Path must start with event_id or slug.';
