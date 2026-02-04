-- ============================================================
-- Migration: Photo Face Recognition System
-- Description: Tables for storing face embeddings and processing status
-- ============================================================

-- Enable pgvector extension for vector similarity search
-- Note: This extension is available on Supabase by default
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: photo_face_embeddings
-- Stores face embeddings detected in event photos
-- ============================================================
CREATE TABLE photo_face_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Face embedding vector (face-api.js returns 128 dimensions)
  embedding VECTOR(128) NOT NULL,

  -- Bounding box of the face in the photo (for visual highlight)
  -- Format: {x, y, width, height} in pixels
  bounding_box JSONB,

  -- Detection confidence score (0-1)
  detection_confidence DECIMAL(5,4),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_face_embeddings_photo ON photo_face_embeddings(photo_id);
CREATE INDEX idx_face_embeddings_event ON photo_face_embeddings(event_id);

-- Vector similarity index using IVFFlat
-- Note: IVFFlat requires at least 1 row to build the index
-- We'll create it with a smaller lists value initially
CREATE INDEX idx_face_embeddings_vector ON photo_face_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- TABLE: photo_face_processing
-- Tracks the face detection processing status for each photo
-- ============================================================
CREATE TABLE photo_face_processing (
  photo_id UUID PRIMARY KEY REFERENCES event_photos(id) ON DELETE CASCADE,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'no_faces')),

  -- Number of faces found in the photo
  faces_found INTEGER DEFAULT 0,

  -- When the processing was completed
  processed_at TIMESTAMPTZ,

  -- Error message if processing failed
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by status
CREATE INDEX idx_face_processing_status ON photo_face_processing(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_face_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_face_processing_updated_at
  BEFORE UPDATE ON photo_face_processing
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_face_processing_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE photo_face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_face_processing ENABLE ROW LEVEL SECURITY;

-- Embeddings: Public read access (embeddings are anonymous vectors)
CREATE POLICY "Anyone can view face embeddings"
  ON photo_face_embeddings
  FOR SELECT
  USING (true);

-- Embeddings: Insert/Update only by admins or event organizers
CREATE POLICY "Admins and organizers can insert embeddings"
  ON photo_face_embeddings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and organizers can update embeddings"
  ON photo_face_embeddings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and organizers can delete embeddings"
  ON photo_face_embeddings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- Processing status: Public read access
CREATE POLICY "Anyone can view processing status"
  ON photo_face_processing
  FOR SELECT
  USING (true);

-- Processing status: Insert/Update only by admins or event organizers
CREATE POLICY "Admins and organizers can insert processing status"
  ON photo_face_processing
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_photos ep
      JOIN events e ON e.id = ep.event_id
      WHERE ep.id = photo_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and organizers can update processing status"
  ON photo_face_processing
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_photos ep
      JOIN events e ON e.id = ep.event_id
      WHERE ep.id = photo_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- ============================================================
-- FUNCTION: Search faces by similarity
-- Returns photos matching a given face embedding
-- ============================================================
CREATE OR REPLACE FUNCTION search_faces_by_embedding(
  p_event_id UUID,
  p_embedding VECTOR(128),
  p_limit INTEGER DEFAULT 50,
  p_threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  photo_id UUID,
  similarity FLOAT,
  bounding_box JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pfe.photo_id,
    1 - (pfe.embedding <=> p_embedding) AS similarity,
    pfe.bounding_box
  FROM photo_face_embeddings pfe
  WHERE pfe.event_id = p_event_id
    AND 1 - (pfe.embedding <=> p_embedding) >= p_threshold
  ORDER BY pfe.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: Get face processing stats for an event
-- Returns processing statistics for admin dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION get_event_face_processing_stats(p_event_id UUID)
RETURNS TABLE (
  total_photos BIGINT,
  pending_photos BIGINT,
  processing_photos BIGINT,
  completed_photos BIGINT,
  failed_photos BIGINT,
  no_faces_photos BIGINT,
  total_faces_found BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ep.id) AS total_photos,
    COUNT(DISTINCT ep.id) FILTER (WHERE COALESCE(pfp.status, 'pending') = 'pending') AS pending_photos,
    COUNT(DISTINCT ep.id) FILTER (WHERE pfp.status = 'processing') AS processing_photos,
    COUNT(DISTINCT ep.id) FILTER (WHERE pfp.status = 'completed') AS completed_photos,
    COUNT(DISTINCT ep.id) FILTER (WHERE pfp.status = 'failed') AS failed_photos,
    COUNT(DISTINCT ep.id) FILTER (WHERE pfp.status = 'no_faces') AS no_faces_photos,
    COALESCE(SUM(pfp.faces_found), 0) AS total_faces_found
  FROM event_photos ep
  LEFT JOIN photo_face_processing pfp ON pfp.photo_id = ep.id
  WHERE ep.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_faces_by_embedding TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_event_face_processing_stats TO authenticated;
