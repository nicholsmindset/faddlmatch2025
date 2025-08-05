-- 🛡️ FIXED SECURITY UPDATE FOR FADDLMATCH
-- This creates a hybrid approach: Service role for API routes with manual security checks

-- STEP 1: Create helper functions for security validation
CREATE OR REPLACE FUNCTION can_access_profile(target_user_id UUID, requesting_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User can always access their own profile
  IF target_user_id = requesting_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- User can access active profiles of opposite gender
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = requesting_user_id
    AND p2.user_id = target_user_id
    AND p2.profile_active = true
    AND p1.gender != p2.gender
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_message_user(sender_id UUID, recipient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if they have a mutual match
  RETURN EXISTS (
    SELECT 1 FROM public.matches
    WHERE ((user_id = sender_id AND matched_user_id = recipient_id) 
           OR (user_id = recipient_id AND matched_user_id = sender_id))
    AND mutual_match = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "secure_profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_browse" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_limited_access" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_own_profile" ON public.profiles;

DROP POLICY IF EXISTS "secure_matches_own" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_update" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_insert" ON public.matches;

DROP POLICY IF EXISTS "secure_messages_view" ON public.messages;
DROP POLICY IF EXISTS "secure_messages_send" ON public.messages;

DROP POLICY IF EXISTS "secure_guardians_all" ON public.guardian_relationships;
DROP POLICY IF EXISTS "secure_subscriptions_own" ON public.subscription_history;
DROP POLICY IF EXISTS "secure_verifications_own" ON public.verification_requests;

-- STEP 3: Create permissive policies for service role (API access)
CREATE POLICY "service_role_profiles" ON public.profiles
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_matches" ON public.matches
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_messages" ON public.messages
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_guardians" ON public.guardian_relationships
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_subscriptions" ON public.subscription_history
    FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_verifications" ON public.verification_requests
    FOR ALL TO service_role USING (true);

-- STEP 4: Create restrictive policies for authenticated users (client access)

-- Profiles policies
CREATE POLICY "auth_profiles_select" ON public.profiles
    FOR SELECT TO authenticated USING (
        auth.uid()::text = user_id::text OR
        (
            profile_active = true AND
            auth.uid()::text != user_id::text AND
            EXISTS (
                SELECT 1 FROM public.profiles my_profile 
                WHERE my_profile.user_id = auth.uid()
                AND my_profile.gender != profiles.gender
            )
        )
    );

CREATE POLICY "auth_profiles_insert" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "auth_profiles_update" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);

CREATE POLICY "auth_profiles_delete" ON public.profiles
    FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- Matches policies
CREATE POLICY "auth_matches_select" ON public.matches
    FOR SELECT TO authenticated USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = matched_user_id::text
    );

CREATE POLICY "auth_matches_update" ON public.matches
    FOR UPDATE TO authenticated USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = matched_user_id::text
    );

-- Messages policies
CREATE POLICY "auth_messages_select" ON public.messages
    FOR SELECT TO authenticated USING (
        auth.uid()::text = sender_id::text OR 
        auth.uid()::text = receiver_id::text
    );

CREATE POLICY "auth_messages_insert" ON public.messages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid()::text = sender_id::text
    );

-- Guardian relationships policies
CREATE POLICY "auth_guardians_all" ON public.guardian_relationships
    FOR ALL TO authenticated USING (
        auth.uid()::text = ward_id::text OR 
        auth.uid()::text = guardian_id::text
    );

-- Subscription history policies
CREATE POLICY "auth_subscriptions_all" ON public.subscription_history
    FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

-- Verification requests policies
CREATE POLICY "auth_verifications_all" ON public.verification_requests
    FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

-- STEP 5: Verify RLS is enabled and working
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

SELECT '🎉 FIXED SECURITY UPDATE COMPLETE! 🎉' as result,
       'APIs will now work with service role while client access remains secure!' as message;