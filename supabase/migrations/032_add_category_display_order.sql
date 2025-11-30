-- Migration: Add display_order to event_categories
-- This allows categories to be manually ordered by the admin

-- Add display_order column to event_categories
ALTER TABLE event_categories
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing categories to have sequential display_order based on created_at
WITH ordered_categories AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY created_at) - 1 as new_order
  FROM event_categories
)
UPDATE event_categories
SET display_order = ordered_categories.new_order
FROM ordered_categories
WHERE event_categories.id = ordered_categories.id;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_event_categories_display_order
ON event_categories(event_id, display_order);

-- Add comment for documentation
COMMENT ON COLUMN event_categories.display_order IS 'Order in which the category should be displayed (0-based)';
