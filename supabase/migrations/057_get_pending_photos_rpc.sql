-- ============================================================
-- Migration: Add RPC function for getting pending photos
-- Description: Efficient function to get photos pending face processing
-- ============================================================

-- ============================================================
-- FUNCTION: Get photos pending face processing for an event
-- Uses LEFT JOIN for efficiency with large photo counts
-- ============================================================
CREATE OR REPLACE FUNCTION get_pending_photos_for_processing(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  thumbnail_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.id,
    ep.thumbnail_path
  FROM event_photos ep
  LEFT JOIN photo_face_processing pfp ON pfp.photo_id = ep.id
  WHERE ep.event_id = p_event_id
    AND (pfp.status IS NULL OR pfp.status = 'pending')
  ORDER BY ep.display_order ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_photos_for_processing TO authenticated;
