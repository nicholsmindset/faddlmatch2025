-- Performance enhancements for Series C scale
-- Materialized views, additional functions, and monitoring tables

-- Materialized view for user discovery with pre-calculated compatibility
CREATE MATERIALIZED VIEW user_discovery_cache AS
SELECT 
    up.user_id,
    up.gender,
    up.location_zone,
    up.year_of_birth,
    EXTRACT(YEAR FROM NOW()) - up.year_of_birth as current_age,
    up.prayer_frequency,
    up.modest_dress,
    up.ethnicity,
    up.has_children,
    up.children_count,
    up.languages,
    up.profession,
    up.profile_embedding,
    up.values_embedding,
    up.profile_completed_at,
    u.status,
    u.subscription_tier,
    u.last_active_at,
    -- Pre-calculate some common filters
    CASE WHEN u.last_active_at > NOW() - INTERVAL '7 days' THEN true ELSE false END as recently_active,
    CASE WHEN up.profile_completed_at IS NOT NULL THEN true ELSE false END as profile_complete,
    -- Photo availability
    EXISTS(SELECT 1 FROM user_photos WHERE user_id = up.user_id AND moderation_status = 'approved') as has_approved_photos
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE u.status = 'active'
AND up.profile_completed_at IS NOT NULL;

-- Index on materialized view for fast lookups
CREATE INDEX idx_discovery_gender_location ON user_discovery_cache(gender, location_zone);
CREATE INDEX idx_discovery_age_range ON user_discovery_cache(current_age);
CREATE INDEX idx_discovery_active ON user_discovery_cache(recently_active) WHERE recently_active = true;
CREATE INDEX idx_discovery_embedding ON user_discovery_cache USING ivfflat (profile_embedding vector_cosine_ops);
CREATE INDEX idx_discovery_values ON user_discovery_cache USING ivfflat (values_embedding vector_cosine_ops);

-- Match statistics materialized view for analytics
CREATE MATERIALIZED VIEW match_statistics AS
SELECT 
    DATE_TRUNC('day', matched_at) as match_date,
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE user_a_status = 'mutual' AND user_b_status = 'mutual') as mutual_matches,
    COUNT(*) FILTER (WHERE user_a_status = 'rejected' OR user_b_status = 'rejected') as rejected_matches,
    COUNT(*) FILTER (WHERE user_a_status = 'pending' OR user_b_status = 'pending') as pending_matches,
    AVG(compatibility_score) as avg_compatibility_score,
    AVG(EXTRACT(EPOCH FROM (COALESCE(user_a_responded_at, user_b_responded_at) - matched_at))/3600) as avg_response_time_hours
FROM matches
WHERE matched_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', matched_at);

CREATE INDEX idx_match_stats_date ON match_statistics(match_date);

-- Performance monitoring table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit TEXT NOT NULL,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
) PARTITION BY RANGE (measured_at);

-- Create performance metrics partitions
CREATE TABLE performance_metrics_2024_08 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE performance_metrics_2024_09 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE performance_metrics_2024_10 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE performance_metrics_2024_11 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE performance_metrics_2024_12 PARTITION OF performance_metrics
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE performance_metrics_2025_01 PARTITION OF performance_metrics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name, measured_at);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(measured_at);

