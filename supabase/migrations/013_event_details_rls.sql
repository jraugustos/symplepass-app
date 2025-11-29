-- Enable RLS on event details tables
ALTER TABLE event_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_course_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_regulations ENABLE ROW LEVEL SECURITY;

-- Policies for event_kit_items

CREATE POLICY "Public can view kit items for published events"
ON event_kit_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_kit_items.event_id
        AND events.status = 'published'
    )
);

CREATE POLICY "Organizers can view kit items for their events"
ON event_kit_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_kit_items.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can create kit items for their events"
ON event_kit_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_kit_items.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can update kit items for their events"
ON event_kit_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_kit_items.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can delete kit items for their events"
ON event_kit_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_kit_items.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

-- Policies for event_course_info

CREATE POLICY "Public can view course info for published events"
ON event_course_info FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_course_info.event_id
        AND events.status = 'published'
    )
);

CREATE POLICY "Organizers can view course info for their events"
ON event_course_info FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_course_info.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can create course info for their events"
ON event_course_info FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_course_info.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can update course info for their events"
ON event_course_info FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_course_info.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

-- Policies for event_faqs

CREATE POLICY "Public can view faqs for published events"
ON event_faqs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_faqs.event_id
        AND events.status = 'published'
    )
);

CREATE POLICY "Organizers can view faqs for their events"
ON event_faqs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_faqs.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can create faqs for their events"
ON event_faqs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_faqs.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can update faqs for their events"
ON event_faqs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_faqs.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can delete faqs for their events"
ON event_faqs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_faqs.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

-- Policies for event_regulations

CREATE POLICY "Public can view regulations for published events"
ON event_regulations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_regulations.event_id
        AND events.status = 'published'
    )
);

CREATE POLICY "Organizers can view regulations for their events"
ON event_regulations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_regulations.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can create regulations for their events"
ON event_regulations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_regulations.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can update regulations for their events"
ON event_regulations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_regulations.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Organizers can delete regulations for their events"
ON event_regulations FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_regulations.event_id
        AND (
            events.organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);
