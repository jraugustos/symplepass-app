-- Migration: Fix category change trigger for all registration statuses
-- Description: Updates the trigger to handle category changes for ALL registrations,
-- not just confirmed & paid ones. This ensures proper tracking when admin changes categories.

-- First, drop existing trigger if exists
DROP TRIGGER IF EXISTS registrations_update_participants ON registrations;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_category_participants();

-- Recreate function with updated logic
-- Now handles category changes for ALL statuses (for tracking purposes)
-- but only counts confirmed & paid for the actual participant count
CREATE OR REPLACE FUNCTION update_category_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- If new registration is already confirmed & paid, increment counter
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' THEN
      UPDATE event_categories
      SET current_participants = current_participants + 1
      WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;

  -- Handle UPDATE operations
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if category changed
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      -- Category changed - need to update both old and new category counters
      -- But only if the registration is/was confirmed & paid

      -- If OLD was confirmed & paid, decrement old category
      IF OLD.status = 'confirmed' AND OLD.payment_status = 'paid' THEN
        UPDATE event_categories
        SET current_participants = GREATEST(current_participants - 1, 0)
        WHERE id = OLD.category_id;
      END IF;

      -- If NEW is confirmed & paid, increment new category
      IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' THEN
        UPDATE event_categories
        SET current_participants = current_participants + 1
        WHERE id = NEW.category_id;
      END IF;

    ELSE
      -- Category didn't change, check for status changes

      -- Case 1: Registration transitioning TO confirmed & paid status
      IF (NEW.status = 'confirmed' AND NEW.payment_status = 'paid') AND
         NOT (COALESCE(OLD.status, '') = 'confirmed' AND COALESCE(OLD.payment_status, '') = 'paid') THEN

        UPDATE event_categories
        SET current_participants = current_participants + 1
        WHERE id = NEW.category_id;

      -- Case 2: Registration transitioning FROM confirmed & paid status
      ELSIF (COALESCE(OLD.status, '') = 'confirmed' AND COALESCE(OLD.payment_status, '') = 'paid') AND
            NOT (NEW.status = 'confirmed' AND NEW.payment_status = 'paid') THEN

        UPDATE event_categories
        SET current_participants = GREATEST(current_participants - 1, 0)
        WHERE id = OLD.category_id;

      END IF;
    END IF;

    RETURN NEW;

  -- Handle DELETE operations
  ELSIF TG_OP = 'DELETE' THEN
    -- If deleting a confirmed & paid registration, decrement counter
    IF OLD.status = 'confirmed' AND OLD.payment_status = 'paid' THEN
      UPDATE event_categories
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = OLD.category_id;
    END IF;
    RETURN OLD;

  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger - IMPORTANT: Must be AFTER trigger to ensure data is committed
CREATE TRIGGER registrations_update_participants
  AFTER INSERT OR UPDATE OR DELETE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_category_participants();

-- Recalculate all current_participants to fix any inconsistencies
UPDATE event_categories
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations
  WHERE registrations.category_id = event_categories.id
    AND registrations.status = 'confirmed'
    AND registrations.payment_status = 'paid'
);

-- Add comment
COMMENT ON FUNCTION update_category_participants() IS
  'Maintains event_categories.current_participants counter. Handles category changes properly. Only counts confirmed & paid registrations. Never goes below 0.';
