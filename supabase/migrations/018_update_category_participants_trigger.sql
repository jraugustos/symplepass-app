-- Migration 018: Automatic participant counter update via triggers
--
-- This migration creates a trigger system to automatically maintain the
-- current_participants counter in event_categories table whenever registrations
-- change status.
--
-- Use cases:
-- 1. Registration confirmed via Stripe webhook -> increment counter
-- 2. Registration confirmed for free events -> increment counter
-- 3. Registration cancelled -> decrement counter
-- 4. Manual status changes by admin -> counter stays in sync

-- Create function to update participant counter
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

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on registrations table
CREATE TRIGGER registrations_update_participants
  AFTER INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_category_participants();

-- Backfill: Recalculate current_participants for all existing categories
-- based on confirmed and paid registrations
UPDATE event_categories ec
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations r
  WHERE r.category_id = ec.id
    AND r.status = 'confirmed'
    AND r.payment_status = 'paid'
);

-- Add comment to document the trigger behavior
COMMENT ON FUNCTION update_category_participants() IS
'Automatically updates event_categories.current_participants counter when registrations change status. Increments on confirmation, decrements on cancellation. Never goes below 0.';
