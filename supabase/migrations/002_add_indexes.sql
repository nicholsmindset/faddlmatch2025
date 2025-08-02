-- Indexes for profile searches
CREATE INDEX idx_profiles_location ON user_profiles(location_zone);
CREATE INDEX idx_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_profiles_age ON user_profiles(year_of_birth);
CREATE INDEX idx_profiles_marital_status ON user_profiles(marital_status);
CREATE INDEX idx_profiles_prayer_frequency ON user_profiles(prayer_frequency);
CREATE INDEX idx_profiles_ethnicity ON user_profiles(ethnicity);
CREATE INDEX idx_profiles_languages ON user_profiles USING GIN(languages);
CREATE INDEX idx_profiles_embedding ON user_profiles USING ivfflat (profile_embedding vector_cosine_ops);
CREATE INDEX idx_profiles_values_embedding ON user_profiles USING ivfflat (values_embedding vector_cosine_ops);
CREATE INDEX idx_profiles_completed ON user_profiles(profile_completed_at) WHERE profile_completed_at IS NOT NULL;

-- Indexes for users table
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_email_verified ON users(email_verified_at) WHERE email_verified_at IS NOT NULL;
CREATE INDEX idx_users_phone_verified ON users(phone_verified_at) WHERE phone_verified_at IS NOT NULL;

-- Indexes for partner preferences
CREATE INDEX idx_preferences_age_range ON partner_preferences(min_age, max_age);
CREATE INDEX idx_preferences_locations ON partner_preferences USING GIN(preferred_locations);
CREATE INDEX idx_preferences_qualities ON partner_preferences USING GIN(top_qualities);

-- Indexes for photos
CREATE INDEX idx_photos_user ON user_photos(user_id);
CREATE INDEX idx_photos_primary ON user_photos(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_photos_visibility ON user_photos(visibility);
CREATE INDEX idx_photos_moderation ON user_photos(moderation_status);

-- Indexes for matches (critical for performance)
CREATE INDEX idx_matches_user_a ON matches(user_a_id, user_a_status);
CREATE INDEX idx_matches_user_b ON matches(user_b_id, user_b_status);
CREATE INDEX idx_matches_mutual ON matches(user_a_status, user_b_status) 
    WHERE user_a_status = 'mutual' AND user_b_status = 'mutual';
CREATE INDEX idx_matches_score ON matches(compatibility_score DESC);
CREATE INDEX idx_matches_expires ON matches(expires_at);
CREATE INDEX idx_matches_created ON matches(matched_at);

-- Indexes for conversations
CREATE INDEX idx_conversations_match ON conversations(match_id);
CREATE INDEX idx_conversations_active ON conversations(is_active) WHERE is_active = true;
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);

-- Indexes for messages (critical for chat performance)
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, created_at);
CREATE INDEX idx_messages_moderation ON messages(moderation_status) WHERE moderation_status != 'approved';
CREATE INDEX idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Indexes for guardians
CREATE INDEX idx_guardians_user ON guardians(user_id);
CREATE INDEX idx_guardians_email ON guardians(email);

-- Indexes for analytics
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_user_type ON analytics_events(user_id, event_type);

-- Composite indexes for common queries
CREATE INDEX idx_user_profile_search ON user_profiles(gender, location_zone, year_of_birth) 
    WHERE profile_completed_at IS NOT NULL;

CREATE INDEX idx_active_users_by_location ON users(status, last_active_at) 
    WHERE status = 'active';

CREATE INDEX idx_match_participants ON matches(user_a_id, user_b_id, user_a_status, user_b_status);

-- Text search indexes
CREATE INDEX idx_profiles_bio_search ON user_profiles USING gin(to_tsvector('english', bio));
CREATE INDEX idx_profiles_profession_search ON user_profiles USING gin(to_tsvector('english', profession));

-- Performance monitoring indexes
CREATE INDEX idx_slow_queries ON pg_stat_statements(total_time DESC);

-- Partial indexes for efficiency
CREATE INDEX idx_pending_matches ON matches(user_a_id) WHERE user_a_status = 'pending';
CREATE INDEX idx_expired_matches ON matches(expires_at) WHERE expires_at < NOW();
CREATE INDEX idx_flagged_photos ON user_photos(user_id) WHERE moderation_status = 'flagged';
CREATE INDEX idx_unverified_users ON users(email) WHERE email_verified_at IS NULL;