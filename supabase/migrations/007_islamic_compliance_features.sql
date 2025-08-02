-- Enhanced Islamic compliance features for FADDL Match
-- Additional Islamic practice tracking, family oversight, and cultural sensitivity features

-- Extended Islamic practice tracking
CREATE TABLE islamic_practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prayer and worship
    prayer_frequency prayer_frequency NOT NULL,
    mosque_attendance TEXT CHECK (mosque_attendance IN ('regularly', 'occasionally', 'rarely', 'never')),
    quran_reading TEXT CHECK (quran_reading IN ('daily', 'weekly', 'monthly', 'occasionally')),
    islamic_knowledge_level TEXT CHECK (islamic_knowledge_level IN ('beginner', 'intermediate', 'advanced', 'scholar')),
    
    -- Social practices
    modest_dress prayer_frequency NOT NULL,
    gender_interaction_comfort TEXT CHECK (gender_interaction_comfort IN ('very_comfortable', 'comfortable', 'cautious', 'minimal')),
    family_involvement_preference TEXT CHECK (family_involvement_preference IN ('high', 'moderate', 'low', 'minimal')),
    
    -- Lifestyle
    halal_diet_strictness TEXT CHECK (halal_diet_strictness IN ('very_strict', 'strict', 'moderate', 'flexible')),
    alcohol_tolerance TEXT CHECK (alcohol_tolerance IN ('none', 'social_only', 'personal_choice')),
    
    -- Community and culture
    community_involvement TEXT CHECK (community_involvement IN ('very_active', 'active', 'moderate', 'minimal')),
    cultural_traditions_importance TEXT CHECK (cultural_traditions_importance IN ('very_important', 'important', 'moderate', 'flexible')),
    
    -- Marriage specific
    nikah_preference TEXT CHECK (nikah_preference IN ('traditional', 'modern', 'mixed', 'flexible')),
    mahr_discussion_comfort TEXT CHECK (mahr_discussion_comfort IN ('comfortable', 'guided', 'family_involved', 'traditional')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Family approval workflow table
CREATE TABLE family_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_discussion')),
    approval_notes TEXT,
    concerns JSONB DEFAULT '{}',
    
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(match_id, guardian_id)
);

-- Cultural preferences and requirements
CREATE TABLE cultural_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Language preferences
    primary_language TEXT NOT NULL,
    secondary_languages TEXT[],
    language_importance TEXT CHECK (language_importance IN ('critical', 'important', 'preferred', 'flexible')),
    
    -- Cultural practices
    cultural_events_participation TEXT CHECK (cultural_events_participation IN ('always', 'often', 'sometimes', 'rarely')),
    traditional_dress_occasions TEXT CHECK (traditional_dress_occasions IN ('all', 'religious', 'family', 'special', 'never')),
    food_preferences JSONB DEFAULT '{}',
    
    -- Family structure preferences
    extended_family_closeness TEXT CHECK (extended_family_closeness IN ('very_close', 'close', 'moderate', 'independent')),
    in_law_relationship_expectation TEXT CHECK (in_law_relationship_expectation IN ('very_close', 'respectful', 'cordial', 'minimal')),
    
    -- Religious observance in family
    family_religious_practices JSONB DEFAULT '{}',
    children_islamic_education_plan TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Communication guidelines and monitoring
CREATE TABLE communication_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Communication preferences
    preferred_communication_style TEXT CHECK (preferred_communication_style IN ('formal', 'respectful', 'friendly', 'casual')),
    topics_comfortable_discussing JSONB DEFAULT '{}',
    topics_prefer_to_avoid JSONB DEFAULT '{}',
    
    -- Supervision preferences
    guardian_supervision_required BOOLEAN DEFAULT false,
    family_member_presence_preferred BOOLEAN DEFAULT false,
    conversation_monitoring_consent BOOLEAN DEFAULT false,
    
    -- Meeting preferences
    first_meeting_preference TEXT CHECK (first_meeting_preference IN ('family_present', 'public_place', 'video_call', 'phone_call')),
    ongoing_meeting_comfort TEXT CHECK (ongoing_meeting_comfort IN ('family_supervised', 'public_only', 'flexible', 'private')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Halal communication monitoring
CREATE TABLE message_moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    
    flagged_reason TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    auto_flagged BOOLEAN DEFAULT true,
    
    -- Moderation details
    moderator_id UUID,
    moderation_decision TEXT CHECK (moderation_decision IN ('approved', 'edited', 'blocked', 'warning_sent')),
    moderation_notes TEXT,
    edited_content TEXT,
    
    -- Tracking
    flagged_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Guardian notification
    guardian_notified BOOLEAN DEFAULT false,
    guardian_notified_at TIMESTAMPTZ
);

