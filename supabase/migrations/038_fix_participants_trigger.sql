-- Migration: Ensure participants trigger is properly installed and working
-- This migration recreates the trigger to guarantee it's active

-- First, drop existing trigger if exists
DROP TRIGGER IF EXISTS registrations_update_participants ON registrations;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS update_category_participants();

-- Recreate function with proper logic
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
  'Maintains event_categories.current_participants counter. Increments on confirm/paid, decrements on cancel or delete. Never goes below 0.';
