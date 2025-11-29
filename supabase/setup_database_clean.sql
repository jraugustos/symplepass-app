-- Clean Database Setup Script for Symplepass
-- This script creates all tables and configurations without manipulating system triggers

-- ============================================
-- PART 1: ENABLE EXTENSION
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 2: CREATE TABLES (Only if they don't exist)
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  address JSONB,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location JSONB NOT NULL,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  max_participants INTEGER,
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event kit items table
CREATE TABLE IF NOT EXISTS event_kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event course info table
CREATE TABLE IF NOT EXISTS event_course_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  distance TEXT,
  elevation_gain TEXT,
  terrain_type TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  course_map_url TEXT,
  additional_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event FAQs table
CREATE TABLE IF NOT EXISTS event_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event regulations table
CREATE TABLE IF NOT EXISTS event_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event organizers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS event_organizers (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'organizer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, organizer_id)
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  amount_paid DECIMAL(10, 2),
  registration_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- PART 3: CREATE INDEXES (Only if they don't exist)
-- ============================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_categories_event ON event_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_event_kit_items_event ON event_kit_items(event_id);
CREATE INDEX IF NOT EXISTS idx_event_course_info_event ON event_course_info(event_id);
CREATE INDEX IF NOT EXISTS idx_event_faqs_event ON event_faqs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_regulations_event ON event_regulations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_category ON registrations(category_id);

-- ============================================
-- PART 4: CREATE MATERIALIZED VIEW (Only if it doesn't exist)
-- ============================================

-- Drop the view if it exists (to recreate with proper structure)
DROP MATERIALIZED VIEW IF EXISTS events_with_prices;

-- Create materialized view for events with price information
CREATE MATERIALIZED VIEW events_with_prices AS
SELECT
  e.*,
  COALESCE(MIN(ec.price), 0) as min_price,
  COALESCE(MAX(ec.price), 0) as max_price,
  COUNT(DISTINCT ec.id) as category_count,
  COALESCE(SUM(ec.current_participants), 0) as total_participants
FROM events e
LEFT JOIN event_categories ec ON e.id = ec.event_id
GROUP BY e.id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_events_with_prices_id ON events_with_prices(id);
CREATE INDEX IF NOT EXISTS idx_events_with_prices_slug ON events_with_prices(slug);
CREATE INDEX IF NOT EXISTS idx_events_with_prices_status ON events_with_prices(status);
CREATE INDEX IF NOT EXISTS idx_events_with_prices_start_date ON events_with_prices(start_date);

-- ============================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_course_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: CREATE RLS POLICIES (IF NOT EXISTS)
-- ============================================

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

    -- Events policies
    DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
    DROP POLICY IF EXISTS "Organizers can create events" ON events;
    DROP POLICY IF EXISTS "Organizers can update their own events" ON events;

    -- Event categories policies
    DROP POLICY IF EXISTS "Event categories are viewable by everyone" ON event_categories;
    DROP POLICY IF EXISTS "Event organizers can manage categories" ON event_categories;

    -- Other table policies
    DROP POLICY IF EXISTS "Event kit items are viewable by everyone" ON event_kit_items;
    DROP POLICY IF EXISTS "Event course info is viewable by everyone" ON event_course_info;
    DROP POLICY IF EXISTS "Event FAQs are viewable by everyone" ON event_faqs;
    DROP POLICY IF EXISTS "Event regulations are viewable by everyone" ON event_regulations;

    -- Registrations policies
    DROP POLICY IF EXISTS "Users can view their own registrations" ON registrations;
    DROP POLICY IF EXISTS "Event organizers can view registrations" ON registrations;
    DROP POLICY IF EXISTS "Users can create their own registrations" ON registrations;
END $$;

-- Create new policies

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events: Anyone can read published events
CREATE POLICY "Published events are viewable by everyone" ON events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Organizers can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Event categories: Viewable by all, editable by event organizers
CREATE POLICY "Event categories are viewable by everyone" ON event_categories
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage categories" ON event_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_categories.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Similar policies for other event-related tables
CREATE POLICY "Event kit items are viewable by everyone" ON event_kit_items
  FOR SELECT USING (true);

CREATE POLICY "Event course info is viewable by everyone" ON event_course_info
  FOR SELECT USING (true);

CREATE POLICY "Event FAQs are viewable by everyone" ON event_faqs
  FOR SELECT USING (true);

CREATE POLICY "Event regulations are viewable by everyone" ON event_regulations
  FOR SELECT USING (true);

-- Registrations: Users can see their own, organizers can see their event's
CREATE POLICY "Users can view their own registrations" ON registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Event organizers can view registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own registrations" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 7: CREATE OR REPLACE TRIGGER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_event_categories_updated_at ON event_categories;
DROP TRIGGER IF EXISTS update_event_course_info_updated_at ON event_course_info;
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;

-- Apply updated_at trigger to tables with that column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_course_info_updated_at BEFORE UPDATE ON event_course_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📝 Tables created/verified: profiles, events, event_categories, registrations, etc.';
    RAISE NOTICE '🔐 Row Level Security enabled with policies';
    RAISE NOTICE '🚀 Materialized view events_with_prices created';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Next step: Run seed.sql to populate with sample data';
    RAISE NOTICE '==============================================';
END $$;