-- Islamic calendar events and matching consideration
CREATE TABLE islamic_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ramadan', 'hajj', 'eid', 'friday_prayer', 'religious_holiday')),
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Impact on matching and communication
    affects_matching BOOLEAN DEFAULT false,
    affects_communication BOOLEAN DEFAULT false,
    recommended_actions JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer time integration for communication timing
CREATE TABLE prayer_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_zone location_zone NOT NULL,
    prayer_date DATE NOT NULL,
    
    fajr_time TIME NOT NULL,
    sunrise_time TIME NOT NULL,
    dhuhr_time TIME NOT NULL,
    asr_time TIME NOT NULL,
    maghrib_time TIME NOT NULL,
    isha_time TIME NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(location_zone, prayer_date)
);

-- Indexes for Islamic compliance features
CREATE INDEX idx_islamic_practices_user ON islamic_practices(user_id);
CREATE INDEX idx_islamic_practices_prayer ON islamic_practices(prayer_frequency, mosque_attendance);
CREATE INDEX idx_family_approvals_match ON family_approvals(match_id, guardian_id);
CREATE INDEX idx_family_approvals_status ON family_approvals(status, expires_at);
CREATE INDEX idx_cultural_preferences_user ON cultural_preferences(user_id);
CREATE INDEX idx_cultural_language ON cultural_preferences(primary_language);
CREATE INDEX idx_communication_guidelines_user ON communication_guidelines(user_id);
CREATE INDEX idx_moderation_queue_severity ON message_moderation_queue(severity, flagged_at);
CREATE INDEX idx_moderation_queue_unresolved ON message_moderation_queue(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_islamic_events_dates ON islamic_events(start_date, end_date);
CREATE INDEX idx_prayer_times_location_date ON prayer_times(location_zone, prayer_date);

-- Function to check Islamic compliance before creating matches
CREATE OR REPLACE FUNCTION check_islamic_compatibility(
    p_user_a_id UUID,
    p_user_b_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_user_a_practices islamic_practices%ROWTYPE;
    v_user_b_practices islamic_practices%ROWTYPE;
    v_user_a_cultural cultural_preferences%ROWTYPE;
    v_user_b_cultural cultural_preferences%ROWTYPE;
    v_compatibility_score INTEGER := 0;
    v_compatibility_details JSONB := '{}';
BEGIN
    -- Get Islamic practices for both users
    SELECT * INTO v_user_a_practices FROM islamic_practices WHERE user_id = p_user_a_id;
    SELECT * INTO v_user_b_practices FROM islamic_practices WHERE user_id = p_user_b_id;
    
    -- Get cultural preferences
    SELECT * INTO v_user_a_cultural FROM cultural_preferences WHERE user_id = p_user_a_id;
    SELECT * INTO v_user_b_cultural FROM cultural_preferences WHERE user_id = p_user_b_id;
    
    -- Check prayer frequency compatibility (25 points)
    IF v_user_a_practices.prayer_frequency = v_user_b_practices.prayer_frequency THEN
        v_compatibility_score := v_compatibility_score + 25;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('prayer_frequency', 'perfect_match');
    ELSIF ABS(
        CASE v_user_a_practices.prayer_frequency WHEN 'always' THEN 3 WHEN 'usually' THEN 2 ELSE 1 END -
        CASE v_user_b_practices.prayer_frequency WHEN 'always' THEN 3 WHEN 'usually' THEN 2 ELSE 1 END
    ) = 1 THEN
        v_compatibility_score := v_compatibility_score + 15;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('prayer_frequency', 'compatible');
    ELSE
        v_compatibility_details := v_compatibility_details || jsonb_build_object('prayer_frequency', 'needs_discussion');
    END IF;
    
    -- Check modesty compatibility (20 points)
    IF v_user_a_practices.modest_dress = v_user_b_practices.modest_dress THEN
        v_compatibility_score := v_compatibility_score + 20;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('modesty', 'aligned');
    ELSIF ABS(
        CASE v_user_a_practices.modest_dress WHEN 'always' THEN 3 WHEN 'usually' THEN 2 ELSE 1 END -
        CASE v_user_b_practices.modest_dress WHEN 'always' THEN 3 WHEN 'usually' THEN 2 ELSE 1 END
    ) = 1 THEN
        v_compatibility_score := v_compatibility_score + 12;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('modesty', 'compatible');
    END IF;
    
    -- Check cultural compatibility (20 points)
    IF v_user_a_cultural.primary_language = v_user_b_cultural.primary_language THEN
        v_compatibility_score := v_compatibility_score + 15;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('language', 'same_primary');
    ELSIF v_user_a_cultural.primary_language = ANY(v_user_b_cultural.secondary_languages) OR
          v_user_b_cultural.primary_language = ANY(v_user_a_cultural.secondary_languages) THEN
        v_compatibility_score := v_compatibility_score + 10;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('language', 'common_language');
    END IF;
    
    -- Check family involvement compatibility (15 points)
    IF v_user_a_practices.family_involvement_preference = v_user_b_practices.family_involvement_preference THEN
        v_compatibility_score := v_compatibility_score + 15;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('family_involvement', 'aligned');
    END IF;
    
    -- Check halal lifestyle compatibility (10 points)
    IF v_user_a_practices.halal_diet_strictness = v_user_b_practices.halal_diet_strictness THEN
        v_compatibility_score := v_compatibility_score + 10;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('halal_lifestyle', 'aligned');
    END IF;
    
    -- Check nikah preference compatibility (10 points)
    IF v_user_a_practices.nikah_preference = v_user_b_practices.nikah_preference OR
       v_user_a_practices.nikah_preference = 'flexible' OR v_user_b_practices.nikah_preference = 'flexible' THEN
        v_compatibility_score := v_compatibility_score + 10;
        v_compatibility_details := v_compatibility_details || jsonb_build_object('nikah_preference', 'compatible');
    END IF;
    
    RETURN jsonb_build_object(
        'compatibility_score', v_compatibility_score,
        'max_possible_score', 100,
        'compatibility_percentage', (v_compatibility_score::DECIMAL / 100 * 100),
        'details', v_compatibility_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if communication is appropriate based on Islamic guidelines
CREATE OR REPLACE FUNCTION validate_islamic_communication(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_content TEXT,
    p_type message_type DEFAULT 'text'
) RETURNS JSONB AS $$
DECLARE
    v_sender_guidelines communication_guidelines%ROWTYPE;
    v_recipient_guidelines communication_guidelines%ROWTYPE;
    v_validation_result JSONB := '{"approved": true, "warnings": []}';
    v_warnings JSONB := '[]';
    v_match_exists BOOLEAN := false;
BEGIN
    -- Check if users have an active mutual match
    SELECT EXISTS(
        SELECT 1 FROM matches m
        JOIN conversations c ON m.id = c.match_id
        WHERE ((m.user_a_id = p_sender_id AND m.user_b_id = p_recipient_id) OR
               (m.user_b_id = p_sender_id AND m.user_a_id = p_recipient_id))
        AND m.user_a_status = 'mutual' AND m.user_b_status = 'mutual'
        AND c.is_active = true
        AND c.guardian_approved = true
    ) INTO v_match_exists;
    
    IF NOT v_match_exists THEN
        RETURN jsonb_build_object(
            'approved', false,
            'reason', 'no_active_mutual_match',
            'warnings', '["Communication only allowed between mutually matched users with guardian approval"]'
        );
    END IF;
    
    -- Get communication guidelines
    SELECT * INTO v_sender_guidelines FROM communication_guidelines WHERE user_id = p_sender_id;
    SELECT * INTO v_recipient_guidelines FROM communication_guidelines WHERE user_id = p_recipient_id;
    
    -- Check for inappropriate content (basic keyword filtering)
    IF p_content ~* '\b(meet\s+alone|private\s+meeting|without\s+family|secret)\b' THEN
        v_warnings := v_warnings || '["Message contains concerning phrases about private meetings"]';
    END IF;
    
    IF p_content ~* '\b(love|romance|dating|girlfriend|boyfriend)\b' THEN
        v_warnings := v_warnings || '["Message contains non-Islamic relationship terminology"]';
    END IF;
    
    -- Check message timing against prayer times
    IF EXTRACT(hour FROM NOW()) BETWEEN 5 AND 7 OR  -- Fajr time
       EXTRACT(hour FROM NOW()) BETWEEN 12 AND 14 OR -- Dhuhr time
       EXTRACT(hour FROM NOW()) BETWEEN 15 AND 17 OR -- Asr time
       EXTRACT(hour FROM NOW()) BETWEEN 18 AND 20 OR -- Maghrib time
       EXTRACT(hour FROM NOW()) BETWEEN 20 AND 22 THEN -- Isha time
        v_warnings := v_warnings || '["Message sent during typical prayer times - recipient may be unavailable"]';
    END IF;
    
    -- Check if guardian supervision is required
    IF (v_sender_guidelines.guardian_supervision_required OR v_recipient_guidelines.guardian_supervision_required) THEN
        v_warnings := v_warnings || '["Guardian supervision required - message will be shared with guardian"]';
    END IF;
    
    RETURN jsonb_build_object(
        'approved', true,
        'warnings', v_warnings,
        'guardian_notification_required', 
        (v_sender_guidelines.guardian_supervision_required OR v_recipient_guidelines.guardian_supervision_required),
        'moderation_level', CASE 
            WHEN jsonb_array_length(v_warnings) = 0 THEN 'none'
            WHEN jsonb_array_length(v_warnings) <= 2 THEN 'low'
            ELSE 'medium'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Islamic calendar context for matching
CREATE OR REPLACE FUNCTION get_current_islamic_context()
RETURNS JSONB AS $$
DECLARE
    v_current_events islamic_events%ROWTYPE;
    v_context JSONB := '{}';
BEGIN
    -- Check for current Islamic events
    SELECT * INTO v_current_events 
    FROM islamic_events 
    WHERE start_date <= CURRENT_DATE 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND affects_matching = true
    ORDER BY start_date DESC
    LIMIT 1;
    
    IF v_current_events.id IS NOT NULL THEN
        v_context := jsonb_build_object(
            'active_event', v_current_events.event_name,
            'event_type', v_current_events.event_type,
            'matching_affected', v_current_events.affects_matching,
            'communication_affected', v_current_events.affects_communication,
            'recommendations', v_current_events.recommended_actions
        );
    END IF;
    
    -- Add prayer times context for today
    v_context := v_context || jsonb_build_object(
        'prayer_times_available', EXISTS(
            SELECT 1 FROM prayer_times 
            WHERE prayer_date = CURRENT_DATE
        ),
        'current_date', CURRENT_DATE,
        'islamic_day_of_week', EXTRACT(dow FROM CURRENT_DATE)
    );
    
    RETURN v_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate Islamic communication guidelines
CREATE OR REPLACE FUNCTION enforce_islamic_communication()
RETURNS TRIGGER AS $$
DECLARE
    v_validation_result JSONB;
BEGIN
    -- Validate the message content
    SELECT validate_islamic_communication(
        NEW.sender_id,
        NEW.recipient_id,
        NEW.content,
        NEW.type
    ) INTO v_validation_result;
    
    IF NOT (v_validation_result->>'approved')::boolean THEN
        RAISE EXCEPTION 'Message violates Islamic communication guidelines: %', 
            v_validation_result->>'reason';
    END IF;
    
    -- Set moderation status based on validation
    NEW.moderation_status := CASE 
        WHEN v_validation_result->>'moderation_level' = 'none' THEN 'approved'
        WHEN v_validation_result->>'moderation_level' = 'low' THEN 'approved'
        ELSE 'pending'
    END;
    
    -- Queue for human moderation if needed
    IF NEW.moderation_status = 'pending' THEN
        INSERT INTO message_moderation_queue (
            message_id, 
            flagged_reason, 
            severity,
            guardian_notified
        ) VALUES (
            NEW.id,
            'islamic_guidelines_review',
            CASE v_validation_result->>'moderation_level'
                WHEN 'medium' THEN 'medium'
                WHEN 'high' THEN 'high'
                ELSE 'low'
            END,
            (v_validation_result->>'guardian_notification_required')::boolean
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_islamic_communication_trigger
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION enforce_islamic_communication();

-- Enable RLS on new tables
ALTER TABLE islamic_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_moderation_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for Islamic compliance tables
CREATE POLICY "Users can view own Islamic practices" ON islamic_practices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own Islamic practices" ON islamic_practices
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Guardians can view family approvals" ON family_approvals
    FOR SELECT USING (
        guardian_id IN (
            SELECT id FROM guardians WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
            AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
        )
    );

CREATE POLICY "Guardians can manage family approvals" ON family_approvals
    FOR ALL USING (
        guardian_id IN (
            SELECT id FROM guardians WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own cultural preferences" ON cultural_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cultural preferences" ON cultural_preferences
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own communication guidelines" ON communication_guidelines
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own communication guidelines" ON communication_guidelines
    FOR ALL USING (user_id = auth.uid());

-- Moderation queue access restricted to moderators and involved users
CREATE POLICY "Users can view own message moderation" ON message_moderation_queue
    FOR SELECT USING (
        message_id IN (
            SELECT id FROM messages 
            WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
        )
    );