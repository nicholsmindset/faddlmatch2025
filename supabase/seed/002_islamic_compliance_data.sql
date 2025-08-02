-- Enhanced seed data for Islamic compliance features
-- This includes Islamic practices, cultural preferences, and family oversight data

-- Sample Islamic practices for existing users
INSERT INTO islamic_practices (
    user_id, prayer_frequency, mosque_attendance, quran_reading, islamic_knowledge_level,
    modest_dress, gender_interaction_comfort, family_involvement_preference,
    halal_diet_strictness, alcohol_tolerance, community_involvement, cultural_traditions_importance,
    nikah_preference, mahr_discussion_comfort
) VALUES
    (
        'user1', 'always', 'regularly', 'daily', 'intermediate',
        'usually', 'comfortable', 'high',
        'strict', 'none', 'active', 'very_important',
        'traditional', 'family_involved'
    ),
    (
        'user2', 'always', 'regularly', 'daily', 'intermediate',
        'always', 'cautious', 'high',
        'very_strict', 'none', 'very_active', 'very_important',
        'traditional', 'comfortable'
    ),
    (
        'user3', 'usually', 'occasionally', 'weekly', 'beginner',
        'usually', 'comfortable', 'moderate',
        'moderate', 'none', 'moderate', 'important',
        'modern', 'guided'
    ),
    (
        'user4', 'always', 'regularly', 'daily', 'advanced',
        'always', 'comfortable', 'moderate',
        'strict', 'none', 'active', 'important',
        'mixed', 'comfortable'
    ),
    (
        'user5', 'usually', 'occasionally', 'weekly', 'intermediate',
        'usually', 'comfortable', 'high',
        'moderate', 'social_only', 'moderate', 'moderate',
        'flexible', 'family_involved'
    ),
    (
        'user6', 'always', 'regularly', 'daily', 'intermediate',
        'always', 'cautious', 'high',
        'strict', 'none', 'active', 'very_important',
        'traditional', 'traditional'
    ),
    (
        'user7', 'always', 'regularly', 'daily', 'advanced',
        'always', 'comfortable', 'moderate',
        'very_strict', 'none', 'very_active', 'important',
        'mixed', 'comfortable'
    ),
    (
        'user8', 'usually', 'regularly', 'weekly', 'intermediate',
        'usually', 'comfortable', 'high',
        'strict', 'none', 'active', 'important',
        'modern', 'guided'
    )
ON CONFLICT (user_id) DO NOTHING;

