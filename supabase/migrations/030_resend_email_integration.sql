-- Migration: Resend Email Integration
-- Description: Add tables for newsletter subscribers, contact submissions, and favorite sports

-- ============================================
-- 1. Add favorite_sports column to profiles
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS favorite_sports TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.favorite_sports IS 'Array of sport types the user is interested in, used for email segmentation';

-- ============================================
-- 2. Create newsletter_subscribers table
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  source VARCHAR(50) DEFAULT 'footer',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  resend_contact_id VARCHAR(255),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

-- Indexes for newsletter_subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter subscription data for email marketing';

-- ============================================
-- 3. Create contact_submissions table
-- ============================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contact_submissions
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the website';

-- ============================================
-- 4. RLS Policies for newsletter_subscribers
-- ============================================
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Only admins can view all newsletter subscribers
CREATE POLICY "Admins can view all newsletter subscribers"
ON newsletter_subscribers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can update
CREATE POLICY "Admins can update newsletter subscribers"
ON newsletter_subscribers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 5. RLS Policies for contact_submissions
-- ============================================
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view contact submissions
CREATE POLICY "Admins can view all contact submissions"
ON contact_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Anyone can insert (submit contact form)
CREATE POLICY "Anyone can submit contact form"
ON contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can update (mark as read/replied)
CREATE POLICY "Admins can update contact submissions"
ON contact_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 6. Update trigger for contact_submissions
-- ============================================
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER trigger_update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();
