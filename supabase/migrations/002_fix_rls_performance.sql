-- Fix RLS performance issues by using SELECT for auth functions
-- This prevents re-evaluation for each row

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles of opposite gender" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can update their own match interest" ON public.matches;
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in mutual matches" ON public.messages;

-- Recreate profiles policies with performance optimization
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view active profiles of opposite gender" ON public.profiles
  FOR SELECT USING (
    profile_active = true 
    AND (SELECT auth.uid()) != user_id
    AND gender != (SELECT gender FROM public.profiles WHERE user_id = (SELECT auth.uid()))
  );

-- Recreate matches policies with performance optimization
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = matched_user_id);

CREATE POLICY "Users can update their own match interest" ON public.matches
  FOR UPDATE USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = matched_user_id);

-- Recreate messages policies with performance optimization
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user_id = (SELECT auth.uid()) OR matches.matched_user_id = (SELECT auth.uid()))
      AND matches.mutual_match = true
    )
  );

CREATE POLICY "Users can send messages in mutual matches" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user_id = (SELECT auth.uid()) OR matches.matched_user_id = (SELECT auth.uid()))
      AND matches.mutual_match = true
    )
  );

-- Add INSERT and UPDATE policies for profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);
