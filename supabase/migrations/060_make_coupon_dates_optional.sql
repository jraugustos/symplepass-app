-- Make valid_from and valid_until nullable
ALTER TABLE coupons ALTER COLUMN valid_from DROP NOT NULL;
ALTER TABLE coupons ALTER COLUMN valid_until DROP NOT NULL;
