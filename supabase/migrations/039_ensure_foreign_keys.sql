-- Migration: Ensure Foreign Keys
-- Description: Ensures all foreign key constraints exist for proper Supabase relationships
-- This migration is idempotent - safe to run multiple times

-- Helper function to check if a constraint exists
CREATE OR REPLACE FUNCTION constraint_exists(p_table_name text, p_constraint_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND constraint_name = p_constraint_name
    );
END;
$$ LANGUAGE plpgsql;

-- Events -> Profiles (organizer_id)
DO $$
BEGIN
    IF NOT constraint_exists('events', 'events_organizer_id_fkey') THEN
        ALTER TABLE events
        ADD CONSTRAINT events_organizer_id_fkey
        FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint events_organizer_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint events_organizer_id_fkey already exists';
    END IF;
END $$;

-- Event Categories -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_categories', 'event_categories_event_id_fkey') THEN
        ALTER TABLE event_categories
        ADD CONSTRAINT event_categories_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_categories_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_categories_event_id_fkey already exists';
    END IF;
END $$;

-- Event Kit Items -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_kit_items', 'event_kit_items_event_id_fkey') THEN
        ALTER TABLE event_kit_items
        ADD CONSTRAINT event_kit_items_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_kit_items_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_kit_items_event_id_fkey already exists';
    END IF;
END $$;

-- Event Course Info -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_course_info', 'event_course_info_event_id_fkey') THEN
        ALTER TABLE event_course_info
        ADD CONSTRAINT event_course_info_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_course_info_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_course_info_event_id_fkey already exists';
    END IF;
END $$;

-- Event FAQs -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_faqs', 'event_faqs_event_id_fkey') THEN
        ALTER TABLE event_faqs
        ADD CONSTRAINT event_faqs_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_faqs_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_faqs_event_id_fkey already exists';
    END IF;
END $$;

-- Event Regulations -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_regulations', 'event_regulations_event_id_fkey') THEN
        ALTER TABLE event_regulations
        ADD CONSTRAINT event_regulations_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_regulations_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_regulations_event_id_fkey already exists';
    END IF;
END $$;

-- Registrations -> Events (event_id)
DO $$
BEGIN
    IF NOT constraint_exists('registrations', 'registrations_event_id_fkey') THEN
        ALTER TABLE registrations
        ADD CONSTRAINT registrations_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint registrations_event_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint registrations_event_id_fkey already exists';
    END IF;
END $$;

-- Registrations -> Event Categories (category_id)
DO $$
BEGIN
    IF NOT constraint_exists('registrations', 'registrations_category_id_fkey') THEN
        ALTER TABLE registrations
        ADD CONSTRAINT registrations_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint registrations_category_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint registrations_category_id_fkey already exists';
    END IF;
END $$;

-- Registrations -> Profiles (user_id)
DO $$
BEGIN
    IF NOT constraint_exists('registrations', 'registrations_user_id_fkey') THEN
        ALTER TABLE registrations
        ADD CONSTRAINT registrations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint registrations_user_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint registrations_user_id_fkey already exists';
    END IF;
END $$;

-- Event Organizers -> Profiles (profile_id)
DO $$
BEGIN
    IF NOT constraint_exists('event_organizers', 'event_organizers_profile_id_fkey') THEN
        ALTER TABLE event_organizers
        ADD CONSTRAINT event_organizers_profile_id_fkey
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint event_organizers_profile_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint event_organizers_profile_id_fkey already exists';
    END IF;
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS constraint_exists(text, text);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Foreign key constraints verification complete!';
END $$;
