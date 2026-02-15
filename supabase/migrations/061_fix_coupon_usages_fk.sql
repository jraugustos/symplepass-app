-- Drop existing foreign key constraint
ALTER TABLE coupon_usages
DROP CONSTRAINT IF EXISTS coupon_usages_registration_id_fkey;

-- Add new foreign key constraint with ON DELETE CASCADE
ALTER TABLE coupon_usages
ADD CONSTRAINT coupon_usages_registration_id_fkey
FOREIGN KEY (registration_id)
REFERENCES registrations(id)
ON DELETE CASCADE;
