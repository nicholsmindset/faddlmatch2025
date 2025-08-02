-- Sample data for development and testing
-- This file creates sample users, profiles, and matches for testing

-- Sample users
INSERT INTO users (id, email, email_verified_at, status, subscription_tier, created_at, updated_at) VALUES
  ('user1', 'ahmad.hassan@example.com', NOW(), 'active', 'premium', NOW(), NOW()),
  ('user2', 'fatima.ali@example.com', NOW(), 'active', 'basic', NOW(), NOW()),
  ('user3', 'ibrahim.wong@example.com', NOW(), 'active', 'basic', NOW(), NOW()),
  ('user4', 'aisha.tan@example.com', NOW(), 'active', 'vip', NOW(), NOW()),
  ('user5', 'omar.lee@example.com', NOW(), 'active', 'basic', NOW(), NOW()),
  ('user6', 'maryam.kumar@example.com', NOW(), 'active', 'premium', NOW(), NOW()),
  ('user7', 'yusuf.chen@example.com', NOW(), 'active', 'basic', NOW(), NOW()),
  ('user8', 'zara.rahman@example.com', NOW(), 'active', 'basic', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample user profiles
INSERT INTO user_profiles (
  user_id, first_name, last_name, year_of_birth, gender, location_zone,
  marital_status, has_children, children_count, prayer_frequency, modest_dress,
  ethnicity, languages, education, profession, bio, profile_completed_at
) VALUES
  (
    'user1', 'Ahmad', 'Hassan', 1988, 'male', 'central',
    'divorced', true, 2, 'always', 'usually',
    'malay', ARRAY['English', 'Malay'], 'Bachelor''s in Engineering', 'Software Engineer',
    'Looking for a practicing Muslim sister to build a family with. I love outdoor activities and spending time with my children.',
    NOW()
  ),
  (
    'user2', 'Fatima', 'Ali', 1992, 'female', 'north',
    'divorced', true, 1, 'always', 'always',
    'malay', ARRAY['English', 'Malay', 'Arabic'], 'Master''s in Education', 'Teacher',
    'Seeking a kind and understanding brother who values family and Islamic principles.',
    NOW()
  ),
  (
    'user3', 'Ibrahim', 'Wong', 1985, 'male', 'east',
    'widowed', false, 0, 'usually', 'usually',
    'chinese', ARRAY['English', 'Mandarin'], 'Bachelor''s in Business', 'Business Analyst',
    'Recently reverted Muslim looking for a supportive partner to grow together in faith.',
    NOW()
  ),
  (
    'user4', 'Aisha', 'Tan', 1990, 'female', 'south',
    'divorced', false, 0, 'always', 'always',
    'chinese', ARRAY['English', 'Mandarin', 'Malay'], 'Master''s in Computer Science', 'Data Scientist',
    'Career-focused sister looking for an understanding partner who supports professional growth.',
    NOW()
  ),
  (
    'user5', 'Omar', 'Lee', 1987, 'male', 'west',
    'divorced', true, 3, 'usually', 'usually',
    'other', ARRAY['English', 'Korean'], 'Bachelor''s in Finance', 'Financial Advisor',
    'Father of three seeking a caring stepmother who loves children and family life.',
    NOW()
  ),
  (
    'user6', 'Maryam', 'Kumar', 1989, 'female', 'central',
    'widowed', true, 2, 'always', 'always',
    'indian', ARRAY['English', 'Tamil', 'Hindi'], 'Bachelor''s in Nursing', 'Registered Nurse',
    'Healthcare professional and devoted mother looking for a compassionate life partner.',
    NOW()
  ),
  (
    'user7', 'Yusuf', 'Chen', 1991, 'male', 'north',
    'divorced', false, 0, 'always', 'always',
    'chinese', ARRAY['English', 'Mandarin'], 'PhD in Medicine', 'Doctor',
    'Medical professional seeking an intelligent and caring partner to start a family.',
    NOW()
  ),
  (
    'user8', 'Zara', 'Rahman', 1993, 'female', 'east',
    'divorced', true, 1, 'usually', 'always',
    'indian', ARRAY['English', 'Urdu', 'Hindi'], 'Master''s in Law', 'Lawyer',
    'Legal professional and single mother looking for emotional stability and partnership.',
    NOW()
  )
ON CONFLICT (user_id) DO NOTHING;

-- Sample partner preferences
INSERT INTO partner_preferences (
  user_id, min_age, max_age, preferred_locations, top_qualities,
  min_prayer_frequency, min_modest_dress, accept_children, want_more_children
) VALUES
  (
    'user1', 28, 38, ARRAY['central', 'north']::location_zone[],
    ARRAY['Kind', 'Family-oriented', 'Practicing', 'Understanding', 'Educated'],
    'usually', 'usually', true, true
  ),
  (
    'user2', 30, 40, ARRAY['north', 'central']::location_zone[],
    ARRAY['Respectful', 'Stable', 'Good father', 'Practicing', 'Responsible'],
    'usually', 'usually', true, false
  ),
  (
    'user3', 25, 35, ARRAY['east', 'central']::location_zone[],
    ARRAY['Patient', 'Supportive', 'Practicing', 'Understanding', 'Educated'],
    'usually', 'usually', false, true
  ),
  (
    'user4', 30, 40, ARRAY['south', 'central']::location_zone[],
    ARRAY['Career-supportive', 'Educated', 'Modern thinking', 'Stable', 'Practicing'],
    'usually', 'usually', true, true
  ),
  (
    'user5', 25, 35, ARRAY['west', 'central']::location_zone[],
    ARRAY['Loves children', 'Family-oriented', 'Kind', 'Nurturing', 'Patient'],
    'usually', 'usually', false, false
  ),
  (
    'user6', 30, 42, ARRAY['central', 'north']::location_zone[],
    ARRAY['Stable', 'Kind to children', 'Responsible', 'Understanding', 'Practicing'],
    'usually', 'usually', true, false
  ),
  (
    'user7', 25, 35, ARRAY['north', 'central']::location_zone[],
    ARRAY['Intelligent', 'Family-oriented', 'Caring', 'Educated', 'Practicing'],
    'usually', 'usually', false, true
  ),
  (
    'user8', 28, 38, ARRAY['east', 'central']::location_zone[],
    ARRAY['Stable', 'Understanding', 'Good stepfather', 'Educated', 'Supportive'],
    'usually', 'usually', true, false
  )
ON CONFLICT (user_id) DO NOTHING;

-- Sample guardians
INSERT INTO guardians (
  user_id, name, relationship, email, approval_required, can_view_messages
) VALUES
  ('user2', 'Abdullah Ali', 'father', 'abdullah.ali@example.com', true, true),
  ('user4', 'Mrs. Tan Siew Lian', 'mother', 'siewlian.tan@example.com', false, false),
  ('user6', 'Dr. Kumar Selvam', 'father', 'kumar.selvam@example.com', true, true),
  ('user8', 'Imam Abdul Rahman', 'imam', 'imam.rahman@example.com', true, false)
ON CONFLICT (user_id) DO NOTHING;

-- Sample matches (ensuring user_a_id < user_b_id for consistency)
INSERT INTO matches (
  user_a_id, user_b_id, compatibility_score, score_breakdown,
  user_a_status, user_b_status, matched_at
) VALUES
  (
    'user1', 'user2', 85.5,
    '{"embedding_similarity": 34, "location_match": 20, "age_compatibility": 18, "religious_practice": 13.5}',
    'mutual', 'mutual', NOW() - INTERVAL '2 days'
  ),
  (
    'user1', 'user6', 78.2,
    '{"embedding_similarity": 31, "location_match": 20, "age_compatibility": 15, "religious_practice": 12.2}',
    'pending', 'pending', NOW() - INTERVAL '1 day'
  ),
  (
    'user3', 'user4', 92.1,
    '{"embedding_similarity": 38, "location_match": 15, "age_compatibility": 19, "religious_practice": 15, "children_compatibility": 5.1}',
    'mutual', 'pending', NOW() - INTERVAL '3 hours'
  ),
  (
    'user3', 'user8', 76.8,
    '{"embedding_similarity": 30, "location_match": 20, "age_compatibility": 16, "religious_practice": 10.8}',
    'pending', 'pending', NOW() - INTERVAL '6 hours'
  ),
  (
    'user5', 'user6', 81.3,
    '{"embedding_similarity": 32, "location_match": 15, "age_compatibility": 17, "religious_practice": 12, "children_compatibility": 5.3}',
    'rejected', 'pending', NOW() - INTERVAL '4 days'
  ),
  (
    'user7', 'user8', 88.7,
    '{"embedding_similarity": 36, "location_match": 15, "age_compatibility": 19, "religious_practice": 15, "children_compatibility": 3.7}',
    'mutual', 'mutual', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;

-- Sample conversations for mutual matches
INSERT INTO conversations (match_id, started_at, guardian_approved) 
SELECT 
  m.id, 
  m.matched_at + INTERVAL '1 hour',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM guardians g 
      WHERE g.user_id IN (m.user_a_id, m.user_b_id) 
      AND g.approval_required = true
    ) THEN false 
    ELSE true 
  END
FROM matches m 
WHERE m.user_a_status = 'mutual' AND m.user_b_status = 'mutual'
ON CONFLICT (match_id) DO NOTHING;

-- Sample messages
INSERT INTO messages (
  conversation_id, sender_id, recipient_id, content, type, sent_at, delivered_at, moderation_status
)
SELECT 
  c.id,
  m.user_a_id,
  m.user_b_id,
  'Assalamu alaikum sister/brother. I hope you are well. I would like to get to know you better in a respectful manner.',
  'text',
  c.started_at + INTERVAL '5 minutes',
  c.started_at + INTERVAL '5 minutes',
  'approved'
FROM conversations c
JOIN matches m ON c.match_id = m.id
WHERE c.is_active = true
LIMIT 3
ON CONFLICT DO NOTHING;

-- Add some reply messages
INSERT INTO messages (
  conversation_id, sender_id, recipient_id, content, type, sent_at, delivered_at, read_at, moderation_status
)
SELECT 
  c.id,
  m.user_b_id,
  m.user_a_id,
  'Wa alaikum assalam. Thank you for reaching out. I would be happy to get to know each other better as well.',
  'text',
  c.started_at + INTERVAL '2 hours',
  c.started_at + INTERVAL '2 hours',
  c.started_at + INTERVAL '3 hours',
  'approved'
FROM conversations c
JOIN matches m ON c.match_id = m.id
WHERE c.is_active = true
LIMIT 2
ON CONFLICT DO NOTHING;

-- Sample analytics events
INSERT INTO analytics_events (user_id, event_type, properties)
SELECT 
  u.id,
  'profile_view',
  jsonb_build_object('viewed_by', 'anonymous', 'timestamp', NOW() - INTERVAL '1 day')
FROM users u
WHERE u.status = 'active'
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO analytics_events (user_id, event_type, properties)
SELECT 
  u.id,
  'login',
  jsonb_build_object('method', 'email', 'timestamp', NOW() - INTERVAL '6 hours')
FROM users u
WHERE u.status = 'active'
LIMIT 8
ON CONFLICT DO NOTHING;

-- Update conversation stats
UPDATE conversations 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = conversations.id
),
message_count = (
  SELECT COUNT(*) 
  FROM messages 
  WHERE conversation_id = conversations.id
);