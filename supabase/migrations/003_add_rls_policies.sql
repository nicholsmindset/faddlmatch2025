-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own record" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile policies
CREATE POLICY "Users can view matched profiles" ON user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM matches
            WHERE (user_a_id = auth.uid() AND user_b_id = user_profiles.user_id)
               OR (user_b_id = auth.uid() AND user_a_id = user_profiles.user_id)
            AND user_a_status = 'mutual' AND user_b_status = 'mutual'
        ) OR
        -- Allow viewing for potential matches (browsing)
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.status = 'active'
            AND user_profiles.user_id IN (
                SELECT up.user_id FROM user_profiles up
                JOIN users u2 ON up.user_id = u2.id
                WHERE u2.status = 'active'
                AND up.profile_completed_at IS NOT NULL
            )
        )
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Partner preferences policies
CREATE POLICY "Users can manage own preferences" ON partner_preferences
    FOR ALL USING (user_id = auth.uid());

-- Photo visibility policies
CREATE POLICY "Photo visibility based on settings" ON user_photos
    FOR SELECT USING (
        user_id = auth.uid() OR
        (visibility = 'public') OR
        (visibility = 'matches' AND EXISTS (
            SELECT 1 FROM matches
            WHERE (user_a_id = auth.uid() AND user_b_id = user_photos.user_id)
               OR (user_b_id = auth.uid() AND user_a_id = user_photos.user_id)
        )) OR
        (visibility = 'approved' AND EXISTS (
            SELECT 1 FROM matches
            WHERE (user_a_id = auth.uid() AND user_b_id = user_photos.user_id)
               OR (user_b_id = auth.uid() AND user_a_id = user_photos.user_id)
            AND user_a_status = 'mutual' AND user_b_status = 'mutual'
        ))
    );

CREATE POLICY "Users can manage own photos" ON user_photos
    FOR ALL USING (user_id = auth.uid());

-- Guardian policies
CREATE POLICY "Users and guardians can view guardian info" ON guardians
    FOR SELECT USING (
        user_id = auth.uid() OR
        email = (SELECT email FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage own guardians" ON guardians
    FOR ALL USING (user_id = auth.uid());

-- Match policies
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        user_a_id = auth.uid() OR user_b_id = auth.uid()
    );

CREATE POLICY "Users can update their match status" ON matches
    FOR UPDATE USING (
        (user_a_id = auth.uid() AND 
         OLD.user_a_status = user_a_status OR 
         NEW.user_a_status IN ('mutual', 'rejected')) OR
        (user_b_id = auth.uid() AND 
         OLD.user_b_status = user_b_status OR 
         NEW.user_b_status IN ('mutual', 'rejected'))
    );

-- System can insert matches
CREATE POLICY "System can create matches" ON matches
    FOR INSERT WITH CHECK (true);

-- Conversation policies
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
            AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
            AND m.user_a_status = 'mutual' AND m.user_b_status = 'mutual'
        )
    );

CREATE POLICY "System can manage conversations" ON conversations
    FOR ALL USING (true);

-- Message policies
CREATE POLICY "Users can read own conversations" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can send messages in active conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations c
            JOIN matches m ON c.match_id = m.id
            WHERE c.id = conversation_id
            AND c.is_active = true
            AND ((m.user_a_id = auth.uid() AND m.user_b_id = recipient_id)
                OR (m.user_b_id = auth.uid() AND m.user_a_id = recipient_id))
            AND m.user_a_status = 'mutual' AND m.user_b_status = 'mutual'
        )
    );

CREATE POLICY "Users can update own message status" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Analytics policies (users can only see aggregate data, not individual events)
CREATE POLICY "Users can view own analytics" ON analytics_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Guardian access policies (special permissions for wali)
CREATE POLICY "Guardians can view ward profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guardians g
            JOIN users u ON g.email = u.email
            WHERE g.user_id = user_profiles.user_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Guardians can view ward matches" ON matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guardians g
            JOIN users u ON g.email = u.email
            WHERE (g.user_id = user_a_id OR g.user_id = user_b_id)
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Guardians can view ward messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guardians g
            JOIN users u ON g.email = u.email
            WHERE (g.user_id = sender_id OR g.user_id = recipient_id)
            AND g.can_view_messages = true
            AND u.id = auth.uid()
        )
    );

-- Admin policies (for future admin panel)
-- These will be enabled when we add admin roles
-- CREATE POLICY "Admins can view all" ON users FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Security: Prevent privilege escalation
CREATE POLICY "No privilege escalation" ON users
    FOR UPDATE USING (
        auth.uid() = id AND
        (OLD.id = NEW.id) AND
        (OLD.email = NEW.email OR OLD.email IS NULL)
    );