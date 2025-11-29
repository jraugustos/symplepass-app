-- Add shirt_sizes_config field to events table for gender-based shirt sizes
-- This allows events to configure different size grids for masculino, feminino, and infantil

ALTER TABLE events
ADD COLUMN IF NOT EXISTS shirt_sizes_config JSONB DEFAULT NULL;

-- Add comment to document the structure
COMMENT ON COLUMN events.shirt_sizes_config IS 'Gender-based shirt size configuration. Structure: {"masculino": ["PP", "P", "M", "G", "GG", "XGG"], "feminino": ["PP", "P", "M", "G", "GG"], "infantil": ["2", "4", "6", "8", "10", "12", "14"]}';

-- Create an index for JSONB queries (optional, but helpful for performance)
CREATE INDEX IF NOT EXISTS idx_events_shirt_sizes_config ON events USING GIN (shirt_sizes_config);
