-- ============================================================
-- Migration: 051_event_approval_workflow.sql
-- Description: Adds approval workflow fields for organizer events
-- Note: status field uses TEXT type, not enum, so pending_approval
--       can be used directly without altering enum type
-- ============================================================

-- Add approval workflow fields to events table
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for filtering pending approval events
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status) WHERE approval_status IS NOT NULL;

-- Update existing events to have approved status (they were created by admin)
UPDATE events 
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- Add comments
COMMENT ON COLUMN events.service_fee IS 'Service fee charged per registration (set by admin on approval)';
COMMENT ON COLUMN events.approval_status IS 'Approval workflow status: pending, approved, rejected';
COMMENT ON COLUMN events.approval_notes IS 'Notes from admin about approval/rejection';
COMMENT ON COLUMN events.approved_by IS 'Admin who approved/rejected the event';
COMMENT ON COLUMN events.approved_at IS 'When the event was approved/rejected';
