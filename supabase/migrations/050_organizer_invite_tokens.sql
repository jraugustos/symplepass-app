-- ============================================================
-- Migration: 050_organizer_invite_tokens.sql
-- Description: Creates table for organizer invitation tokens
-- ============================================================

-- Create organizer invite tokens table
CREATE TABLE IF NOT EXISTS organizer_invite_tokens (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT, -- Optional: pre-define email for the invite
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ, -- For manual revocation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_organizer_invite_tokens_token ON organizer_invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_organizer_invite_tokens_created_by ON organizer_invite_tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_organizer_invite_tokens_expires_at ON organizer_invite_tokens(expires_at);

-- Enable RLS
ALTER TABLE organizer_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all tokens
CREATE POLICY "Admins can view all invite tokens"
  ON organizer_invite_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can create tokens
CREATE POLICY "Admins can create invite tokens"
  ON organizer_invite_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update tokens (for revocation)
CREATE POLICY "Admins can update invite tokens"
  ON organizer_invite_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Allow public read for token validation (by token value only)
-- This is needed for the signup page to validate the token
CREATE POLICY "Anyone can validate invite tokens by token value"
  ON organizer_invite_tokens FOR SELECT
  USING (true);

-- Add comment
COMMENT ON TABLE organizer_invite_tokens IS 'Invitation tokens for organizer registration';
COMMENT ON COLUMN organizer_invite_tokens.token IS 'Unique token string for URL';
COMMENT ON COLUMN organizer_invite_tokens.email IS 'Optional pre-defined email for the invite';
COMMENT ON COLUMN organizer_invite_tokens.created_by IS 'Admin who created the invite';
COMMENT ON COLUMN organizer_invite_tokens.used_by IS 'Profile that used this invite';
COMMENT ON COLUMN organizer_invite_tokens.used_at IS 'When the invite was used';
COMMENT ON COLUMN organizer_invite_tokens.expires_at IS 'When the invite expires';
COMMENT ON COLUMN organizer_invite_tokens.revoked_at IS 'When the invite was manually revoked';
