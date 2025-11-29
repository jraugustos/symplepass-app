-- Migration: Event Details Schema
-- Description: Extends the database schema with tables for kit items, course info, FAQs, regulations, and organizers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Event Kit Items Table
CREATE TABLE IF NOT EXISTS event_kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_kit_items_event_id ON event_kit_items(event_id);

-- Event Course Information Table (one-to-one with events)
CREATE TABLE IF NOT EXISTS event_course_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    map_image_url TEXT,
    google_maps_url TEXT,
    gpx_file_url TEXT,
    start_finish_location TEXT,
    elevation_gain INTEGER, -- in meters
    elevation_loss INTEGER, -- in meters
    max_elevation INTEGER, -- in meters
    support_points JSONB DEFAULT '[]'::JSONB, -- array of strings
    course_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enforce one-to-one relationship
CREATE UNIQUE INDEX idx_event_course_info_event_id ON event_course_info(event_id);

-- Event FAQs Table
CREATE TABLE IF NOT EXISTS event_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_faqs_event_id ON event_faqs(event_id);

-- Event Regulations Table
CREATE TABLE IF NOT EXISTS event_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_regulations_event_id ON event_regulations(event_id);

-- Event Organizers Table (one-to-one with profiles)
CREATE TABLE IF NOT EXISTS event_organizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enforce one-to-one relationship with profiles
CREATE UNIQUE INDEX idx_event_organizers_profile_id ON event_organizers(profile_id);

-- Add columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS regulation_pdf_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS regulation_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS kit_pickup_info JSONB;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_event_kit_items_updated_at BEFORE UPDATE ON event_kit_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_course_info_updated_at BEFORE UPDATE ON event_course_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_faqs_updated_at BEFORE UPDATE ON event_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_regulations_updated_at BEFORE UPDATE ON event_regulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_organizers_updated_at BEFORE UPDATE ON event_organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
