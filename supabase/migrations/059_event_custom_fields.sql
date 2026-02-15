-- ============================================================
-- Migration 059: Event Custom Fields
-- ============================================================
-- Allows admins to define custom registration fields per event
-- (e.g., "Equipe", "Número do peito", etc.)
-- Values are stored in registrations.registration_data.custom_fields

-- Create type for supported field types
DO $$ BEGIN
  CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'select', 'checkbox');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the custom fields table
CREATE TABLE IF NOT EXISTS event_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- internal slug/key (e.g. "equipe")
  label TEXT NOT NULL,          -- display label (e.g. "Equipe")
  field_type custom_field_type NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB DEFAULT NULL,   -- array of options for 'select' type, e.g. ["Team A", "Team B"]
  placeholder TEXT DEFAULT NULL, -- optional placeholder text
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, name)
);

-- Index for efficient lookup by event
CREATE INDEX IF NOT EXISTS idx_event_custom_fields_event_id
  ON event_custom_fields(event_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_event_custom_fields_order
  ON event_custom_fields(event_id, display_order);

-- Enable RLS
ALTER TABLE event_custom_fields ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for registration form)
CREATE POLICY "Anyone can view custom fields"
  ON event_custom_fields
  FOR SELECT
  USING (true);

-- Admin/organizer write access
CREATE POLICY "Admins can manage custom fields"
  ON event_custom_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_fields_updated_at
  BEFORE UPDATE ON event_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_updated_at();
