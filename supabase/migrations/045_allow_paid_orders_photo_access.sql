-- Migration: Allow Paid Orders Photo Access
-- Description: Add RLS policy to allow users with paid orders to access their purchased photos
-- Created: 2025-12-13
--
-- Problem: The existing event_photos RLS policies only allow:
-- 1. Public access to photos of published/completed events
-- 2. Organizer/admin access to their events
--
-- Missing: Users who have PAID for photos cannot access them if the event
-- status changes to something other than published/completed, or in nested
-- queries from photo_order_items.
--
-- Solution: Add a policy that allows authenticated users to access event_photos
-- if they have a paid order that includes those photos.

-- ============================================================
-- Add policy for paid order photo access
-- ============================================================

-- Create policy allowing users with paid orders to access their purchased photos
CREATE POLICY "event_photos_select_paid_orders" ON event_photos
  FOR SELECT TO authenticated
  USING (
    -- Users can access photos they have paid for
    EXISTS (
      SELECT 1 FROM photo_order_items
      JOIN photo_orders ON photo_orders.id = photo_order_items.order_id
      WHERE photo_order_items.photo_id = event_photos.id
      AND photo_orders.user_id = auth.uid()
      AND photo_orders.payment_status = 'paid'
    )
  );

COMMENT ON POLICY "event_photos_select_paid_orders" ON event_photos IS
  'Allows authenticated users to read photos they have purchased in paid orders';
