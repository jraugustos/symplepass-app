-- Enable Row Level Security on event_organizers table
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view organizer info for published events" ON event_organizers;
DROP POLICY IF EXISTS "Organizers can view their own profile" ON event_organizers;
DROP POLICY IF EXISTS "Organizers can create their own profile" ON event_organizers;
DROP POLICY IF EXISTS "Organizers can update their own profile" ON event_organizers;
DROP POLICY IF EXISTS "Organizers can delete their own profile" ON event_organizers;

-- Policy 1: Public read for published events
-- Allow anyone to view organizer info for published events
CREATE POLICY "Public can view organizer info for published events"
ON event_organizers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.organizer_id = event_organizers.profile_id
    AND events.status = 'published'
  )
);

-- Policy 2: Organizers can view their own profile
-- Allows organizers to view their own profile, admins can view all profiles
CREATE POLICY "Organizers can view their own profile"
ON event_organizers
FOR SELECT
USING (
  auth.uid() = profile_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: Organizers can create their own profile
-- Only users with 'organizer' or 'admin' role can create profiles
CREATE POLICY "Organizers can create their own profile"
ON event_organizers
FOR INSERT
WITH CHECK (
  auth.uid() = profile_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('organizer', 'admin')
  )
);

-- Policy 4: Organizers can update their own profile
-- Allows organizers to update their own profile, admins can update all profiles
CREATE POLICY "Organizers can update their own profile"
ON event_organizers
FOR UPDATE
USING (
  auth.uid() = profile_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 5: Organizers can delete their own profile
-- Allows organizers to delete their own profile, admins can delete all profiles
CREATE POLICY "Organizers can delete their own profile"
ON event_organizers
FOR DELETE
USING (
  auth.uid() = profile_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