-- Function to refresh materialized views efficiently
CREATE OR REPLACE FUNCTION refresh_discovery_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_discovery_cache;
    REFRESH MATERIALIZED VIEW CONCURRENTLY match_statistics;
    
    -- Log performance metric
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, metadata)
    VALUES ('cache_refresh_duration', EXTRACT(EPOCH FROM NOW() - NOW()), 'seconds', 
            jsonb_build_object('cache_type', 'discovery_and_stats'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION log_performance_metric(
    p_metric_name TEXT,
    p_metric_value DECIMAL(10,4),
    p_metric_unit TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS void AS $$
BEGIN
    INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, metadata)
    VALUES (p_metric_name, p_metric_value, p_metric_unit, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Advanced matching function with caching and pagination
CREATE OR REPLACE FUNCTION get_advanced_matches(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_min_score DECIMAL(5,2) DEFAULT 60.0,
    p_filters JSONB DEFAULT '{}'
) RETURNS TABLE (
    user_id UUID,
    compatibility_score DECIMAL(5,2),
    profile JSONB,
    match_reasons JSONB
) AS $$
DECLARE
    v_user_profile user_profiles%ROWTYPE;
    v_preferences partner_preferences%ROWTYPE;
    v_user_gender gender;
    v_start_time TIMESTAMPTZ;
BEGIN
    v_start_time := NOW();
    
    -- Get user profile and preferences
    SELECT * INTO v_user_profile FROM user_profiles WHERE user_profiles.user_id = p_user_id;
    SELECT * INTO v_preferences FROM partner_preferences WHERE partner_preferences.user_id = p_user_id;
    
    IF v_user_profile.user_id IS NULL THEN
        RETURN;
    END IF;
    
    v_user_gender := CASE WHEN v_user_profile.gender = 'male' THEN 'female' ELSE 'male' END;
    
    RETURN QUERY
    WITH filtered_users AS (
        SELECT 
            udc.*
        FROM user_discovery_cache udc
        WHERE udc.gender = v_user_gender
        AND udc.user_id != p_user_id
        AND udc.profile_complete = true
        AND udc.recently_active = true
        AND udc.current_age BETWEEN 
            COALESCE(v_preferences.min_age, 25)
            AND COALESCE(v_preferences.max_age, 60)
        AND (v_preferences.preferred_locations IS NULL 
            OR udc.location_zone = ANY(v_preferences.preferred_locations))
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.user_a_id = p_user_id AND m.user_b_id = udc.user_id)
               OR (m.user_b_id = p_user_id AND m.user_a_id = udc.user_id)
        )
        -- Apply additional filters from p_filters JSONB
        AND (p_filters->>'ethnicity' IS NULL OR udc.ethnicity = (p_filters->>'ethnicity')::ethnicity)
        AND (p_filters->>'has_children' IS NULL OR udc.has_children = (p_filters->>'has_children')::boolean)
        AND (p_filters->>'min_prayer_frequency' IS NULL OR udc.prayer_frequency >= (p_filters->>'min_prayer_frequency')::prayer_frequency)
    ),
    scored_users AS (
        SELECT 
            fu.user_id,
            GREATEST(0, LEAST(100,
                -- Embedding similarity (40% weight)
                COALESCE((1 - (v_user_profile.profile_embedding <=> fu.profile_embedding)) * 40, 0) +
                -- Location match (20% weight)
                CASE WHEN fu.location_zone = v_user_profile.location_zone THEN 20 ELSE 10 END +
                -- Age compatibility (20% weight)
                GREATEST(0, 20 - ABS(v_user_profile.year_of_birth - (EXTRACT(YEAR FROM NOW()) - fu.current_age)) * 0.5) +
                -- Religious practice (15% weight)
                CASE 
                    WHEN fu.prayer_frequency >= COALESCE(v_preferences.min_prayer_frequency, 'rarely') THEN 8
                    ELSE 4
                END +
                CASE 
                    WHEN fu.modest_dress >= COALESCE(v_preferences.min_modest_dress, 'rarely') THEN 7
                    ELSE 3
                END +
                -- Children compatibility (5% weight)
                CASE 
                    WHEN v_preferences.accept_children = false AND fu.has_children = true THEN -5
                    WHEN v_preferences.accept_children = true AND fu.has_children = true THEN 5
                    ELSE 2
                END +
                -- Activity bonus (recent activity gets boost)
                CASE WHEN fu.last_active_at > NOW() - INTERVAL '24 hours' THEN 3 ELSE 0 END +
                -- Photo bonus
                CASE WHEN fu.has_approved_photos THEN 2 ELSE 0 END
            ))::DECIMAL(5,2) AS compatibility_score,
            fu.*
        FROM filtered_users fu
        WHERE v_user_profile.profile_embedding IS NOT NULL 
        AND fu.profile_embedding IS NOT NULL
    )
    SELECT 
        su.user_id,
        su.compatibility_score,
        jsonb_build_object(
            'user_id', su.user_id,
            'first_name', (SELECT first_name FROM user_profiles WHERE user_id = su.user_id),
            'current_age', su.current_age,
            'location_zone', su.location_zone,
            'ethnicity', su.ethnicity,
            'prayer_frequency', su.prayer_frequency,
            'modest_dress', su.modest_dress,
            'has_children', su.has_children,
            'children_count', su.children_count,
            'languages', su.languages,
            'profession', su.profession,
            'subscription_tier', su.subscription_tier,
            'last_active_at', su.last_active_at,
            'has_photos', su.has_approved_photos
        ) AS profile,
        jsonb_build_object(
            'location_match', CASE WHEN su.location_zone = v_user_profile.location_zone THEN true ELSE false END,
            'age_compatible', ABS(v_user_profile.year_of_birth - (EXTRACT(YEAR FROM NOW()) - su.current_age)) <= 5,
            'religious_compatible', su.prayer_frequency >= COALESCE(v_preferences.min_prayer_frequency, 'rarely'),
            'children_compatible', CASE 
                WHEN v_preferences.accept_children = false AND su.has_children = true THEN false
                ELSE true
            END,
            'recently_active', su.recently_active,
            'has_photos', su.has_approved_photos
        ) AS match_reasons
    FROM scored_users su
    WHERE su.compatibility_score >= p_min_score
    ORDER BY su.compatibility_score DESC, su.last_active_at DESC
    LIMIT p_limit OFFSET p_offset;
    
    -- Log performance metric
    PERFORM log_performance_metric(
        'advanced_matching_duration',
        EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'seconds',
        jsonb_build_object(
            'user_id', p_user_id,
            'limit', p_limit,
            'offset', p_offset,
            'min_score', p_min_score,
            'filters_applied', p_filters
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for bulk match generation (for match generation jobs)
CREATE OR REPLACE FUNCTION generate_bulk_matches(
    p_batch_size INTEGER DEFAULT 100,
    p_min_score DECIMAL(5,2) DEFAULT 70.0
) RETURNS INTEGER AS $$
DECLARE
    v_match_count INTEGER := 0;
    v_user_record RECORD;
    v_potential_matches RECORD;
    v_start_time TIMESTAMPTZ;
BEGIN
    v_start_time := NOW();
    
    -- Process active users who haven't had matches generated recently
    FOR v_user_record IN 
        SELECT u.id as user_id
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        WHERE u.status = 'active'
        AND up.profile_completed_at IS NOT NULL
        AND u.last_active_at > NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM matches m 
            WHERE (m.user_a_id = u.id OR m.user_b_id = u.id)
            AND m.matched_at > NOW() - INTERVAL '24 hours'
        )
        ORDER BY u.last_active_at DESC
        LIMIT p_batch_size
    LOOP
        -- Generate matches for this user
        FOR v_potential_matches IN
            SELECT user_id, compatibility_score
            FROM get_advanced_matches(v_user_record.user_id, 5, 0, p_min_score)
        LOOP
            -- Create the match
            PERFORM create_match(
                v_user_record.user_id,
                v_potential_matches.user_id,
                v_potential_matches.compatibility_score,
                jsonb_build_object('generated_at', NOW(), 'algorithm_version', '2.0')
            );
            
            v_match_count := v_match_count + 1;
        END LOOP;
    END LOOP;
    
    -- Log performance metric
    PERFORM log_performance_metric(
        'bulk_match_generation',
        v_match_count,
        'matches_created',
        jsonb_build_object(
            'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
            'batch_size', p_batch_size,
            'min_score', p_min_score
        )
    );
    
    RETURN v_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard statistics
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
    pending_matches_count INTEGER,
    mutual_matches_count INTEGER,
    unread_messages_count INTEGER,
    profile_views_today INTEGER,
    profile_completion_score INTEGER,
    recent_activity JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Pending matches (where user hasn't responded)
        (SELECT COUNT(*)::INTEGER 
         FROM matches m 
         WHERE ((m.user_a_id = p_user_id AND m.user_a_status = 'pending') 
                OR (m.user_b_id = p_user_id AND m.user_b_status = 'pending'))
         AND m.expires_at > NOW()) as pending_matches_count,
         
        -- Mutual matches
        (SELECT COUNT(*)::INTEGER 
         FROM matches m 
         WHERE (m.user_a_id = p_user_id OR m.user_b_id = p_user_id)
         AND m.user_a_status = 'mutual' AND m.user_b_status = 'mutual') as mutual_matches_count,
         
        -- Unread messages
        (SELECT COUNT(*)::INTEGER 
         FROM messages msg
         WHERE msg.recipient_id = p_user_id 
         AND msg.read_at IS NULL) as unread_messages_count,
         
        -- Profile views today
        (SELECT COUNT(*)::INTEGER 
         FROM analytics_events ae 
         WHERE ae.properties->>'profile_viewed' = p_user_id::text
         AND ae.event_type = 'profile_view'
         AND ae.created_at > CURRENT_DATE) as profile_views_today,
         
        -- Profile completion score (out of 100)
        (SELECT 
            CASE 
                WHEN up.first_name IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN up.bio IS NOT NULL AND LENGTH(up.bio) > 50 THEN 20 ELSE 0 END +
                CASE WHEN up.profession IS NOT NULL THEN 15 ELSE 0 END +
                CASE WHEN up.education IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN EXISTS(SELECT 1 FROM user_photos WHERE user_id = p_user_id AND moderation_status = 'approved') THEN 25 ELSE 0 END +
                CASE WHEN EXISTS(SELECT 1 FROM partner_preferences WHERE user_id = p_user_id) THEN 20 ELSE 0 END
         FROM user_profiles up WHERE up.user_id = p_user_id) as profile_completion_score,
         
        -- Recent activity summary
        (SELECT jsonb_build_object(
            'matches_this_week', COUNT(*) FILTER (WHERE ae.event_type = 'match_created' AND ae.created_at > NOW() - INTERVAL '7 days'),
            'messages_this_week', COUNT(*) FILTER (WHERE ae.event_type = 'message_sent' AND ae.created_at > NOW() - INTERVAL '7 days'),
            'profile_views_this_week', COUNT(*) FILTER (WHERE ae.event_type = 'profile_view' AND ae.created_at > NOW() - INTERVAL '7 days'),
            'last_active', MAX(ae.created_at)
         ) 
         FROM analytics_events ae 
         WHERE ae.user_id = p_user_id 
         AND ae.created_at > NOW() - INTERVAL '30 days') as recent_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create unique indexes to support concurrent refresh of materialized views
CREATE UNIQUE INDEX ON user_discovery_cache (user_id);
CREATE UNIQUE INDEX ON match_statistics (match_date);

-- Schedule regular refresh of materialized views (to be called by cron job)
CREATE OR REPLACE FUNCTION scheduled_cache_maintenance()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views
    PERFORM refresh_discovery_cache();
    
    -- Clean up old performance metrics (keep last 30 days)
    DELETE FROM performance_metrics 
    WHERE measured_at < NOW() - INTERVAL '30 days';
    
    -- Clean up expired matches
    PERFORM cleanup_expired_matches();
    
    -- Update user activity status
    UPDATE users 
    SET status = 'inactive' 
    WHERE status = 'active' 
    AND last_active_at < NOW() - INTERVAL '90 days';
    
    -- Log maintenance completion
    PERFORM log_performance_metric(
        'scheduled_maintenance_completed',
        1,
        'boolean',
        jsonb_build_object('timestamp', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;