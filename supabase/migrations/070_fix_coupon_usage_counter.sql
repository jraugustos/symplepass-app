-- Migration: Fix coupon usage counter
-- Problem: increment_coupon_uses() has parameter name collision and RLS blocks updates from regular users
-- Solution: Use database trigger on coupon_usages table (runs as owner, bypasses RLS)

-- 1. Create trigger function to auto-increment current_uses on INSERT
CREATE OR REPLACE FUNCTION trigger_increment_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger function to auto-decrement current_uses on DELETE
CREATE OR REPLACE FUNCTION trigger_decrement_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET current_uses = GREATEST(0, current_uses - 1)
  WHERE id = OLD.coupon_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the triggers
CREATE TRIGGER coupon_usage_increment_trigger
  AFTER INSERT ON coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_coupon_uses();

CREATE TRIGGER coupon_usage_decrement_trigger
  AFTER DELETE ON coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_decrement_coupon_uses();

-- 4. Drop the old broken RPC function
DROP FUNCTION IF EXISTS increment_coupon_uses(UUID);

-- 5. Sync existing data: set current_uses based on actual coupon_usages records
UPDATE coupons
SET current_uses = (
  SELECT COALESCE(count(*), 0)
  FROM coupon_usages
  WHERE coupon_usages.coupon_id = coupons.id
);
