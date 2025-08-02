-- Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables that need it
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_preferences_updated_at 
    BEFORE UPDATE ON partner_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update user last_active when they interact with the system
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active_at = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if last_active update fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply last_active trigger to key interaction tables
CREATE TRIGGER update_last_active_on_match_response
    AFTER UPDATE ON matches
    FOR EACH ROW
    WHEN (OLD.user_a_status != NEW.user_a_status OR OLD.user_b_status != NEW.user_b_status)
    EXECUTE FUNCTION update_last_active();

-- Trigger for message delivery status
CREATE OR REPLACE FUNCTION update_message_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark as delivered immediately
    NEW.delivered_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_delivered
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_delivery();

-- Trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        message_count = message_count + 1
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_stats
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Trigger to validate match constraints
CREATE OR REPLACE FUNCTION validate_match_constraints()
RETURNS TRIGGER AS $$
DECLARE
    v_user_a_profile user_profiles%ROWTYPE;
    v_user_b_profile user_profiles%ROWTYPE;
BEGIN
    -- Get user profiles
    SELECT * INTO v_user_a_profile FROM user_profiles WHERE user_id = NEW.user_a_id;
    SELECT * INTO v_user_b_profile FROM user_profiles WHERE user_id = NEW.user_b_id;
    
    -- Validate users exist and have different genders
    IF v_user_a_profile.user_id IS NULL OR v_user_b_profile.user_id IS NULL THEN
        RAISE EXCEPTION 'Both users must have profiles';
    END IF;
    
    IF v_user_a_profile.gender = v_user_b_profile.gender THEN
        RAISE EXCEPTION 'Users must have different genders';
    END IF;
    
    -- Validate users are active
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_a_id AND status = 'active') OR
       NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_b_id AND status = 'active') THEN
        RAISE EXCEPTION 'Both users must be active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_match_before_insert
    BEFORE INSERT ON matches
    FOR EACH ROW EXECUTE FUNCTION validate_match_constraints();

-- Trigger to prevent messaging outside of active conversations
CREATE OR REPLACE FUNCTION validate_message_constraints()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation conversations%ROWTYPE;
    v_match matches%ROWTYPE;
BEGIN
    -- Get conversation and match details
    SELECT * INTO v_conversation FROM conversations WHERE id = NEW.conversation_id;
    
    IF v_conversation.id IS NULL THEN
        RAISE EXCEPTION 'Conversation not found';
    END IF;
    
    IF NOT v_conversation.is_active THEN
        RAISE EXCEPTION 'Cannot send messages in inactive conversation';
    END IF;
    
    -- Get the match
    SELECT * INTO v_match FROM matches WHERE id = v_conversation.match_id;
    
    -- Validate users are part of the match and it's mutual
    IF v_match.user_a_status != 'mutual' OR v_match.user_b_status != 'mutual' THEN
        RAISE EXCEPTION 'Can only message in mutual matches';
    END IF;
    
    IF NEW.sender_id NOT IN (v_match.user_a_id, v_match.user_b_id) OR
       NEW.recipient_id NOT IN (v_match.user_a_id, v_match.user_b_id) THEN
        RAISE EXCEPTION 'Users must be part of the match';
    END IF;
    
    IF NEW.sender_id = NEW.recipient_id THEN
        RAISE EXCEPTION 'Cannot send message to yourself';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_message_before_insert
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION validate_message_constraints();

-- Trigger to enforce photo limits
CREATE OR REPLACE FUNCTION enforce_photo_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_photo_count INTEGER;
BEGIN
    -- Count existing photos for user
    SELECT COUNT(*) INTO v_photo_count 
    FROM user_photos 
    WHERE user_id = NEW.user_id;
    
    -- Limit to 6 photos per user
    IF v_photo_count >= 6 THEN
        RAISE EXCEPTION 'Maximum 6 photos allowed per user';
    END IF;
    
    -- If setting as primary, unset other primary photos
    IF NEW.is_primary THEN
        UPDATE user_photos 
        SET is_primary = false 
        WHERE user_id = NEW.user_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_photo_limits_on_insert
    BEFORE INSERT ON user_photos
    FOR EACH ROW EXECUTE FUNCTION enforce_photo_limits();

CREATE TRIGGER enforce_photo_limits_on_update
    BEFORE UPDATE ON user_photos
    FOR EACH ROW EXECUTE FUNCTION enforce_photo_limits();

-- Trigger to log important events for analytics
CREATE OR REPLACE FUNCTION log_analytics_events()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_profiles' AND TG_OP = 'UPDATE' THEN
        -- Log profile completion
        IF OLD.profile_completed_at IS NULL AND NEW.profile_completed_at IS NOT NULL THEN
            INSERT INTO analytics_events (user_id, event_type, properties)
            VALUES (NEW.user_id, 'profile_completed', jsonb_build_object('timestamp', NEW.profile_completed_at));
        END IF;
    END IF;
    
    IF TG_TABLE_NAME = 'user_photos' AND TG_OP = 'INSERT' THEN
        -- Log photo upload
        INSERT INTO analytics_events (user_id, event_type, properties)
        VALUES (NEW.user_id, 'photo_uploaded', jsonb_build_object(
            'photo_id', NEW.id,
            'is_primary', NEW.is_primary,
            'visibility', NEW.visibility
        ));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_profile_events
    AFTER UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_analytics_events();

CREATE TRIGGER log_photo_events
    AFTER INSERT ON user_photos
    FOR EACH ROW EXECUTE FUNCTION log_analytics_events();

-- Trigger to automatically create monthly partitions
CREATE OR REPLACE FUNCTION schedule_partition_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Create partitions when we're near the end of the month
    IF EXTRACT(DAY FROM NOW()) >= 25 THEN
        PERFORM create_monthly_partitions();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This will run when new users are created near month end
CREATE TRIGGER auto_create_partitions
    AFTER INSERT ON users
    FOR EACH STATEMENT EXECUTE FUNCTION schedule_partition_creation();

-- Trigger for guardian approval workflow
CREATE OR REPLACE FUNCTION handle_guardian_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_guardian guardians%ROWTYPE;
BEGIN
    -- Check if user has guardian approval requirement
    SELECT * INTO v_guardian 
    FROM guardians 
    WHERE user_id = NEW.user_a_id OR user_id = NEW.user_b_id
    AND approval_required = true;
    
    -- If guardian approval is required, don't auto-create conversation
    IF v_guardian.user_id IS NOT NULL AND NEW.user_a_status = 'mutual' AND NEW.user_b_status = 'mutual' THEN
        -- Create conversation but mark as needing guardian approval
        INSERT INTO conversations (match_id, guardian_approved)
        VALUES (NEW.id, false);
        
        -- Log event for guardian notification
        INSERT INTO analytics_events (user_id, event_type, properties)
        VALUES (v_guardian.user_id, 'guardian_approval_needed', jsonb_build_object(
            'match_id', NEW.id,
            'guardian_id', v_guardian.id
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_guardian_workflow
    AFTER UPDATE ON matches
    FOR EACH ROW 
    WHEN (OLD.user_a_status != NEW.user_a_status OR OLD.user_b_status != NEW.user_b_status)
    EXECUTE FUNCTION handle_guardian_approval();

-- Trigger to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired matches (older than 60 days)
    DELETE FROM matches 
    WHERE expires_at < NOW() - INTERVAL '60 days'
    AND user_a_status = 'expired' 
    AND user_b_status = 'expired';
    
    -- Clean up old analytics events (older than 2 years)
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Clean up old unverified users (older than 30 days)
    DELETE FROM users 
    WHERE email_verified_at IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;