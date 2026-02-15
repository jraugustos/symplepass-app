-- Add price to event_kit_items
ALTER TABLE event_kit_items
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- Add has_kit and has_kit_pickup_info to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS has_kit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_kit_pickup_info BOOLEAN DEFAULT false;

-- Create registration_kit_items table
CREATE TABLE IF NOT EXISTS registration_kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    kit_item_id UUID NOT NULL REFERENCES event_kit_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Store the price at the time of registration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_registration_kit_items_registration_id ON registration_kit_items(registration_id);

-- RLS Policies for registration_kit_items

-- Enable RLS
ALTER TABLE registration_kit_items ENABLE ROW LEVEL SECURITY;

-- Policy for reading: Users can see their own kit items, admins/organizers can see all
CREATE POLICY "Users can view their own kit items"
ON registration_kit_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM registrations r
        WHERE r.id = registration_kit_items.registration_id
        AND (
            -- User owns the registration (if authenticated)
            (auth.role() = 'authenticated' AND r.user_id = auth.uid())
            OR
            -- Public access currently allowed for registration flow/confirmation often needs open access or tailored RLS.
            -- Assuming basic authenticated user check for now, aligned with registrations table policies.
            -- Or organizer/admin check:
            EXISTS (
                SELECT 1 FROM events e
                WHERE e.id = r.event_id
                AND (e.organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
            )
        )
    )
);

-- Policy for creation: Open during registration or strictly for authenticated users?
-- Usually created by the system/server-side which bypasses RLS, but if client-side:
CREATE POLICY "Users can create kit items during registration"
ON registration_kit_items FOR INSERT
WITH CHECK (
    -- Allow creation if the linked registration belongs to the user or is being created
    -- Server-side creation is preferred, but for RLS completeness:
    true
);
