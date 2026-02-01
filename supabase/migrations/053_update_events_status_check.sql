-- Update events_status_check constraint to include 'pending_approval'

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events 
  ADD CONSTRAINT events_status_check 
  CHECK (status IN ('draft', 'published', 'published_no_registration', 'cancelled', 'completed', 'pending_approval'));
