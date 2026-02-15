-- Create table to link categories to kit items
CREATE TABLE IF NOT EXISTS event_category_kit_items (
    category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
    kit_item_id UUID NOT NULL REFERENCES event_kit_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (category_id, kit_item_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_event_category_kit_items_category_id ON event_category_kit_items(category_id);
CREATE INDEX IF NOT EXISTS idx_event_category_kit_items_kit_item_id ON event_category_kit_items(kit_item_id);

-- Enable RLS
ALTER TABLE event_category_kit_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read (public access for registration)
CREATE POLICY "Public read access for event_category_kit_items"
ON event_category_kit_items FOR SELECT
USING (true);

-- Only organizers/admin can insert/delete
CREATE POLICY "Organizers/Admins can manage event_category_kit_items"
ON event_category_kit_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM event_categories ec
        JOIN events e ON e.id = ec.event_id
        WHERE ec.id = event_category_kit_items.category_id
        AND (
            e.organizer_id = auth.uid() 
            OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
);

-- Note regarding Kit Item Price:
-- The requirement states "price of kit items is defined by the category".
-- This implies the price in `event_kit_items` (added in 062) should be ignored or removed.
-- We will keep it for now but ignore it in the client logic, effectively treating it as 0 or included.