-- Sample cultural preferences
INSERT INTO cultural_preferences (
    user_id, primary_language, secondary_languages, language_importance,
    cultural_events_participation, traditional_dress_occasions, food_preferences,
    extended_family_closeness, in_law_relationship_expectation,
    family_religious_practices, children_islamic_education_plan
) VALUES
    (
        'user1', 'Malay', ARRAY['English', 'Arabic'], 'important',
        'often', 'religious', '{"dietary_restrictions": ["halal_only"], "favorite_cuisines": ["malay", "middle_eastern"]}',
        'close', 'respectful',
        '{"family_prayers": true, "ramadan_together": true, "eid_celebrations": "traditional"}',
        'Islamic school and weekend madrasah'
    ),
    (
        'user2', 'Malay', ARRAY['English', 'Arabic', 'Jawi'], 'critical',
        'always', 'all', '{"dietary_restrictions": ["halal_certified_only"], "cooking_skills": ["traditional_malay", "middle_eastern"]}',
        'very_close', 'very_close',
        '{"daily_family_prayers": true, "quran_recitation": "weekly", "islamic_discussions": true}',
        'Traditional Islamic education with Arabic language'
    ),
    (
        'user3', 'English', ARRAY['Mandarin', 'Malay'], 'preferred',
        'sometimes', 'religious', '{"dietary_restrictions": ["halal_when_possible"], "learning": ["islamic_cooking"]}',
        'moderate', 'respectful',
        '{"learning_together": true, "mosque_attendance": "family_unit"}',
        'Balanced Islamic and secular education'
    ),
    (
        'user4', 'English', ARRAY['Mandarin', 'Malay'], 'important',
        'often', 'special', '{"dietary_restrictions": ["halal_certified"], "professional_dining": "halal_options"}',
        'close', 'respectful',
        '{"career_balance": true, "islamic_values": "professional_life"}',
        'Modern Islamic school with STEM focus'
    ),
    (
        'user5', 'Korean', ARRAY['English', 'Malay'], 'flexible',
        'sometimes', 'religious', '{"dietary_restrictions": ["halal_meat"], "cultural_fusion": ["korean_halal"]}',
        'moderate', 'cordial',
        '{"multicultural_islamic": true, "respect_all_cultures": true}',
        'Multicultural Islamic environment'
    ),
    (
        'user6', 'Tamil', ARRAY['English', 'Hindi', 'Malay'], 'important',
        'often', 'religious', '{"dietary_restrictions": ["halal_vegetarian_options"], "traditional_cooking": ["south_indian_halal"]}',
        'very_close', 'close',
        '{"traditional_islamic_tamil": true, "cultural_preservation": true}',
        'Tamil Islamic heritage with modern education'
    ),
    (
        'user7', 'English', ARRAY['Mandarin', 'Arabic'], 'important',
        'often', 'religious', '{"dietary_restrictions": ["halal_certified"], "medical_dietary": ["nutritious_halal"]}',
        'close', 'respectful',
        '{"educated_islamic_discussions": true, "medical_ethics": "islamic_principles"}',
        'Strong Islamic foundation with academic excellence'
    ),
    (
        'user8', 'English', ARRAY['Urdu', 'Hindi'], 'preferred',
        'often', 'family', '{"dietary_restrictions": ["halal_only"], "professional_events": ["halal_catering"]}',
        'close', 'respectful',
        '{"legal_islamic_ethics": true, "community_service": "islamic_values"}',
        'Islamic education with focus on social justice'
    )
ON CONFLICT (user_id) DO NOTHING;

-- Sample communication guidelines
INSERT INTO communication_guidelines (
    user_id, preferred_communication_style, topics_comfortable_discussing, topics_prefer_to_avoid,
    guardian_supervision_required, family_member_presence_preferred, conversation_monitoring_consent,
    first_meeting_preference, ongoing_meeting_comfort
) VALUES
    (
        'user1', 'respectful',
        '["family_values", "career_goals", "islamic_practices", "children_upbringing", "future_plans"]',
        '["past_relationships", "intimate_topics", "financial_details_early"]',
        false, false, true,
        'public_place', 'flexible'
    ),
    (
        'user2', 'formal',
        '["islamic_knowledge", "family_traditions", "education", "community_involvement"]',
        '["casual_topics", "informal_discussions", "modern_dating_concepts"]',
        true, true, true,
        'family_present', 'family_supervised'
    ),
    (
        'user3', 'friendly',
        '["learning_islam", "career_transition", "new_muslim_experience", "cultural_adaptation"]',
        '["complex_islamic_rulings", "family_pressure_topics"]',
        false, false, true,
        'video_call', 'public_only'
    ),
    (
        'user4', 'respectful',
        '["career_ambitions", "modern_muslim_woman", "balancing_work_family", "education"]',
        '["traditional_gender_roles_debate", "career_limitations"]',
        false, false, false,
        'public_place', 'flexible'
    ),
    (
        'user5', 'casual',
        '["multicultural_family", "children_from_previous_marriage", "blended_families", "cultural_fusion"]',
        '["past_marriage_details", "financial_struggles"]',
        false, true, true,
        'public_place', 'public_only'
    ),
    (
        'user6', 'respectful',
        '["healthcare_career", "single_motherhood", "community_service", "traditional_values"]',
        '["deceased_husband_details", "grief_processing"]',
        true, true, true,
        'family_present', 'family_supervised'
    ),
    (
        'user7', 'formal',
        '["medical_career", "islamic_ethics_medicine", "family_planning", "education"]',
        '["patient_confidentiality_cases", "medical_personal_details"]',
        false, false, true,
        'public_place', 'flexible'
    ),
    (
        'user8', 'respectful',
        '["legal_career", "social_justice", "single_parenting", "work_life_balance"]',
        '["legal_case_details", "past_relationship_trauma"]',
        false, true, true,
        'public_place', 'public_only'
    )
