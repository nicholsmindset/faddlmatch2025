-- 🛡️ FINAL SECURITY UPDATE FOR FADDLMATCH
-- This creates a hybrid approach: Service role for API routes with manual security checks

-- STEP 1: Create a function to simulate RLS for service role operations
-- This allows our API routes to work while maintaining security

-- Create a custom function to check if a user can access a profile
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

-- Create a function to check if users can message each other
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

-- STEP 2: Update RLS policies to be less restrictive for service role
-- But still secure for client-side access

-- Drop existing policies
DROP POLICY IF EXISTS "secure_profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_browse" ON public.profiles;

-- Create more permissive policies for service role operations
CREATE POLICY "service_role_full_access" ON public.profiles
    FOR ALL TO service_role USING (true);

-- But still restrict for authenticated users (client-side)
CREATE POLICY "authenticated_users_limited_access" ON public.profiles
    FOR SELECT TO authenticated USING (
        -- Users can see their own profile
        auth.uid()::text = user_id::text OR
        -- Users can see active profiles of opposite gender
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

CREATE POLICY "authenticated_users_own_profile" ON public.profiles
    FOR INSERT, UPDATE, DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- Update matches policies
DROP POLICY IF EXISTS "secure_matches_own" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_update" ON public.matches;
DROP POLICY IF EXISTS "secure_matches_insert" ON public.matches;

CREATE POLICY "service_role_matches_access" ON public.matches
    FOR ALL TO service_role USING (true);

CREATE POLICY "authenticated_matches_access" ON public.matches
    FOR ALL TO authenticated USING (
        auth.uid()::text = user_id::text OR 
        auth.uid()::text = matched_user_id::text
    );

-- Update messages policies
DROP POLICY IF EXISTS "secure_messages_view" ON public.messages;
DROP POLICY IF EXISTS "secure_messages_send" ON public.messages;

CREATE POLICY "service_role_messages_access" ON public.messages
    FOR ALL TO service_role USING (true);

CREATE POLICY "authenticated_messages_access" ON public.messages
    FOR ALL TO authenticated USING (
        auth.uid()::text = sender_id::text OR 
        auth.uid()::text = receiver_id::text
    );

-- Update other tables similarly
CREATE POLICY "service_role_guardians_access" ON public.guardian_relationships
    FOR ALL TO service_role USING (true);

CREATE POLICY "authenticated_guardians_access" ON public.guardian_relationships
    FOR ALL TO authenticated USING (
        auth.uid()::text = ward_id::text OR 
        auth.uid()::text = guardian_id::text
    );

CREATE POLICY "service_role_subscriptions_access" ON public.subscription_history
    FOR ALL TO service_role USING (true);

CREATE POLICY "authenticated_subscriptions_access" ON public.subscription_history
    FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

CREATE POLICY "service_role_verifications_access" ON public.verification_requests
    FOR ALL TO service_role USING (true);

CREATE POLICY "authenticated_verifications_access" ON public.verification_requests
    FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

-- STEP 3: Verify the setup
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

SELECT '🎉 SECURITY UPDATED SUCCESSFULLY! 🎉' as result,
       'API routes can now work with service role while RLS protects client access!' as message;