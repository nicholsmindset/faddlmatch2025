-- Create profiles table for Islamic matrimonial platform
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  full_name TEXT NOT NULL,
  display_name TEXT,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  location TEXT NOT NULL,
  nationality TEXT,
  ethnicity TEXT,
  
  -- Physical Attributes
  height_cm INTEGER,
  body_type TEXT,
  complexion TEXT,
  
  -- Education & Career
  education_level TEXT NOT NULL,
  field_of_study TEXT,
  profession TEXT NOT NULL,
  employment_status TEXT,
  annual_income_range TEXT,
  
  -- Religious Practice
  religious_practice_level TEXT NOT NULL CHECK (religious_practice_level IN ('very_practicing', 'practicing', 'moderate', 'learning')),
  prayer_frequency TEXT NOT NULL,
  quran_memorization TEXT,
  islamic_education TEXT,
  sect_affiliation TEXT DEFAULT 'sunni',
  
  -- Family & Background
  family_status TEXT,
  siblings_count INTEGER,
  family_values TEXT,
  living_arrangement TEXT,
  
  -- Marriage Preferences
  marital_status TEXT NOT NULL CHECK (marital_status IN ('never_married', 'divorced', 'widowed')),
  children_count INTEGER DEFAULT 0,
  wants_children BOOLEAN DEFAULT true,
  marriage_timeline TEXT,
  relocation_willing BOOLEAN DEFAULT false,
  
  -- Partner Preferences
  preferred_age_min INTEGER,
  preferred_age_max INTEGER,
  preferred_locations TEXT[],
  preferred_education_levels TEXT[],
  preferred_religious_level TEXT,
  dealbreakers TEXT[],
  
  -- Profile Details
  about_me TEXT,
  looking_for TEXT,
  hobbies_interests TEXT[],
  life_goals TEXT,
  
  -- Photos
  profile_photos TEXT[], -- URLs to uploaded photos
  photo_verification_status TEXT DEFAULT 'unverified',
  
  -- Verification & Status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  islamic_verification_status TEXT DEFAULT 'pending',
  profile_completion_percentage INTEGER DEFAULT 0,
  profile_active BOOLEAN DEFAULT true,
  
  -- Guardian (Wali) Information
  has_guardian BOOLEAN DEFAULT false,
  guardian_relationship TEXT,
  guardian_approval_required BOOLEAN DEFAULT true,
  
  -- Subscription & Features
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'platinum')),
  subscription_expires_at TIMESTAMPTZ,
  daily_matches_count INTEGER DEFAULT 0,
  total_matches_made INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_profiles_location ON public.profiles(location);
CREATE INDEX idx_profiles_age ON public.profiles(age);
CREATE INDEX idx_profiles_religious_practice ON public.profiles(religious_practice_level);
CREATE INDEX idx_profiles_active ON public.profiles(profile_active);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view active profiles of opposite gender" ON public.profiles
  FOR SELECT USING (
    profile_active = true 
    AND auth.uid() != user_id
    AND gender != (SELECT gender FROM public.profiles WHERE user_id = auth.uid())
  );

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  match_percentage INTEGER,
  match_reasons TEXT[],
  
  user_interested BOOLEAN DEFAULT false,
  matched_user_interested BOOLEAN DEFAULT false,
  mutual_match BOOLEAN DEFAULT false,
  
  guardian_approved BOOLEAN DEFAULT false,
  guardian_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, matched_user_id)
);

-- Create indexes for matches
CREATE INDEX idx_matches_user_id ON public.matches(user_id);
CREATE INDEX idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_mutual ON public.matches(mutual_match);

-- Enable RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Matches policies
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can update their own match interest" ON public.matches
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'voice_note')),
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  guardian_approved BOOLEAN DEFAULT true,
  flagged_content BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Islamic compliance
  contains_contact_info BOOLEAN DEFAULT false,
  appropriate_content BOOLEAN DEFAULT true
);

-- Create indexes for messages
CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
      AND matches.mutual_match = true
    )
  );

CREATE POLICY "Users can send messages in mutual matches" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user_id = auth.uid() OR matches.matched_user_id = auth.uid())
      AND matches.mutual_match = true
    )
  );

-- Create guardian_relationships table
CREATE TABLE IF NOT EXISTS public.guardian_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('father', 'brother', 'uncle', 'grandfather', 'imam', 'other')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_code TEXT,
  
  permissions JSONB DEFAULT '{"view_matches": true, "approve_matches": true, "view_messages": false, "send_messages": false}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  UNIQUE(ward_id, guardian_id)
);

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  plan_name TEXT NOT NULL,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'premium', 'platinum')),
  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  features JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'islamic_knowledge', 'photo', 'income')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  
  submitted_documents TEXT[],
  verification_notes TEXT,
  verified_by TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_id, verification_type)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE user_id = profile_id;
  
  -- Basic fields (5% each)
  IF profile_record.full_name IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.age IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.location IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.education_level IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.profession IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  
  -- Religious fields (5% each)
  IF profile_record.religious_practice_level IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.prayer_frequency IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  
  -- About sections (10% each)
  IF profile_record.about_me IS NOT NULL AND length(profile_record.about_me) > 50 THEN completion_score := completion_score + 10; END IF;
  IF profile_record.looking_for IS NOT NULL AND length(profile_record.looking_for) > 50 THEN completion_score := completion_score + 10; END IF;
  
  -- Photos (20%)
  IF array_length(profile_record.profile_photos, 1) > 0 THEN completion_score := completion_score + 20; END IF;
  
  -- Preferences (5% each)
  IF profile_record.preferred_age_min IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.preferred_age_max IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  IF profile_record.marriage_timeline IS NOT NULL THEN completion_score := completion_score + 5; END IF;
  
  -- Verification (5% each)
  IF profile_record.email_verified THEN completion_score := completion_score + 5; END IF;
  IF profile_record.phone_verified THEN completion_score := completion_score + 5; END IF;
  
  RETURN LEAST(completion_score, 100);
END;
$$ LANGUAGE plpgsql;
