-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Organizers and admins can view their own events"
  ON events FOR SELECT
  USING (
    auth.uid() = organizer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('organizer', 'admin')
    )
  );

CREATE POLICY "Organizers can update their own events"
  ON events FOR UPDATE
  USING (
    auth.uid() = organizer_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Event categories policies
CREATE POLICY "Categories of published events are viewable by everyone"
  ON event_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
      AND events.status = 'published'
    )
  );

CREATE POLICY "Organizers can view categories of their events"
  ON event_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
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

CREATE POLICY "Organizers can create categories for their events"
  ON event_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
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

CREATE POLICY "Organizers can update categories of their events"
  ON event_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
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

-- Registrations policies
CREATE POLICY "Users can view their own registrations"
  ON registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for their events"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
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

CREATE POLICY "Users can create their own registrations"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update registrations for their events"
  ON registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
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
