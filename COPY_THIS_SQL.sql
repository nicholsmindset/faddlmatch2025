-- FADDL Match Database Setup Script
-- Copy and paste THIS ENTIRE CONTENT into Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom types for Islamic matrimonial platform
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE marital_status AS ENUM ('divorced', 'widowed');
CREATE TYPE location_zone AS ENUM ('north', 'south', 'east', 'west', 'central');
CREATE TYPE prayer_frequency AS ENUM ('always', 'usually', 'rarely');
CREATE TYPE ethnicity AS ENUM ('malay', 'chinese', 'indian', 'eurasian', 'other');
CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'vip');
CREATE TYPE match_status AS ENUM ('pending', 'mutual', 'rejected', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'system');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'flagged', 'removed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    status user_status DEFAULT 'active',
    subscription_tier subscription_tier DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT users_email_check CHECK (email ~* '^.+@.+\..+$')
);

-- User profiles table with Islamic matrimonial fields
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    year_of_birth INTEGER NOT NULL,
    gender gender NOT NULL,
    location_zone location_zone NOT NULL,
    
    -- Family situation
    marital_status marital_status NOT NULL,
    has_children BOOLEAN DEFAULT false,
    children_count INTEGER DEFAULT 0,
    children_ages INTEGER[],
    open_to_more_children BOOLEAN DEFAULT true,
    
    -- Islamic practice
    prayer_frequency prayer_frequency NOT NULL,
    modest_dress prayer_frequency NOT NULL,
    
    -- Background
    ethnicity ethnicity NOT NULL,
    languages TEXT[] NOT NULL,
    education TEXT,
    profession TEXT,
    
    -- Bio and preferences
    bio TEXT,
    looking_for TEXT,
    preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    profile_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT age_check CHECK (EXTRACT(YEAR FROM AGE(NOW(), make_date(year_of_birth, 1, 1))) >= 18),
    UNIQUE(user_id)
);

-- Partner preferences table
CREATE TABLE partner_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    min_age INTEGER NOT NULL DEFAULT 25,
    max_age INTEGER NOT NULL DEFAULT 60,
    preferred_locations location_zone[],
    top_qualities TEXT[] CHECK (array_length(top_qualities, 1) <= 5),
    deal_breakers TEXT[],
    min_prayer_frequency prayer_frequency,
    min_modest_dress prayer_frequency,
    accept_children BOOLEAN DEFAULT true,
    want_more_children BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Photos table with Islamic privacy controls
CREATE TABLE user_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    blur_url TEXT,
    is_primary BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'matches',
    moderation_status moderation_status DEFAULT 'pending',
    moderation_notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT one_primary_photo UNIQUE (user_id, is_primary) WHERE is_primary = true
);

-- Guardian/Wali table for Islamic compliance
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    approval_required BOOLEAN DEFAULT false,
    can_view_messages BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Matches table for AI-powered compatibility
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    compatibility_score DECIMAL(5,2) NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    score_breakdown JSONB DEFAULT '{}',
    
    user_a_status match_status DEFAULT 'pending',
    user_b_status match_status DEFAULT 'pending',
    
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    user_a_responded_at TIMESTAMPTZ,
    user_b_responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    
    CONSTRAINT unique_match UNIQUE (user_a_id, user_b_id),
    CONSTRAINT no_self_match CHECK (user_a_id != user_b_id),
    CONSTRAINT ordered_users CHECK (user_a_id < user_b_id)
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    guardian_approved BOOLEAN DEFAULT true,
    UNIQUE(match_id)
);

-- Messages table with Islamic moderation
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    content TEXT,
    type message_type DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    moderation_status moderation_status DEFAULT 'pending',
    moderation_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_profiles_location ON user_profiles(location_zone);
CREATE INDEX idx_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_profiles_age ON user_profiles(year_of_birth);
CREATE INDEX idx_profiles_marital_status ON user_profiles(marital_status);
CREATE INDEX idx_profiles_prayer_frequency ON user_profiles(prayer_frequency);
CREATE INDEX idx_profiles_ethnicity ON user_profiles(ethnicity);
CREATE INDEX idx_profiles_languages ON user_profiles USING GIN(languages);
CREATE INDEX idx_profiles_completed ON user_profiles(profile_completed_at) WHERE profile_completed_at IS NOT NULL;

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_email_verified ON users(email_verified_at) WHERE email_verified_at IS NOT NULL;

CREATE INDEX idx_matches_user_a ON matches(user_a_id, user_a_status);
CREATE INDEX idx_matches_user_b ON matches(user_b_id, user_b_status);
CREATE INDEX idx_matches_score ON matches(compatibility_score DESC);
CREATE INDEX idx_matches_expires ON matches(expires_at);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their matches" ON matches FOR SELECT 
    USING (auth.uid()::text = user_a_id::text OR auth.uid()::text = user_b_id::text);
CREATE POLICY "Users can view their messages" ON messages FOR ALL 
    USING (auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text);

-- Utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_age(birth_year INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(NOW(), make_date(birth_year, 1, 1)));
END;
$$ LANGUAGE plpgsql;

-- Success indicator
SELECT 'FADDL Match database setup completed successfully!' as status;