-- Migration: Admin Dashboard Stats RPC
-- Description: Creates an RPC function to fetch all dashboard stats in a single query
-- Created: 2025-01-25
-- Issue: Admin dashboard makes 4+ separate queries; consolidate for better performance

-- ============================================================================
-- Create RPC function for dashboard stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_total_events BIGINT;
  v_active_events BIGINT;
  v_total_registrations BIGINT;
  v_confirmed_registrations BIGINT;
  v_pending_registrations BIGINT;
  v_total_revenue NUMERIC;
  v_total_users BIGINT;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get event counts
  SELECT COUNT(*) INTO v_total_events FROM events;
  SELECT COUNT(*) INTO v_active_events FROM events WHERE status = 'published';

  -- Get registration counts
  SELECT COUNT(*) INTO v_total_registrations FROM registrations;
  SELECT COUNT(*) INTO v_confirmed_registrations FROM registrations WHERE status = 'confirmed';
  SELECT COUNT(*) INTO v_pending_registrations FROM registrations WHERE status = 'pending';

  -- Get total revenue (sum of paid registrations)
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_revenue
  FROM registrations
  WHERE payment_status = 'paid';

  -- Get user count
  SELECT COUNT(*) INTO v_total_users FROM profiles;

  -- Build JSON result
  result := json_build_object(
    'totalEvents', v_total_events,
    'activeEvents', v_active_events,
    'totalRegistrations', v_total_registrations,
    'confirmedRegistrations', v_confirmed_registrations,
    'pendingRegistrations', v_pending_registrations,
    'totalRevenue', v_total_revenue,
    'totalUsers', v_total_users,
    'fetchedAt', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (RPC handles its own auth check)
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_admin_dashboard_stats() IS 'Fetches all admin dashboard statistics in a single query. Requires admin role.';
