-- COMPREHENSIVE FIX FOR EVENT STATUS CONSTRAINT
-- Execute this in Supabase SQL Editor
-- This will show the current constraint, fix it if needed, and verify the fix

-- ===========================================
-- STEP 1: Check current constraint definition
-- ===========================================
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  RAISE NOTICE '=== STEP 1: Checking current constraint ===';

  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'events'::regclass
  AND conname = 'events_status_check';

  IF constraint_def IS NOT NULL THEN
    RAISE NOTICE 'Current constraint definition: %', constraint_def;
  ELSE
    RAISE NOTICE 'No events_status_check constraint found!';
  END IF;
END $$;

-- ===========================================
-- STEP 2: Drop old constraint if it exists
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '=== STEP 2: Dropping old constraint ===';

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'events'::regclass
    AND conname = 'events_status_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_status_check;
    RAISE NOTICE 'Old constraint dropped successfully';
  ELSE
    RAISE NOTICE 'No constraint to drop';
  END IF;
END $$;

-- ===========================================
-- STEP 3: Create new constraint with all statuses
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '=== STEP 3: Creating new constraint ===';

  ALTER TABLE events ADD CONSTRAINT events_status_check
    CHECK (status IN ('draft', 'published', 'published_no_registration', 'cancelled', 'completed'));

  RAISE NOTICE 'New constraint created successfully with all 5 statuses';
END $$;

-- ===========================================
-- STEP 4: Verify the new constraint
-- ===========================================
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  RAISE NOTICE '=== STEP 4: Verifying new constraint ===';

  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'events'::regclass
  AND conname = 'events_status_check';

  IF constraint_def IS NOT NULL THEN
    RAISE NOTICE 'New constraint definition: %', constraint_def;

    IF constraint_def LIKE '%published_no_registration%' THEN
      RAISE NOTICE '✓ SUCCESS: Constraint includes published_no_registration';
    ELSE
      RAISE WARNING '✗ PROBLEM: Constraint does NOT include published_no_registration';
    END IF;
  ELSE
    RAISE WARNING '✗ PROBLEM: No constraint found after creation!';
  END IF;
END $$;

-- ===========================================
-- STEP 5: Test the constraint
-- ===========================================
DO $$
DECLARE
  test_event_id TEXT;
  event_count INTEGER;
BEGIN
  RAISE NOTICE '=== STEP 5: Testing the constraint ===';

  -- Get the first event ID to test with
  SELECT id INTO test_event_id
  FROM events
  LIMIT 1;

  IF test_event_id IS NULL THEN
    RAISE NOTICE 'No events found to test with - skipping test';
  ELSE
    -- Try to update to the new status (in a transaction that we'll rollback)
    BEGIN
      UPDATE events
      SET status = 'published_no_registration'
      WHERE id = test_event_id;

      -- Check if it worked
      SELECT COUNT(*) INTO event_count
      FROM events
      WHERE id = test_event_id
      AND status = 'published_no_registration';

      IF event_count > 0 THEN
        RAISE NOTICE '✓ SUCCESS: Can update events to published_no_registration';
      ELSE
        RAISE WARNING '✗ PROBLEM: Update did not set the status correctly';
      END IF;

      -- Rollback the test change
      RAISE EXCEPTION 'Rolling back test update';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM = 'Rolling back test update' THEN
          RAISE NOTICE 'Test update rolled back (this is expected)';
        ELSE
          RAISE WARNING '✗ PROBLEM: Test update failed with error: %', SQLERRM;
        END IF;
    END;
  END IF;
END $$;

-- ===========================================
-- STEP 6: Show summary
-- ===========================================
DO $$
DECLARE
  total_events INTEGER;
  draft_count INTEGER;
  published_count INTEGER;
  published_no_reg_count INTEGER;
  cancelled_count INTEGER;
  completed_count INTEGER;
BEGIN
  RAISE NOTICE '=== STEP 6: Current database summary ===';

  SELECT COUNT(*) INTO total_events FROM events;
  SELECT COUNT(*) INTO draft_count FROM events WHERE status = 'draft';
  SELECT COUNT(*) INTO published_count FROM events WHERE status = 'published';
  SELECT COUNT(*) INTO published_no_reg_count FROM events WHERE status = 'published_no_registration';
  SELECT COUNT(*) INTO cancelled_count FROM events WHERE status = 'cancelled';
  SELECT COUNT(*) INTO completed_count FROM events WHERE status = 'completed';

  RAISE NOTICE 'Total events: %', total_events;
  RAISE NOTICE '  - draft: %', draft_count;
  RAISE NOTICE '  - published: %', published_count;
  RAISE NOTICE '  - published_no_registration: %', published_no_reg_count;
  RAISE NOTICE '  - cancelled: %', cancelled_count;
  RAISE NOTICE '  - completed: %', completed_count;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Fix complete! You can now use published_no_registration status.';
END $$;
