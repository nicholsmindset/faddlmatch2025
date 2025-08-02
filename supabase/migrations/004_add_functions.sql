-- Function for smart matching with caching
CREATE OR REPLACE FUNCTION get_potential_matches(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    user_id UUID,
    compatibility_score DECIMAL(5,2),
    profile JSONB
) AS $$
DECLARE
    v_user_profile user_profiles%ROWTYPE;
    v_preferences partner_preferences%ROWTYPE;
BEGIN
    -- Get user profile and preferences
    SELECT * INTO v_user_profile FROM user_profiles WHERE user_profiles.user_id = p_user_id;
    SELECT * INTO v_preferences FROM partner_preferences WHERE partner_preferences.user_id = p_user_id;
    
    -- Return if user profile not found
    IF v_user_profile.user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH eligible_users AS (
        SELECT 
            up.user_id,
            up.profile_embedding,
            up.year_of_birth,
            up.location_zone,
            up.prayer_frequency,
            up.modest_dress,
            up.ethnicity,
            up.has_children,
            up.first_name,
            up.bio
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE u.status = 'active'
        AND up.user_id != p_user_id
        AND up.gender != v_user_profile.gender
        AND up.profile_completed_at IS NOT NULL
        AND EXTRACT(YEAR FROM NOW()) - up.year_of_birth BETWEEN 
            COALESCE(v_preferences.min_age, 25)
            AND COALESCE(v_preferences.max_age, 60)
        AND (v_preferences.preferred_locations IS NULL 
            OR up.location_zone = ANY(v_preferences.preferred_locations))
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.user_a_id = p_user_id AND m.user_b_id = up.user_id)
               OR (m.user_b_id = p_user_id AND m.user_a_id = up.user_id)
        )
    )
    SELECT 
        eu.user_id,
        GREATEST(0, LEAST(100,
            -- Embedding similarity (40% weight)
            COALESCE((1 - (v_user_profile.profile_embedding <=> eu.profile_embedding)) * 40, 0) +
            -- Location match (20% weight)
            CASE WHEN eu.location_zone = v_user_profile.location_zone THEN 20 ELSE 10 END +
            -- Age compatibility (20% weight)
            GREATEST(0, 20 - ABS(v_user_profile.year_of_birth - eu.year_of_birth) * 0.5) +
            -- Religious practice (15% weight)
            CASE 
                WHEN eu.prayer_frequency >= COALESCE(v_preferences.min_prayer_frequency, 'rarely') THEN 8
                ELSE 4
            END +
            CASE 
                WHEN eu.modest_dress >= COALESCE(v_preferences.min_modest_dress, 'rarely') THEN 7
                ELSE 3
            END +
            -- Children compatibility (5% weight)
            CASE 
                WHEN v_preferences.accept_children = false AND eu.has_children = true THEN -5
                WHEN v_preferences.accept_children = true AND eu.has_children = true THEN 5
                ELSE 2
            END
        ))::DECIMAL(5,2) AS compatibility_score,
        jsonb_build_object(
            'user_id', eu.user_id,
            'first_name', eu.first_name,
            'year_of_birth', eu.year_of_birth,
            'location_zone', eu.location_zone,
            'ethnicity', eu.ethnicity,
            'prayer_frequency', eu.prayer_frequency,
            'modest_dress', eu.modest_dress,
            'has_children', eu.has_children,
            'bio', COALESCE(substring(eu.bio from 1 for 150), '')
        ) AS profile
    FROM eligible_users eu
    WHERE v_user_profile.profile_embedding IS NOT NULL 
    AND eu.profile_embedding IS NOT NULL
    ORDER BY compatibility_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user last active timestamp
