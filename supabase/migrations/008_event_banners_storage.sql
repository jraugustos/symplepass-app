-- Migration: Event Banners Storage Setup
-- Description: Create storage bucket for event banners and configure RLS policies
-- Created: 2025-01-17

-- Create bucket for event banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow admins and organizers to upload banners
CREATE POLICY "Admins e organizadores podem fazer upload de banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- Policy: Allow public read access to banners
CREATE POLICY "Banners são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

-- Policy: Allow admins and organizers to delete banners
CREATE POLICY "Admins e organizadores podem deletar banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- Policy: Allow admins and organizers to update banners
CREATE POLICY "Admins e organizadores podem atualizar banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-banners' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);
