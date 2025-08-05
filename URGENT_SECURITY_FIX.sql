-- 🚨 URGENT SECURITY FIX - ENABLE RLS ON ALL TABLES
-- Run this immediately in your Supabase SQL editor

-- Critical: Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Essential RLS Policies for immediate protection

-- 1. Profiles - Users can only see their own and potential matches
CREATE POLICY "secure_profiles_select" ON public.profiles
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Own profile
        (
            profile_active = true AND  -- Only active profiles
            user_id != auth.uid() AND  -- Not their own
            auth.uid() IS NOT NULL  -- Must be authenticated
        )
    );

CREATE POLICY "secure_profiles_update" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "secure_profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. Users table - Only own record
CREATE POLICY "secure_users_own" ON public.users
    FOR ALL USING (id = auth.uid());

-- 3. Matches - Only own matches
CREATE POLICY "secure_matches_own" ON public.matches
    FOR ALL USING (user_id = auth.uid() OR matched_user_id = auth.uid());

-- 4. Messages - Only if in mutual match
CREATE POLICY "secure_messages_mutual" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
            AND matches.mutual_match = true
        )
    );

CREATE POLICY "secure_messages_send" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
            AND matches.mutual_match = true
        )
    );

-- 5. Guardian relationships - Only for user and their guardians
CREATE POLICY "secure_guardians" ON public.guardian_relationships
    FOR ALL USING (
        user_id = auth.uid() OR
        guardian_user_id = auth.uid()
    );

-- 6. Subscriptions - Only own subscriptions
CREATE POLICY "secure_subscriptions" ON public.subscriptions
    FOR ALL USING (user_id = auth.uid());

-- 7. User photos - Based on privacy settings
CREATE POLICY "secure_photos" ON public.user_photos
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Own photos
        (
            visibility = 'public' OR
            (visibility = 'matches' AND EXISTS (
                SELECT 1 FROM public.matches
                WHERE (user_id = auth.uid() AND matched_user_id = user_photos.user_id)
                   OR (matched_user_id = auth.uid() AND user_id = user_photos.user_id)
            ))
        )
    );

CREATE POLICY "secure_photos_manage" ON public.user_photos
    FOR ALL USING (user_id = auth.uid());

-- 8. Partner preferences - Only own preferences
CREATE POLICY "secure_preferences" ON public.partner_preferences
    FOR ALL USING (user_id = auth.uid());

-- 9. Analytics - Only own events
CREATE POLICY "secure_analytics" ON public.analytics_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "secure_analytics_insert" ON public.analytics_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'users', 'matches', 'messages', 'subscriptions', 'guardian_relationships')
ORDER BY tablename;

-- Expected result: rowsecurity should be 't' (true) for all tables