CREATE OR REPLACE FUNCTION update_user_last_active(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET last_active_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a match between two users
CREATE OR REPLACE FUNCTION create_match(
    p_user_a_id UUID,
    p_user_b_id UUID,
    p_compatibility_score DECIMAL(5,2),
    p_score_breakdown JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_match_id UUID;
    v_ordered_user_a UUID;
    v_ordered_user_b UUID;
BEGIN
    -- Ensure user_a_id < user_b_id for consistency
    IF p_user_a_id < p_user_b_id THEN
        v_ordered_user_a := p_user_a_id;
        v_ordered_user_b := p_user_b_id;
    ELSE
        v_ordered_user_a := p_user_b_id;
        v_ordered_user_b := p_user_a_id;
    END IF;
    
    -- Insert the match
    INSERT INTO matches (
        user_a_id,
        user_b_id,
        compatibility_score,
        score_breakdown,
        expires_at
    ) VALUES (
        v_ordered_user_a,
        v_ordered_user_b,
        p_compatibility_score,
        p_score_breakdown,
        NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO v_match_id;
    
    -- Log analytics event
    INSERT INTO analytics_events (user_id, event_type, properties)
    VALUES 
        (p_user_a_id, 'match_created', jsonb_build_object(
            'match_id', v_match_id,
            'other_user_id', p_user_b_id,
            'compatibility_score', p_compatibility_score
        )),
        (p_user_b_id, 'match_created', jsonb_build_object(
            'match_id', v_match_id,
            'other_user_id', p_user_a_id,
            'compatibility_score', p_compatibility_score
        ));
    
    RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle match responses
CREATE OR REPLACE FUNCTION respond_to_match(
    p_match_id UUID,
    p_user_id UUID,
    p_response match_status
) RETURNS BOOLEAN AS $$
DECLARE
    v_match matches%ROWTYPE;
    v_is_mutual BOOLEAN := FALSE;
    v_conversation_id UUID;
BEGIN
    -- Get the match
    SELECT * INTO v_match FROM matches WHERE id = p_match_id;
    
    IF v_match.id IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;
    
    -- Update the appropriate user's status
    IF v_match.user_a_id = p_user_id THEN
        UPDATE matches 
        SET user_a_status = p_response,
            user_a_responded_at = NOW()
        WHERE id = p_match_id;
        
        -- Check if mutual
        v_is_mutual := (p_response = 'mutual' AND v_match.user_b_status = 'mutual');
        
    ELSIF v_match.user_b_id = p_user_id THEN
        UPDATE matches 
        SET user_b_status = p_response,
            user_b_responded_at = NOW()
        WHERE id = p_match_id;
        
        -- Check if mutual
        v_is_mutual := (p_response = 'mutual' AND v_match.user_a_status = 'mutual');
        
    ELSE
        RAISE EXCEPTION 'User not part of this match';
    END IF;
    
    -- If mutual match, create conversation
    IF v_is_mutual THEN
        INSERT INTO conversations (match_id)
        VALUES (p_match_id)
        RETURNING id INTO v_conversation_id;
        
        -- Log mutual match events
        INSERT INTO analytics_events (user_id, event_type, properties)
        VALUES 
            (v_match.user_a_id, 'mutual_match', jsonb_build_object(
                'match_id', p_match_id,
                'other_user_id', v_match.user_b_id,
                'conversation_id', v_conversation_id
            )),
            (v_match.user_b_id, 'mutual_match', jsonb_build_object(
                'match_id', p_match_id,
                'other_user_id', v_match.user_a_id,
                'conversation_id', v_conversation_id
            ));
    END IF;
    
    -- Log response event
    INSERT INTO analytics_events (user_id, event_type, properties)
    VALUES (p_user_id, 'match_response', jsonb_build_object(
        'match_id', p_match_id,
        'response', p_response,
        'is_mutual', v_is_mutual
    ));
    
    RETURN v_is_mutual;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_recipient_id UUID,
    p_content TEXT,
    p_type message_type DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- Insert the message
    INSERT INTO messages (
        conversation_id,
        sender_id,
        recipient_id,
        content,
        type,
        metadata
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_recipient_id,
        p_content,
        p_type,
        p_metadata
    )
    RETURNING id INTO v_message_id;
    
    -- Update conversation
    UPDATE conversations 
    SET last_message_at = NOW(),
        message_count = message_count + 1
    WHERE id = p_conversation_id;
    
    -- Log analytics
    INSERT INTO analytics_events (user_id, event_type, properties)
    VALUES (p_sender_id, 'message_sent', jsonb_build_object(
        'conversation_id', p_conversation_id,
        'message_id', v_message_id,
        'recipient_id', p_recipient_id,
        'message_type', p_type
    ));
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_conversation_id UUID,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE messages 
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
    AND recipient_id = p_user_id
    AND read_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Log analytics if messages were read
    IF v_count > 0 THEN
        INSERT INTO analytics_events (user_id, event_type, properties)
        VALUES (p_user_id, 'messages_read', jsonb_build_object(
            'conversation_id', p_conversation_id,
            'count', v_count
        ));
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired matches
CREATE OR REPLACE FUNCTION cleanup_expired_matches()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE matches 
    SET user_a_status = 'expired',
        user_b_status = 'expired'
    WHERE expires_at < NOW()
    AND user_a_status = 'pending'
    AND user_b_status = 'pending';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
    total_matches INTEGER,
    mutual_matches INTEGER,
    pending_matches INTEGER,
    messages_sent INTEGER,
    messages_received INTEGER,
    avg_compatibility_score DECIMAL(5,2),
    profile_views INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT m.id)::INTEGER as total_matches,
        COUNT(DISTINCT CASE WHEN m.user_a_status = 'mutual' AND m.user_b_status = 'mutual' THEN m.id END)::INTEGER as mutual_matches,
        COUNT(DISTINCT CASE WHEN m.user_a_status = 'pending' OR m.user_b_status = 'pending' THEN m.id END)::INTEGER as pending_matches,
        COUNT(DISTINCT msg_sent.id)::INTEGER as messages_sent,
        COUNT(DISTINCT msg_received.id)::INTEGER as messages_received,
        AVG(m.compatibility_score) as avg_compatibility_score,
        COUNT(DISTINCT ae.id)::INTEGER as profile_views
    FROM users u
    LEFT JOIN matches m ON u.id IN (m.user_a_id, m.user_b_id)
    LEFT JOIN messages msg_sent ON u.id = msg_sent.sender_id
    LEFT JOIN messages msg_received ON u.id = msg_received.recipient_id
    LEFT JOIN analytics_events ae ON u.id = ae.user_id AND ae.event_type = 'profile_view'
    WHERE u.id = p_user_id
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_table_name TEXT;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        v_start_date := date_trunc('month', CURRENT_DATE + INTERVAL '1 month' * i);
        v_end_date := v_start_date + INTERVAL '1 month';
        
        -- Create users partition
        v_table_name := 'users_' || to_char(v_start_date, 'YYYY_MM');
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF users FOR VALUES FROM (%L) TO (%L)', 
                      v_table_name, v_start_date, v_end_date);
        
        -- Create messages partition
        v_table_name := 'messages_' || to_char(v_start_date, 'YYYY_MM');
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF messages FOR VALUES FROM (%L) TO (%L)', 
                      v_table_name, v_start_date, v_end_date);
        
        -- Create analytics partition
        v_table_name := 'analytics_events_' || to_char(v_start_date, 'YYYY_MM');
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF analytics_events FOR VALUES FROM (%L) TO (%L)', 
                      v_table_name, v_start_date, v_end_date);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;