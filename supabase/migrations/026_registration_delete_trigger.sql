-- Migration 026: Add DELETE handling to participant counter trigger
--
-- This migration extends the existing trigger system to handle DELETE operations
-- on registrations. When a confirmed & paid registration is deleted, the
-- current_participants counter will be automatically decremented.
--
-- This ensures database integrity regardless of how deletions occur (app layer,
-- admin panel, or direct database operations).

-- Drop existing trigger
DROP TRIGGER IF EXISTS registrations_update_participants ON registrations;

-- Recreate function with DELETE support
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
    -- Case 1: Registration transitioning TO confirmed & paid status
    -- (from any other state: pending, cancelled, etc.)
    IF (NEW.status = 'confirmed' AND NEW.payment_status = 'paid') AND
       NOT (COALESCE(OLD.status, '') = 'confirmed' AND COALESCE(OLD.payment_status, '') = 'paid') THEN

      UPDATE event_categories
      SET current_participants = current_participants + 1
      WHERE id = NEW.category_id;

    -- Case 2: Registration transitioning FROM confirmed & paid status
    -- (to cancelled, pending, etc.)
    ELSIF (COALESCE(OLD.status, '') = 'confirmed' AND COALESCE(OLD.payment_status, '') = 'paid') AND
          NOT (NEW.status = 'confirmed' AND NEW.payment_status = 'paid') THEN

      UPDATE event_categories
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = OLD.category_id;

    -- Case 3: Category change while registration remains confirmed & paid
    ELSIF (OLD.status = 'confirmed' AND OLD.payment_status = 'paid') AND
          (NEW.status = 'confirmed' AND NEW.payment_status = 'paid') AND
          (OLD.category_id != NEW.category_id) THEN

      -- Decrement counter for old category
      UPDATE event_categories
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = OLD.category_id;

      -- Increment counter for new category
      UPDATE event_categories
      SET current_participants = current_participants + 1
      WHERE id = NEW.category_id;

    END IF;
    RETURN NEW;

  -- Handle DELETE operations (NEW!)
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

-- Recreate trigger with DELETE support
CREATE TRIGGER registrations_update_participants
  AFTER INSERT OR UPDATE OR DELETE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_category_participants();

-- Update comment to document the DELETE handling
COMMENT ON FUNCTION update_category_participants() IS
  'Maintains event_categories.current_participants counter. Increments on confirm/paid, decrements on cancel or delete. Never goes below 0.';