ON CONFLICT (user_id) DO NOTHING;

-- Sample family approvals for existing matches
INSERT INTO family_approvals (match_id, guardian_id, status, approval_notes)
SELECT 
    m.id,
    g.id,
    CASE 
        WHEN m.user_a_status = 'mutual' AND m.user_b_status = 'mutual' THEN 'approved'
        WHEN m.user_a_status = 'pending' OR m.user_b_status = 'pending' THEN 'pending'
        ELSE 'needs_discussion'
    END,
    CASE 
        WHEN m.user_a_status = 'mutual' AND m.user_b_status = 'mutual' THEN 'Good match, family values align well'
        ELSE 'Need more time to assess compatibility'
    END
FROM matches m
JOIN guardians g ON (g.user_id = m.user_a_id OR g.user_id = m.user_b_id)
WHERE g.approval_required = true
ON CONFLICT (match_id, guardian_id) DO NOTHING;

-- Sample Islamic calendar events
INSERT INTO islamic_events (event_name, event_type, start_date, end_date, affects_matching, affects_communication, recommended_actions)
VALUES
    ('Ramadan 2024', 'ramadan', '2024-03-11', '2024-04-09', true, true, 
     '{"matching": "reduced_activity", "communication": "respectful_timing", "focus": "spiritual_growth"}'),
    ('Eid al-Fitr 2024', 'eid', '2024-04-10', '2024-04-12', false, true,
     '{"communication": "celebratory_messages", "meetings": "family_focused"}'),
    ('Hajj Season 2024', 'hajj', '2024-06-14', '2024-06-19', true, false,
     '{"matching": "spiritual_focus", "respect": "pilgrimage_participants"}'),
    ('Eid al-Adha 2024', 'eid', '2024-06-16', '2024-06-19', false, true,
     '{"communication": "family_greetings", "meetings": "celebration_consideration"}'),
    ('Muharram 2024', 'religious_holiday', '2024-07-07', '2024-07-07', false, true,
     '{"communication": "respectful_tone", "reflection": "new_islamic_year"}'),
    ('Mawlid an-Nabi 2024', 'religious_holiday', '2024-09-15', '2024-09-16', false, true,
     '{"communication": "prophetic_teachings", "meetings": "spiritual_focus"}')
ON CONFLICT DO NOTHING;

-- Sample prayer times for different location zones (Singapore/Malaysia context)
INSERT INTO prayer_times (location_zone, prayer_date, fajr_time, sunrise_time, dhuhr_time, asr_time, maghrib_time, isha_time)
VALUES
    -- North (Johor Bahru area)
    ('north', CURRENT_DATE, '05:45', '07:05', '13:15', '16:30', '19:25', '20:35'),
    ('north', CURRENT_DATE + 1, '05:45', '07:05', '13:15', '16:30', '19:25', '20:35'),
    
    -- South (Singapore area)  
    ('south', CURRENT_DATE, '05:50', '07:10', '13:20', '16:35', '19:30', '20:40'),
    ('south', CURRENT_DATE + 1, '05:50', '07:10', '13:20', '16:35', '19:30', '20:40'),
    
    -- East (Eastern Singapore/Johor)
    ('east', CURRENT_DATE, '05:48', '07:08', '13:18', '16:33', '19:28', '20:38'),
    ('east', CURRENT_DATE + 1, '05:48', '07:08', '13:18', '16:33', '19:28', '20:38'),
    
    -- West (Western Singapore/Johor)
    ('west', CURRENT_DATE, '05:52', '07:12', '13:22', '16:37', '19:32', '20:42'),
    ('west', CURRENT_DATE + 1, '05:52', '07:12', '13:22', '16:37', '19:32', '20:42'),
    
    -- Central (Central Singapore/KL)
    ('central', CURRENT_DATE, '05:49', '07:09', '13:19', '16:34', '19:29', '20:39'),
    ('central', CURRENT_DATE + 1, '05:49', '07:09', '13:19', '16:34', '19:29', '20:39')
