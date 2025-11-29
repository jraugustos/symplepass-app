-- Cleanup script: Remove existing data and reseed
-- This script safely removes all existing data and reseeds with corrected UUIDs

-- First, disable triggers temporarily
ALTER TABLE events DISABLE TRIGGER ALL;
ALTER TABLE event_categories DISABLE TRIGGER ALL;
ALTER TABLE event_kit_items DISABLE TRIGGER ALL;
ALTER TABLE event_course_info DISABLE TRIGGER ALL;
ALTER TABLE event_faqs DISABLE TRIGGER ALL;
ALTER TABLE event_regulations DISABLE TRIGGER ALL;
ALTER TABLE event_organizers DISABLE TRIGGER ALL;
ALTER TABLE registrations DISABLE TRIGGER ALL;
ALTER TABLE profiles DISABLE TRIGGER ALL;

-- Clean up existing data
TRUNCATE TABLE registrations CASCADE;
TRUNCATE TABLE event_regulations CASCADE;
TRUNCATE TABLE event_faqs CASCADE;
TRUNCATE TABLE event_course_info CASCADE;
TRUNCATE TABLE event_kit_items CASCADE;
TRUNCATE TABLE event_categories CASCADE;
TRUNCATE TABLE event_organizers CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Delete auth.users entries if they exist
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Re-enable triggers
ALTER TABLE events ENABLE TRIGGER ALL;
ALTER TABLE event_categories ENABLE TRIGGER ALL;
ALTER TABLE event_kit_items ENABLE TRIGGER ALL;
ALTER TABLE event_course_info ENABLE TRIGGER ALL;
ALTER TABLE event_faqs ENABLE TRIGGER ALL;
ALTER TABLE event_regulations ENABLE TRIGGER ALL;
ALTER TABLE event_organizers ENABLE TRIGGER ALL;
ALTER TABLE registrations ENABLE TRIGGER ALL;
ALTER TABLE profiles ENABLE TRIGGER ALL;

-- Refresh materialized view if it exists
REFRESH MATERIALIZED VIEW CONCURRENTLY events_with_prices;