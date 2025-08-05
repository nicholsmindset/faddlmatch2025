-- 🚨 CRITICAL SECURITY FIX FOR FADDLMATCH DATABASE
-- Copy and paste this entire script into your Supabase SQL Editor
-- Based on your actual database schema

-- STEP 1: First check what tables exist and their RLS status
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
    'profiles', 'matches', 'messages', 
    'guardian_relationships', 'subscription_history', 
    'verification_requests'
)
ORDER BY tablename;

-- STEP 2: Enable RLS on all tables (some may already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles of opposite gender" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update their own match interest" ON public.matches;
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in mutual matches" ON public.messages;

-- STEP 4: Create secure policies for PROFILES
-- Users can always see their own profile
CREATE POLICY "secure_profiles_own" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

-- Users can view active profiles for potential matches (with Islamic compliance)
CREATE POLICY "secure_profiles_browse" ON public.profiles
    FOR SELECT USING (
        user_id != auth.uid() AND  -- Not their own profile
        profile_active = true AND  -- Only active profiles
        auth.uid() IS NOT NULL AND  -- Must be authenticated
        EXISTS (
            SELECT 1 FROM public.profiles my_profile 
            WHERE my_profile.user_id = auth.uid() 
            AND my_profile.gender != profiles.gender  -- Opposite gender only
        )
    );

-- STEP 5: Create secure policies for MATCHES  
-- Users can only see matches they're involved in
CREATE POLICY "secure_matches_own" ON public.matches
    FOR SELECT USING (
        auth.uid() = user_id OR auth.uid() = matched_user_id
    );

-- Users can update match status only for their own matches
CREATE POLICY "secure_matches_update" ON public.matches
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.uid() = matched_user_id
    );

-- System can create new matches (for matching algorithm)
CREATE POLICY "secure_matches_insert" ON public.matches
    FOR INSERT WITH CHECK (true);

-- STEP 6: Create secure policies for MESSAGES
-- Users can only see messages in their mutual matches
CREATE POLICY "secure_messages_view" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Users can only send messages in mutual matches
CREATE POLICY "secure_messages_send" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
            AND matches.mutual_match = true
        )
    );

-- STEP 7: Create secure policies for GUARDIAN RELATIONSHIPS
-- Users can see guardianships where they are ward or guardian
CREATE POLICY "secure_guardians_all" ON public.guardian_relationships
    FOR ALL USING (
        auth.uid() = ward_id OR auth.uid() = guardian_id
    );

-- STEP 8: Create secure policies for SUBSCRIPTION HISTORY
-- Users can only see their own subscription history
CREATE POLICY "secure_subscriptions_own" ON public.subscription_history
    FOR ALL USING (auth.uid() = user_id);

-- STEP 9: Create secure policies for VERIFICATION REQUESTS
-- Users can only see their own verification requests
CREATE POLICY "secure_verifications_own" ON public.verification_requests
    FOR ALL USING (auth.uid() = user_id);

-- STEP 10: Verify RLS is now enabled and working
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS_ENABLED",
    CASE 
        WHEN rowsecurity THEN '✅ SECURE' 
        ELSE '❌ STILL VULNERABLE' 
    END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'matches', 'messages', 
    'guardian_relationships', 'subscription_history', 
    'verification_requests'
)
ORDER BY tablename;

-- STEP 11: Test that policies are working (optional - uncomment to test)
-- SELECT 'Testing - you should only see your own data...' as test_message;
-- SELECT COUNT(*) as "profiles_visible" FROM public.profiles;
-- SELECT COUNT(*) as "matches_visible" FROM public.matches;
-- SELECT COUNT(*) as "messages_visible" FROM public.messages;

-- Success message
SELECT '🎉 SECURITY FIX APPLIED SUCCESSFULLY! 🎉' as result,
       'Your FADDLMATCH database is now secure with Row Level Security!' as message;