ON CONFLICT (location_zone, prayer_date) DO NOTHING;

-- Sample performance metrics
INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, metadata)
VALUES
    ('average_match_generation_time', 150.5, 'milliseconds', '{"algorithm_version": "2.0", "batch_size": 100}'),
    ('database_query_time_p95', 45.2, 'milliseconds', '{"query_type": "complex_match_search"}'),
    ('user_discovery_cache_hit_ratio', 89.5, 'percentage', '{"cache_type": "materialized_view"}'),
    ('message_moderation_queue_size', 12, 'count', '{"priority": "medium_and_above"}'),
    ('active_users_last_24h', 1250, 'count', '{"subscription_breakdown": {"basic": 800, "premium": 350, "vip": 100}}'),
    ('match_success_rate', 23.5, 'percentage', '{"timeframe": "last_30_days", "definition": "mutual_matches"}'),
    ('islamic_compliance_score', 96.8, 'percentage', '{"criteria": "communication_guidelines_adherence"}')
ON CONFLICT DO NOTHING;

-- Create some sample moderation queue entries for testing
INSERT INTO message_moderation_queue (message_id, flagged_reason, severity, auto_flagged, moderator_id, moderation_decision, moderation_notes)
SELECT 
    m.id,
    'islamic_guidelines_review',
    'low',
    true,
    NULL,
    NULL,
    'Automatic flag for review - contains meeting suggestion'
FROM messages m
WHERE m.content ILIKE '%meet%'
LIMIT 2
ON CONFLICT DO NOTHING;

-- Add some analytics events for Islamic compliance tracking
INSERT INTO analytics_events (user_id, event_type, properties)
SELECT 
    u.id,
    'islamic_profile_completion',
    jsonb_build_object(
        'completion_date', NOW(),
        'sections_completed', ARRAY['basic_info', 'islamic_practices', 'cultural_preferences', 'communication_guidelines'],
        'compliance_score', 95
    )
FROM users u
WHERE u.status = 'active'
LIMIT 4
ON CONFLICT DO NOTHING;

INSERT INTO analytics_events (user_id, event_type, properties)
VALUES
    ('user1', 'guardian_approval_granted', jsonb_build_object('match_id', (SELECT id FROM matches WHERE user_a_id = 'user1' LIMIT 1), 'approval_time_hours', 48)),
    ('user2', 'prayer_time_communication_respected', jsonb_build_object('prayer_time', 'maghrib', 'message_delayed', true)),
    ('user6', 'family_involvement_preference_updated', jsonb_build_object('new_preference', 'high', 'guardian_notified', true)),
    ('user7', 'islamic_calendar_awareness', jsonb_build_object('event', 'Ramadan', 'activity_adjusted', true))
ON CONFLICT DO NOTHING;

-- Update match scores with Islamic compatibility
UPDATE matches 
SET score_breakdown = score_breakdown || jsonb_build_object(
    'islamic_compatibility', 
    (SELECT (check_islamic_compatibility(user_a_id, user_b_id)->>'compatibility_score')::integer)
)
WHERE user_a_status = 'mutual' OR user_b_status = 'mutual';

-- Refresh materialized views to include new data
REFRESH MATERIALIZED VIEW user_discovery_cache;
REFRESH MATERIALIZED VIEW match_statistics;