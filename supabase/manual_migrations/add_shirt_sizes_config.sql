-- ============================================
-- MIGRATION: Add shirt_sizes_config to events
-- ============================================
-- Description: Adds gender-based shirt size configuration to events table
-- This allows organizers to configure different size grids for:
-- - masculino (masculine sizes)
-- - feminino (feminine sizes)
-- - infantil (children sizes)
--
-- Usage: Execute this script in the Supabase SQL Editor
-- ============================================

-- Add the shirt_sizes_config column as JSONB
ALTER TABLE events
ADD COLUMN IF NOT EXISTS shirt_sizes_config JSONB DEFAULT NULL;

-- Add a helpful comment documenting the expected structure
COMMENT ON COLUMN events.shirt_sizes_config IS
'Gender-based shirt size configuration.
Expected JSON structure:
{
  "masculino": ["PP", "P", "M", "G", "GG", "XGG"],
  "feminino": ["PP", "P", "M", "G", "GG"],
  "infantil": ["2", "4", "6", "8", "10", "12", "14"]
}
If NULL, the system will use default size grids defined in the frontend.';

-- Create a GIN index for efficient JSONB queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_events_shirt_sizes_config
ON events USING GIN (shirt_sizes_config);

-- ============================================
-- EXAMPLE: How to set shirt_sizes_config
-- ============================================
-- Uncomment and modify the example below to set custom sizes for an event:
/*
UPDATE events
SET shirt_sizes_config = '{
  "masculino": ["PP", "P", "M", "G", "GG", "XGG"],
  "feminino": ["PP", "P", "M", "G", "GG"],
  "infantil": ["2", "4", "6", "8", "10", "12", "14"]
}'::jsonb
WHERE id = 'your-event-id-here';
*/

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the column was added successfully:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events' AND column_name = 'shirt_sizes_config';
