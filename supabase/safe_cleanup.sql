-- Safe Cleanup Script for Symplepass Database
-- This script safely removes existing data without touching system triggers

-- Clean up existing data using CASCADE to handle foreign keys automatically
-- The CASCADE option will handle all foreign key constraints without needing to disable triggers

DO $$
BEGIN
    -- Only truncate if tables exist
    -- CASCADE automatically handles foreign key dependencies

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registrations') THEN
        EXECUTE 'TRUNCATE TABLE public.registrations CASCADE';
        RAISE NOTICE 'Cleaned registrations table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_regulations') THEN
        EXECUTE 'TRUNCATE TABLE public.event_regulations CASCADE';
        RAISE NOTICE 'Cleaned event_regulations table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_faqs') THEN
        EXECUTE 'TRUNCATE TABLE public.event_faqs CASCADE';
        RAISE NOTICE 'Cleaned event_faqs table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_course_info') THEN
        EXECUTE 'TRUNCATE TABLE public.event_course_info CASCADE';
        RAISE NOTICE 'Cleaned event_course_info table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_kit_items') THEN
        EXECUTE 'TRUNCATE TABLE public.event_kit_items CASCADE';
        RAISE NOTICE 'Cleaned event_kit_items table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') THEN
        EXECUTE 'TRUNCATE TABLE public.event_categories CASCADE';
        RAISE NOTICE 'Cleaned event_categories table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_organizers') THEN
        EXECUTE 'TRUNCATE TABLE public.event_organizers CASCADE';
        RAISE NOTICE 'Cleaned event_organizers table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        EXECUTE 'TRUNCATE TABLE public.events CASCADE';
        RAISE NOTICE 'Cleaned events table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'TRUNCATE TABLE public.profiles CASCADE';
        RAISE NOTICE 'Cleaned profiles table';
    END IF;

    RAISE NOTICE 'Table cleanup completed successfully';
END $$;

-- Delete test auth.users entries if they exist
-- Using DO block to handle cases where users might not exist
DO $$
DECLARE
    rows_affected INTEGER;
BEGIN
    DELETE FROM auth.users
    WHERE email IN (
        'organizer1@symplepass.com',
        'organizer2@symplepass.com',
        'user1@symplepass.com'
    );

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    IF rows_affected > 0 THEN
        RAISE NOTICE 'Deleted % test users from auth.users', rows_affected;
    ELSE
        RAISE NOTICE 'No test users found to delete';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not delete test users: %', SQLERRM;
END $$;

-- Refresh materialized view only if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_matviews
        WHERE schemaname = 'public'
        AND matviewname = 'events_with_prices'
    ) THEN
        -- Check if the view has any unique indexes for CONCURRENTLY refresh
        IF EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'events_with_prices'
        ) THEN
            EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.events_with_prices';
            RAISE NOTICE 'Refreshed materialized view with CONCURRENTLY';
        ELSE
            EXECUTE 'REFRESH MATERIALIZED VIEW public.events_with_prices';
            RAISE NOTICE 'Refreshed materialized view';
        END IF;
    ELSE
        RAISE NOTICE 'Materialized view events_with_prices does not exist yet';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not refresh materialized view: %', SQLERRM;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ Database cleanup completed successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run setup_database.sql to ensure all tables exist';
    RAISE NOTICE '2. Run seed.sql to populate with sample data';
    RAISE NOTICE '==============================================';
END $$;