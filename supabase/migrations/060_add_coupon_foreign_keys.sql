-- Add foreign key for created_by
ALTER TABLE coupons
ADD CONSTRAINT coupons_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add foreign key for event_id
ALTER TABLE coupons
ADD CONSTRAINT coupons_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE SET NULL;
