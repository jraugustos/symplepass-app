-- Migration: Add Photo Audit Actions
-- Description: Add photo_download action and photo_order target type to audit_logs
-- Created: 2025-12-13

-- ============================================================
-- Update audit_logs constraint to include photo-related actions
-- ============================================================

-- Drop existing constraints
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_target_type_check;

-- Recreate action constraint with photo_download
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN (
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
    'photo_download',
    'photo_upload',
    'other'
  ));

-- Recreate target_type constraint with photo_order
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_target_type_check
  CHECK (target_type IN (
    'user',
    'event',
    'registration',
    'coupon',
    'category',
    'report',
    'photo_order',
    'event_photo',
    'other'
  ));
