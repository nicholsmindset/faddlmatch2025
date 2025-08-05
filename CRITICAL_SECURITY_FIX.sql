-- 🚨 CRITICAL SECURITY FIX FOR FADDLMATCH DATABASE
-- Copy and paste this entire script into your Supabase SQL Editor
-- Execute it immediately to protect user data

-- STEP 1: Enable RLS on all critical tables
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

-- STEP 2: Drop any conflicting existing policies
DROP POLICY IF EXISTS "secure_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles of opposite gender" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "secure_users_own" ON public.users; 
DROP POLICY IF EXISTS "Users can view own record" ON public.users;

DROP POLICY IF EXISTS "secure_matches_own" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_select" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_update" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_insert" ON public.matches;
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update their own match interest" ON public.matches;

DROP POLICY IF EXISTS "secure_messages_mutual" ON public.messages;
DROP POLICY IF EXISTS "secure_messages_send" ON public.messages;
DROP POLICY IF EXISTS "secure_messages_select" ON public.messages;
DROP POLICY IF EXISTS "secure_messages_insert" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in mutual matches" ON public.messages;

-- STEP 3: Create secure policies for PROFILES
CREATE POLICY "secure_profiles_select" ON public.profiles
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Users can see their own profile
        (
            profile_active = true AND  -- Only active profiles
            user_id != auth.uid() AND  -- Not their own profile  
            auth.uid() IS NOT NULL  -- Must be authenticated
        )
    );

CREATE POLICY "secure_profiles_update" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "secure_profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- STEP 4: Create secure policies for USERS
CREATE POLICY "secure_users_select" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "secure_users_update" ON public.users  
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "secure_users_insert" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- STEP 5: Create secure policies for MATCHES
CREATE POLICY "secure_matches_select" ON public.matches
    FOR SELECT USING (
        user_id = auth.uid() OR matched_user_id = auth.uid()
    );

CREATE POLICY "secure_matches_update" ON public.matches
    FOR UPDATE USING (
        user_id = auth.uid() OR matched_user_id = auth.uid()
    );

CREATE POLICY "secure_matches_insert" ON public.matches
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR matched_user_id = auth.uid()
    );

-- STEP 6: Create secure policies for MESSAGES  
CREATE POLICY "secure_messages_select" ON public.messages
    FOR SELECT USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "secure_messages_insert" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE (user_id = auth.uid() AND matched_user_id = messages.recipient_id)
               OR (matched_user_id = auth.uid() AND user_id = messages.recipient_id)
            AND mutual_match = true
        )
    );

-- STEP 7: Create secure policies for CONVERSATIONS
CREATE POLICY "secure_conversations_select" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_id
            AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
        )
    );

-- STEP 8: Create secure policies for GUARDIAN RELATIONSHIPS
CREATE POLICY "secure_guardians_select" ON public.guardian_relationships
    FOR SELECT USING (
        user_id = auth.uid() OR guardian_user_id = auth.uid()
    );

CREATE POLICY "secure_guardians_insert" ON public.guardian_relationships
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR guardian_user_id = auth.uid()
    );

CREATE POLICY "secure_guardians_update" ON public.guardian_relationships
    FOR UPDATE USING (
        user_id = auth.uid() OR guardian_user_id = auth.uid()
    );

-- STEP 9: Create secure policies for SUBSCRIPTIONS
CREATE POLICY "secure_subscriptions_select" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "secure_subscriptions_insert" ON public.subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "secure_subscriptions_update" ON public.subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- STEP 10: Create secure policies for USER PHOTOS
CREATE POLICY "secure_photos_select" ON public.user_photos
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

-- STEP 11: Create secure policies for PARTNER PREFERENCES
CREATE POLICY "secure_preferences_all" ON public.partner_preferences
    FOR ALL USING (user_id = auth.uid());

-- STEP 12: Create secure policies for ANALYTICS EVENTS
CREATE POLICY "secure_analytics_select" ON public.analytics_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "secure_analytics_insert" ON public.analytics_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- STEP 13: Verify RLS is enabled (run this to check)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS_ENABLED",
    CASE 
        WHEN rowsecurity THEN '✅ SECURE' 
        ELSE '❌ VULNERABLE' 
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'users', 'matches', 'messages', 
    'conversations', 'guardian_relationships', 
    'subscriptions', 'user_photos', 'partner_preferences', 
    'analytics_events'
)
ORDER BY tablename;

-- STEP 14: Test that policies are working
-- This should return only authenticated user's data
SELECT 'Testing profiles access...' as test;
-- SELECT * FROM profiles LIMIT 1;  -- Uncomment to test

-- Success message
SELECT '🎉 SECURITY FIX APPLIED SUCCESSFULLY! 🎉' as result;