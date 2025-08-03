-- 📊 Database Performance Analysis & Stress Testing
-- Comprehensive SQL queries to test database performance under load

-- 🔧 Performance monitoring setup
CREATE OR REPLACE FUNCTION monitor_query_performance()
RETURNS TABLE(
  query_text TEXT,
  mean_exec_time NUMERIC,
  calls BIGINT,
  total_exec_time NUMERIC,
  rows_affected BIGINT,
  hit_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query as query_text,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.rows as rows_affected,
    CASE 
      WHEN pg_stat_statements.calls > 0 
      THEN (pg_stat_statements.shared_blks_hit::NUMERIC / 
            NULLIF(pg_stat_statements.shared_blks_hit + pg_stat_statements.shared_blks_read, 0)) * 100
      ELSE 0 
    END as hit_ratio
  FROM pg_stat_statements
  WHERE pg_stat_statements.calls > 10
  ORDER BY pg_stat_statements.mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 🚀 Test data generation for load testing
CREATE OR REPLACE FUNCTION generate_test_users(user_count INTEGER DEFAULT 1000)
RETURNS INTEGER AS $$
DECLARE
  i INTEGER;
  test_user_id TEXT;
  cities TEXT[] := ARRAY['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh', 'Cardiff', 'Belfast', 'Newcastle'];
  occupations TEXT[] := ARRAY['Engineer', 'Teacher', 'Doctor', 'Accountant', 'Designer', 'Manager', 'Consultant', 'Analyst', 'Developer', 'Nurse'];
  interests TEXT[] := ARRAY['reading', 'traveling', 'cooking', 'sports', 'music', 'art', 'photography', 'hiking', 'swimming', 'volunteering'];
BEGIN
  FOR i IN 1..user_count LOOP
    test_user_id := 'load-test-user-' || i;
    
    -- Insert test user
    INSERT INTO users (id, email, subscription_tier, status, created_at, updated_at)
    VALUES (
      test_user_id,
      'loadtest' || i || '@faddlmatch-test.com',
      'basic',
      'active',
      NOW() - (random() * interval '30 days'),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert test profile
    INSERT INTO user_profiles (
      user_id, age, gender, location_city, location_country, bio,
      religious_level, prayer_frequency, education_level, occupation,
      interests, languages, seeking_marriage_timeline,
      guardian_enabled, family_values, children_preference,
      age_range_min, age_range_max, location_radius_km,
      created_at, updated_at, status
    ) VALUES (
      test_user_id,
      18 + (random() * 17)::INTEGER, -- Age 18-35
      CASE WHEN random() > 0.5 THEN 'male' ELSE 'female' END,
      cities[1 + (random() * array_length(cities, 1))::INTEGER],
      'UK',
      'Load testing profile - seeking marriage within Islamic values',
      CASE 
        WHEN random() < 0.3 THEN 'learning'
        WHEN random() < 0.7 THEN 'practicing'
        ELSE 'devout'
      END,
      CASE 
        WHEN random() < 0.2 THEN 'rarely'
        WHEN random() < 0.4 THEN 'sometimes'
        WHEN random() < 0.8 THEN 'regularly'
        ELSE 'always'
      END,
      CASE 
        WHEN random() < 0.3 THEN 'high_school'
        WHEN random() < 0.6 THEN 'bachelors'
        WHEN random() < 0.9 THEN 'masters'
        ELSE 'doctorate'
      END,
      occupations[1 + (random() * array_length(occupations, 1))::INTEGER],
      ARRAY(SELECT interests[i] FROM generate_series(1, 3) AS i),
      ARRAY['english', 'arabic'],
      'within_year',
      random() > 0.6, -- 40% have guardian enabled
      ARRAY['respect', 'honesty', 'kindness'],
      CASE 
        WHEN random() < 0.3 THEN 'definitely'
        WHEN random() < 0.6 THEN 'probably'
        WHEN random() < 0.8 THEN 'maybe'
        ELSE 'no'
      END,
      18, 35, 50, -- Preferences
      NOW() - (random() * interval '30 days'),
      NOW(),
      'active'
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Generate some matches periodically
    IF i % 10 = 0 THEN
      PERFORM generate_test_matches_for_user(test_user_id, 5);
    END IF;
  END LOOP;
  
  RETURN user_count;
END;
$$ LANGUAGE plpgsql;

-- 🎯 Generate test matches for realistic matching queries
CREATE OR REPLACE FUNCTION generate_test_matches_for_user(target_user_id TEXT, match_count INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  potential_matches RECORD;
  inserted_count INTEGER := 0;
BEGIN
  FOR potential_matches IN (
    SELECT user_id, random() as compatibility_score
    FROM user_profiles 
    WHERE user_id != target_user_id 
      AND user_id LIKE 'load-test-user-%'
      AND status = 'active'
    ORDER BY random()
    LIMIT match_count * 2 -- Get more than needed for filtering
  ) LOOP
    INSERT INTO user_matches (
      user_id, matched_user_id, compatibility_score, 
      match_reasons, created_at, status
    ) VALUES (
      target_user_id,
      potential_matches.user_id,
      (potential_matches.compatibility_score * 100)::INTEGER,
      ARRAY['shared_values', 'compatible_lifestyle', 'similar_goals'],
      NOW(),
      'active'
    ) ON CONFLICT (user_id, matched_user_id) DO NOTHING;
    
    inserted_count := inserted_count + 1;
    
    EXIT WHEN inserted_count >= match_count;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 💬 Generate test conversations and messages
CREATE OR REPLACE FUNCTION generate_test_conversations(conversation_count INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
  i INTEGER;
  user1_id TEXT;
  user2_id TEXT;
  conv_id TEXT;
  message_count INTEGER;
  j INTEGER;
BEGIN
  FOR i IN 1..conversation_count LOOP
    -- Pick two random test users
    SELECT user_id INTO user1_id 
    FROM user_profiles 
    WHERE user_id LIKE 'load-test-user-%' 
    ORDER BY random() 
    LIMIT 1;
    
    SELECT user_id INTO user2_id 
    FROM user_profiles 
    WHERE user_id LIKE 'load-test-user-%' 
      AND user_id != user1_id 
    ORDER BY random() 
    LIMIT 1;
    
    conv_id := 'conv-' || user1_id || '-' || user2_id;
    
    -- Create conversation
    INSERT INTO conversations (
      id, user1_id, user2_id, status, created_at, updated_at
    ) VALUES (
      conv_id, user1_id, user2_id, 'active', NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Generate 5-15 messages per conversation
    message_count := 5 + (random() * 10)::INTEGER;
    
    FOR j IN 1..message_count LOOP
      INSERT INTO messages (
        id, conversation_id, sender_id,
        content, message_type, created_at, status
      ) VALUES (
        'msg-' || conv_id || '-' || j,
        conv_id,
        CASE WHEN random() > 0.5 THEN user1_id ELSE user2_id END,
        'Test message ' || j || ' - Assalamu alaikum',
        'text',
        NOW() - (random() * interval '7 days'),
        'sent'
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RETURN conversation_count;
END;
$$ LANGUAGE plpgsql;

-- 🔍 Database performance stress tests
CREATE OR REPLACE FUNCTION stress_test_user_queries(iterations INTEGER DEFAULT 1000)
RETURNS TABLE(
  test_name TEXT,
  avg_execution_time NUMERIC,
  max_execution_time NUMERIC,
  min_execution_time NUMERIC,
  total_time NUMERIC
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_times NUMERIC[];
  current_time NUMERIC;
  i INTEGER;
BEGIN
  -- Test 1: User profile lookups
  execution_times := ARRAY[]::NUMERIC[];
  FOR i IN 1..iterations LOOP
    start_time := clock_timestamp();
    PERFORM * FROM user_profiles WHERE user_id = 'load-test-user-' || (1 + random() * 999)::INTEGER;
    end_time := clock_timestamp();
    current_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    execution_times := array_append(execution_times, current_time);
  END LOOP;
  
  RETURN QUERY SELECT 
    'User Profile Lookup'::TEXT,
    (SELECT AVG(val) FROM unnest(execution_times) AS val),
    (SELECT MAX(val) FROM unnest(execution_times) AS val),
    (SELECT MIN(val) FROM unnest(execution_times) AS val),
    (SELECT SUM(val) FROM unnest(execution_times) AS val);
  
  -- Test 2: Match generation queries
  execution_times := ARRAY[]::NUMERIC[];
  FOR i IN 1..iterations LOOP
    start_time := clock_timestamp();
    PERFORM user_id, compatibility_score 
    FROM user_matches 
    WHERE user_id = 'load-test-user-' || (1 + random() * 999)::INTEGER
    ORDER BY compatibility_score DESC 
    LIMIT 10;
    end_time := clock_timestamp();
    current_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    execution_times := array_append(execution_times, current_time);
  END LOOP;
  
  RETURN QUERY SELECT 
    'Match Generation Query'::TEXT,
    (SELECT AVG(val) FROM unnest(execution_times) AS val),
    (SELECT MAX(val) FROM unnest(execution_times) AS val),
    (SELECT MIN(val) FROM unnest(execution_times) AS val),
    (SELECT SUM(val) FROM unnest(execution_times) AS val);
  
  -- Test 3: Conversation queries
  execution_times := ARRAY[]::NUMERIC[];
  FOR i IN 1..iterations LOOP
    start_time := clock_timestamp();
    PERFORM m.id, m.content, m.created_at
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user1_id = 'load-test-user-' || (1 + random() * 999)::INTEGER
       OR c.user2_id = 'load-test-user-' || (1 + random() * 999)::INTEGER
    ORDER BY m.created_at DESC
    LIMIT 50;
    end_time := clock_timestamp();
    current_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    execution_times := array_append(execution_times, current_time);
  END LOOP;
  
  RETURN QUERY SELECT 
    'Conversation History Query'::TEXT,
    (SELECT AVG(val) FROM unnest(execution_times) AS val),
    (SELECT MAX(val) FROM unnest(execution_times) AS val),
    (SELECT MIN(val) FROM unnest(execution_times) AS val),
    (SELECT SUM(val) FROM unnest(execution_times) AS val);
    
  -- Test 4: Complex search queries
  execution_times := ARRAY[]::NUMERIC[];
  FOR i IN 1..iterations LOOP
    start_time := clock_timestamp();
    PERFORM user_id, age, location_city, religious_level
    FROM user_profiles
    WHERE age BETWEEN 20 AND 30
      AND location_city = 'London'
      AND religious_level IN ('practicing', 'devout')
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 20;
    end_time := clock_timestamp();
    current_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    execution_times := array_append(execution_times, current_time);
  END LOOP;
  
  RETURN QUERY SELECT 
    'Complex Search Query'::TEXT,
    (SELECT AVG(val) FROM unnest(execution_times) AS val),
    (SELECT MAX(val) FROM unnest(execution_times) AS val),
    (SELECT MIN(val) FROM unnest(execution_times) AS val),
    (SELECT SUM(val) FROM unnest(execution_times) AS val);
END;
$$ LANGUAGE plpgsql;

-- 📈 Connection pool and resource monitoring
CREATE OR REPLACE FUNCTION monitor_database_resources()
RETURNS TABLE(
  metric_name TEXT,
  current_value NUMERIC,
  max_value NUMERIC,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Active Connections'::TEXT,
    COUNT(*)::NUMERIC,
    current_setting('max_connections')::NUMERIC,
    (COUNT(*)::NUMERIC / current_setting('max_connections')::NUMERIC * 100)
  FROM pg_stat_activity
  WHERE state = 'active'
  
  UNION ALL
  
  SELECT 
    'Database Size (MB)'::TEXT,
    pg_database_size(current_database())::NUMERIC / 1024 / 1024,
    NULL,
    NULL
  
  UNION ALL
  
  SELECT 
    'Cache Hit Ratio (%)'::TEXT,
    CASE 
      WHEN (blks_hit + blks_read) > 0 
      THEN (blks_hit::NUMERIC / (blks_hit + blks_read) * 100)
      ELSE 0 
    END,
    100,
    CASE 
      WHEN (blks_hit + blks_read) > 0 
      THEN (blks_hit::NUMERIC / (blks_hit + blks_read) * 100)
      ELSE 0 
    END
  FROM pg_stat_database
  WHERE datname = current_database()
  
  UNION ALL
  
  SELECT 
    'Index Hit Ratio (%)'::TEXT,
    CASE 
      WHEN (idx_blks_hit + idx_blks_read) > 0 
      THEN (idx_blks_hit::NUMERIC / (idx_blks_hit + idx_blks_read) * 100)
      ELSE 0 
    END,
    100,
    CASE 
      WHEN (idx_blks_hit + idx_blks_read) > 0 
      THEN (idx_blks_hit::NUMERIC / (idx_blks_hit + idx_blks_read) * 100)
      ELSE 0 
    END
  FROM pg_stat_database
  WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql;

-- 🧹 Cleanup test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete test messages
  DELETE FROM messages 
  WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE user1_id LIKE 'load-test-user-%' OR user2_id LIKE 'load-test-user-%'
  );
  
  -- Delete test conversations
  DELETE FROM conversations 
  WHERE user1_id LIKE 'load-test-user-%' OR user2_id LIKE 'load-test-user-%';
  
  -- Delete test matches
  DELETE FROM user_matches 
  WHERE user_id LIKE 'load-test-user-%' OR matched_user_id LIKE 'load-test-user-%';
  
  -- Delete test profiles
  DELETE FROM user_profiles WHERE user_id LIKE 'load-test-user-%';
  
  -- Delete test users
  DELETE FROM users WHERE id LIKE 'load-test-user-%';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Reset sequences if needed
  -- This helps maintain performance for subsequent tests
  VACUUM ANALYZE;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 📊 Performance analysis queries
-- Run these to analyze database performance during load testing

-- Query to check slow queries
CREATE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_exec_time DESC;

-- Query to check table statistics
CREATE VIEW table_stats AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Query to check index usage
CREATE VIEW index_usage AS
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan > 0 
    THEN (idx_tup_read::FLOAT / idx_scan)::NUMERIC(10,2)
    ELSE 0 
  END as tuples_per_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Instructions for running load tests:
/*
1. Setup test data:
   SELECT generate_test_users(1000);
   SELECT generate_test_conversations(100);

2. Run performance tests:
   SELECT * FROM stress_test_user_queries(1000);
   SELECT * FROM monitor_database_resources();
   SELECT * FROM monitor_query_performance();

3. Monitor during load testing:
   SELECT * FROM slow_queries;
   SELECT * FROM table_stats;
   SELECT * FROM index_usage;

4. Cleanup after testing:
   SELECT cleanup_test_data();
*/