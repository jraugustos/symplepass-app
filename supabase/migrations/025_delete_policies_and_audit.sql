-- Migration: DELETE policies and Audit Logs
-- Description: Add DELETE RLS policies and create audit_logs table
-- Created: 2025-01-25
-- Issues:
--   1. Missing DELETE policies on profiles, events, event_categories, registrations
--   2. No audit trail for admin operations

-- ============================================================================
-- PART 1: DELETE Policies
-- ============================================================================

-- Profiles: Only admins can delete profiles (soft delete recommended in practice)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Events: Organizers can delete their own events, admins can delete any
CREATE POLICY "Organizers can delete their own events"
  ON events FOR DELETE
  USING (
    auth.uid() = organizer_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Event Categories: Organizers can delete categories of their events
CREATE POLICY "Organizers can delete categories of their events"
  ON event_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
      AND (
        events.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Registrations: Users can delete their own pending registrations, admins can delete any
CREATE POLICY "Users can delete their own pending registrations"
  ON registrations FOR DELETE
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 2: Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,

  -- What action was performed
  action TEXT NOT NULL CHECK (action IN (
    'role_change',
    'registration_delete',
    'event_delete',
    'coupon_create',
    'coupon_update',
    'coupon_delete',
    'export_registrations',
    'export_reports',
    'profile_delete',
    'category_delete',
    'other'
  )),

  -- Target of the action
  target_type TEXT NOT NULL CHECK (target_type IN (
    'user',
    'event',
    'registration',
    'coupon',
    'category',
    'report',
    'other'
  )),
  target_id TEXT,

  -- Additional context
  details JSONB DEFAULT '{}',

  -- IP and user agent (for security auditing)
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert audit logs (or service role)
CREATE POLICY "Only admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No one can update or delete audit logs (immutable)
-- (No UPDATE or DELETE policies = no updates or deletes allowed)

-- ============================================================================
-- PART 3: Helper function for creating audit logs
-- ============================================================================

CREATE OR REPLACE FUNCTION create_audit_log(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users (function handles auth check internally)
GRANT EXECUTE ON FUNCTION create_audit_log TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for admin operations';
COMMENT ON FUNCTION create_audit_log IS 'Creates an audit log entry for admin operations';
