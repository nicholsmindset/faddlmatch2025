-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom types
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

-- Users table (partitioned by created_at for scalability)
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
    
    -- Indexes for performance
    CONSTRAINT users_email_check CHECK (email ~* '^.+@.+\..+$')
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for users table
CREATE TABLE users_2024_01 PARTITION OF users
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE users_2024_02 PARTITION OF users
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE users_2024_03 PARTITION OF users
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE users_2024_04 PARTITION OF users
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE users_2024_05 PARTITION OF users
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE users_2024_06 PARTITION OF users
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE users_2024_07 PARTITION OF users
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE users_2024_08 PARTITION OF users
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE users_2024_09 PARTITION OF users
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE users_2024_10 PARTITION OF users
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE users_2024_11 PARTITION OF users
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE users_2024_12 PARTITION OF users
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE users_2025_01 PARTITION OF users
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- User profiles table
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
    
    -- Bio and preferences stored as JSONB for flexibility
    bio TEXT,
    looking_for TEXT,
    preferences JSONB DEFAULT '{}',
    
    -- AI embeddings for matching
    profile_embedding vector(1536),
    values_embedding vector(1536),
    
    -- Timestamps
    profile_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT age_check CHECK (EXTRACT(YEAR FROM AGE(NOW(), make_date(year_of_birth, 1, 1))) >= 18),
    UNIQUE(user_id)
);

-- Partner preferences table
CREATE TABLE partner_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Age range
    min_age INTEGER NOT NULL DEFAULT 25,
    max_age INTEGER NOT NULL DEFAULT 60,
    
    -- Location preferences
    preferred_locations location_zone[],
    
    -- Qualities (max 5)
    top_qualities TEXT[] CHECK (array_length(top_qualities, 1) <= 5),
    
    -- Deal breakers
    deal_breakers TEXT[],
    
    -- Islamic practice preferences
    min_prayer_frequency prayer_frequency,
    min_modest_dress prayer_frequency,
    
    -- Family preferences
    accept_children BOOLEAN DEFAULT true,
    want_more_children BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Photos table with privacy controls
CREATE TABLE user_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    blur_url TEXT, -- Blurred version for privacy
    is_primary BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'matches', -- 'public', 'matches', 'approved'
    moderation_status moderation_status DEFAULT 'pending',
    moderation_notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one primary photo per user
    CONSTRAINT one_primary_photo UNIQUE (user_id, is_primary) WHERE is_primary = true
);

-- Guardian/Wali table
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

-- Matches table (the bread and butter)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Match scoring
    compatibility_score DECIMAL(5,2) NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    score_breakdown JSONB DEFAULT '{}',
    
    -- Status tracking
    user_a_status match_status DEFAULT 'pending',
    user_b_status match_status DEFAULT 'pending',
    
    -- Timestamps
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    user_a_responded_at TIMESTAMPTZ,
    user_b_responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    
    -- Ensure no duplicate matches
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

-- Messages table (partitioned for scale)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT,
    type message_type DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    
    -- Status tracking
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Moderation
    moderation_status moderation_status DEFAULT 'pending',
    moderation_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly message partitions
CREATE TABLE messages_2024_01 PARTITION OF messages
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE messages_2024_02 PARTITION OF messages
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE messages_2024_03 PARTITION OF messages
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE messages_2024_04 PARTITION OF messages
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE messages_2024_05 PARTITION OF messages
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE messages_2024_06 PARTITION OF messages
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE messages_2024_07 PARTITION OF messages
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE messages_2024_08 PARTITION OF messages
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE messages_2024_09 PARTITION OF messages
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE messages_2024_10 PARTITION OF messages
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE messages_2024_11 PARTITION OF messages
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE messages_2024_12 PARTITION OF messages
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE messages_2025_01 PARTITION OF messages
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create analytics partitions
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE analytics_events_2024_03 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE analytics_events_2024_04 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE analytics_events_2024_05 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE analytics_events_2024_06 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE analytics_events_2024_07 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE analytics_events_2024_08 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE analytics_events_2024_09 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE analytics_events_2024_10 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE analytics_events_2024_11 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE analytics_events_2024_12 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');