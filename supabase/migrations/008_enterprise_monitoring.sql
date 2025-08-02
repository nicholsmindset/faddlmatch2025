-- Enterprise monitoring, analytics, and maintenance features
-- Real-time monitoring, automated maintenance, and business intelligence

-- Real-time system health monitoring
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_category TEXT NOT NULL CHECK (metric_category IN ('database', 'api', 'matching', 'messaging', 'storage', 'security')),
    metric_name TEXT NOT NULL,
    current_value DECIMAL(12,4) NOT NULL,
    threshold_warning DECIMAL(12,4),
    threshold_critical DECIMAL(12,4),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_health_metrics_category ON system_health_metrics(metric_category, last_updated);
CREATE INDEX idx_health_metrics_status ON system_health_metrics(status) WHERE status != 'healthy';

-- Business intelligence metrics for Series C investors
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    
    -- User acquisition and retention
    new_users_count INTEGER DEFAULT 0,
    active_users_count INTEGER DEFAULT 0,
    premium_users_count INTEGER DEFAULT 0,
    user_retention_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Engagement metrics
    profiles_completed INTEGER DEFAULT 0,
    matches_created INTEGER DEFAULT 0,
    mutual_matches INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    conversations_started INTEGER DEFAULT 0,
    
    -- Islamic compliance metrics
    guardian_approvals_granted INTEGER DEFAULT 0,
    islamic_guidelines_violations INTEGER DEFAULT 0,
    family_involvement_rate DECIMAL(5,2) DEFAULT 0,
    halal_communication_score DECIMAL(5,2) DEFAULT 0,
    
    -- Revenue metrics (for subscription tracking)
    subscription_revenue DECIMAL(10,2) DEFAULT 0,
    average_revenue_per_user DECIMAL(10,2) DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    
    -- Success metrics
    successful_matches_rate DECIMAL(5,2) DEFAULT 0,
    user_satisfaction_score DECIMAL(5,2) DEFAULT 0,
    platform_nps_score INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(metric_date)
);

CREATE INDEX idx_business_metrics_date ON business_metrics(metric_date DESC);

-- User behavior analytics for ML/AI improvements
CREATE TABLE user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID NOT NULL,
    
    -- User journey tracking
    page_views JSONB DEFAULT '[]',
    features_used JSONB DEFAULT '[]',
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Matching behavior
    profiles_viewed INTEGER DEFAULT 0,
    matches_responded_to INTEGER DEFAULT 0,
    response_time_avg_minutes INTEGER DEFAULT 0,
    
    -- Communication patterns
    messages_sent INTEGER DEFAULT 0,
    message_response_rate DECIMAL(5,2) DEFAULT 0,
    conversation_duration_minutes INTEGER DEFAULT 0,
    
    -- Islamic compliance behavior
    guidelines_followed_score DECIMAL(5,2) DEFAULT 0,
    family_involvement_level TEXT,
    prayer_time_awareness BOOLEAN DEFAULT false,
    
    -- Device and technical info
    device_type TEXT,
    browser_info JSONB DEFAULT '{}',
    location_zone location_zone,
    
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    session_ended_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create behavior analytics partitions
CREATE TABLE user_behavior_analytics_2024_08 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE user_behavior_analytics_2024_09 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE user_behavior_analytics_2024_10 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE user_behavior_analytics_2024_11 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE user_behavior_analytics_2024_12 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE user_behavior_analytics_2025_01 PARTITION OF user_behavior_analytics
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_behavior_analytics_user ON user_behavior_analytics(user_id, created_at);
CREATE INDEX idx_behavior_analytics_session ON user_behavior_analytics(session_id);

-- Real-time alerts and notifications
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('performance', 'security', 'business', 'compliance', 'technical')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Alert details
    affected_users INTEGER DEFAULT 0,
    estimated_impact TEXT,
    recommended_actions JSONB DEFAULT '[]',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Auto-resolution
    auto_resolve_after INTERVAL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_alerts_status ON system_alerts(status, severity) WHERE status = 'active';
CREATE INDEX idx_system_alerts_type ON system_alerts(alert_type, created_at);

-- Advanced matching analytics for algorithm improvement
CREATE MATERIALIZED VIEW matching_analytics AS
WITH match_success_analysis AS (
    SELECT 
        m.compatibility_score,
        CASE WHEN m.user_a_status = 'mutual' AND m.user_b_status = 'mutual' THEN 'mutual'
             WHEN m.user_a_status = 'rejected' OR m.user_b_status = 'rejected' THEN 'rejected'
             ELSE 'pending' END as match_outcome,
        
        -- Profile characteristics
        ua_profile.location_zone as user_a_location,
        ub_profile.location_zone as user_b_location,
        ua_profile.ethnicity as user_a_ethnicity,
        ub_profile.ethnicity as user_b_ethnicity,
        ua_profile.prayer_frequency as user_a_prayer,
        ub_profile.prayer_frequency as user_b_prayer,
        
        -- Age difference
        ABS(ua_profile.year_of_birth - ub_profile.year_of_birth) as age_difference,
        
        -- Islamic compatibility
        (m.score_breakdown->>'islamic_compatibility')::integer as islamic_score,
        
        -- Response times
        EXTRACT(EPOCH FROM (COALESCE(m.user_a_responded_at, m.user_b_responded_at) - m.matched_at))/3600 as response_time_hours,
        
        m.matched_at
    FROM matches m
    JOIN user_profiles ua_profile ON m.user_a_id = ua_profile.user_id
    JOIN user_profiles ub_profile ON m.user_b_id = ub_profile.user_id
    WHERE m.matched_at >= NOW() - INTERVAL '90 days'
)
SELECT 
    -- Overall success rates by score ranges
    CASE 
        WHEN compatibility_score >= 90 THEN '90-100'
        WHEN compatibility_score >= 80 THEN '80-89'
        WHEN compatibility_score >= 70 THEN '70-79'
        WHEN compatibility_score >= 60 THEN '60-69'
        ELSE '50-59'
    END as score_range,
    
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE match_outcome = 'mutual') as mutual_matches,
    COUNT(*) FILTER (WHERE match_outcome = 'rejected') as rejected_matches,
    
    -- Success rate
    ROUND(COUNT(*) FILTER (WHERE match_outcome = 'mutual')::DECIMAL / COUNT(*) * 100, 2) as success_rate,
    
    -- Average response time
    ROUND(AVG(response_time_hours), 1) as avg_response_time_hours,
    
    -- Location compatibility impact
    ROUND(AVG(CASE WHEN user_a_location = user_b_location THEN 1 ELSE 0 END) * 100, 1) as same_location_rate,
    
    -- Islamic compatibility correlation
    ROUND(AVG(islamic_score), 1) as avg_islamic_score,
    
    -- Age difference impact
    ROUND(AVG(age_difference), 1) as avg_age_difference,
    
    DATE_TRUNC('week', matched_at) as match_week
    
FROM match_success_analysis
GROUP BY 
    CASE 
        WHEN compatibility_score >= 90 THEN '90-100'
        WHEN compatibility_score >= 80 THEN '80-89'
        WHEN compatibility_score >= 70 THEN '70-79'
        WHEN compatibility_score >= 60 THEN '60-69'
        ELSE '50-59'
    END,
    DATE_TRUNC('week', matched_at)
ORDER BY match_week DESC, score_range DESC;

CREATE UNIQUE INDEX ON matching_analytics (score_range, match_week);

-- Function to update system health metrics
CREATE OR REPLACE FUNCTION update_system_health()
RETURNS void AS $$
DECLARE
    v_db_connections INTEGER;
    v_avg_query_time DECIMAL;
    v_active_users INTEGER;
    v_match_queue_size INTEGER;
    v_moderation_queue_size INTEGER;
    v_storage_usage DECIMAL;
BEGIN
    -- Database metrics
    SELECT COUNT(*) INTO v_db_connections FROM pg_stat_activity WHERE state = 'active';
    SELECT AVG(total_time) INTO v_avg_query_time FROM pg_stat_statements WHERE calls > 10;
    
    -- User activity metrics
    SELECT COUNT(*) INTO v_active_users FROM users WHERE last_active_at > NOW() - INTERVAL '24 hours';
    
    -- Queue sizes
    SELECT COUNT(*) INTO v_moderation_queue_size FROM message_moderation_queue WHERE resolved_at IS NULL;
    
    -- Update or insert health metrics
    INSERT INTO system_health_metrics (metric_category, metric_name, current_value, threshold_warning, threshold_critical, status)
    VALUES 
        ('database', 'active_connections', v_db_connections, 80, 95, 
         CASE WHEN v_db_connections > 95 THEN 'critical'
              WHEN v_db_connections > 80 THEN 'warning'
              ELSE 'healthy' END),
        ('database', 'avg_query_time_ms', COALESCE(v_avg_query_time, 0), 100, 500,
         CASE WHEN COALESCE(v_avg_query_time, 0) > 500 THEN 'critical'
              WHEN COALESCE(v_avg_query_time, 0) > 100 THEN 'warning'
              ELSE 'healthy' END),
        ('api', 'active_users_24h', v_active_users, 10000, 50000,
         CASE WHEN v_active_users > 50000 THEN 'critical'
              WHEN v_active_users > 10000 THEN 'warning'
              ELSE 'healthy' END),
        ('messaging', 'moderation_queue_size', v_moderation_queue_size, 100, 500,
         CASE WHEN v_moderation_queue_size > 500 THEN 'critical'
              WHEN v_moderation_queue_size > 100 THEN 'warning'
              ELSE 'healthy' END)
    ON CONFLICT (metric_category, metric_name) 
    DO UPDATE SET 
        current_value = EXCLUDED.current_value,
        status = EXCLUDED.status,
        last_updated = NOW();
        
    -- Create alerts for critical issues
    INSERT INTO system_alerts (alert_type, severity, title, description, affected_users, recommended_actions)
    SELECT 
        'performance',
        'critical',
        'High Database Load Detected',
        format('Database connections at %s, exceeding critical threshold of 95', v_db_connections),
        v_active_users,
        '["Scale up database resources", "Review connection pooling", "Optimize long-running queries"]'
    WHERE v_db_connections > 95
    AND NOT EXISTS (
        SELECT 1 FROM system_alerts 
        WHERE alert_type = 'performance' 
        AND title = 'High Database Load Detected' 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily business metrics
CREATE OR REPLACE FUNCTION generate_daily_business_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    v_new_users INTEGER;
    v_active_users INTEGER;
    v_premium_users INTEGER;
    v_matches_created INTEGER;
    v_mutual_matches INTEGER;
    v_messages_sent INTEGER;
    v_guardian_approvals INTEGER;
    v_islamic_violations INTEGER;
BEGIN
    -- Calculate metrics for the specified date
    SELECT COUNT(*) INTO v_new_users 
    FROM users 
    WHERE DATE(created_at) = p_date;
    
    SELECT COUNT(*) INTO v_active_users 
    FROM users 
    WHERE DATE(last_active_at) = p_date AND status = 'active';
    
    SELECT COUNT(*) INTO v_premium_users 
    FROM users 
    WHERE subscription_tier IN ('premium', 'vip') AND status = 'active';
    
    SELECT COUNT(*) INTO v_matches_created 
    FROM matches 
    WHERE DATE(matched_at) = p_date;
    
    SELECT COUNT(*) INTO v_mutual_matches 
    FROM matches 
    WHERE DATE(matched_at) = p_date AND user_a_status = 'mutual' AND user_b_status = 'mutual';
    
    SELECT COUNT(*) INTO v_messages_sent 
    FROM messages 
    WHERE DATE(created_at) = p_date;
    
    SELECT COUNT(*) INTO v_guardian_approvals 
    FROM family_approvals 
    WHERE DATE(approved_at) = p_date AND status = 'approved';
    
    SELECT COUNT(*) INTO v_islamic_violations 
    FROM message_moderation_queue 
    WHERE DATE(flagged_at) = p_date AND flagged_reason = 'islamic_guidelines_review';
    
    -- Insert or update business metrics
    INSERT INTO business_metrics (
        metric_date, new_users_count, active_users_count, premium_users_count,
        matches_created, mutual_matches, messages_sent, guardian_approvals_granted,
        islamic_guidelines_violations,
        successful_matches_rate, halal_communication_score, family_involvement_rate
    ) VALUES (
        p_date, v_new_users, v_active_users, v_premium_users,
        v_matches_created, v_mutual_matches, v_messages_sent, v_guardian_approvals,
        v_islamic_violations,
        CASE WHEN v_matches_created > 0 THEN (v_mutual_matches::DECIMAL / v_matches_created * 100) ELSE 0 END,
        CASE WHEN v_messages_sent > 0 THEN ((v_messages_sent - v_islamic_violations)::DECIMAL / v_messages_sent * 100) ELSE 100 END,
        CASE WHEN v_active_users > 0 THEN ((SELECT COUNT(*) FROM guardians WHERE user_id IN (SELECT id FROM users WHERE DATE(last_active_at) = p_date))::DECIMAL / v_active_users * 100) ELSE 0 END
    )
    ON CONFLICT (metric_date) 
    DO UPDATE SET
        new_users_count = EXCLUDED.new_users_count,
        active_users_count = EXCLUDED.active_users_count,
        premium_users_count = EXCLUDED.premium_users_count,
        matches_created = EXCLUDED.matches_created,
        mutual_matches = EXCLUDED.mutual_matches,
        messages_sent = EXCLUDED.messages_sent,
        guardian_approvals_granted = EXCLUDED.guardian_approvals_granted,
        islamic_guidelines_violations = EXCLUDED.islamic_guidelines_violations,
        successful_matches_rate = EXCLUDED.successful_matches_rate,
        halal_communication_score = EXCLUDED.halal_communication_score,
        family_involvement_rate = EXCLUDED.family_involvement_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for comprehensive system maintenance
CREATE OR REPLACE FUNCTION enterprise_maintenance()
RETURNS JSONB AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_maintenance_log JSONB := '{}';
    v_expired_matches INTEGER;
    v_cleaned_analytics INTEGER;
    v_archived_messages INTEGER;
BEGIN
    v_start_time := NOW();
    
    -- Update system health metrics
    PERFORM update_system_health();
    v_maintenance_log := v_maintenance_log || jsonb_build_object('health_metrics_updated', true);
    
    -- Generate business metrics for yesterday
    PERFORM generate_daily_business_metrics(CURRENT_DATE - 1);
    v_maintenance_log := v_maintenance_log || jsonb_build_object('business_metrics_generated', true);
    
    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_discovery_cache;
    REFRESH MATERIALIZED VIEW CONCURRENTLY match_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY matching_analytics;
    v_maintenance_log := v_maintenance_log || jsonb_build_object('materialized_views_refreshed', true);
    
    -- Clean up expired matches
    SELECT cleanup_expired_matches() INTO v_expired_matches;
    v_maintenance_log := v_maintenance_log || jsonb_build_object('expired_matches_cleaned', v_expired_matches);
    
    -- Archive old messages (move to cold storage simulation)
    UPDATE messages 
    SET metadata = metadata || jsonb_build_object('archived', true, 'archived_at', NOW())
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND metadata->>'archived' IS NULL;
    GET DIAGNOSTICS v_archived_messages = ROW_COUNT;
    v_maintenance_log := v_maintenance_log || jsonb_build_object('messages_archived', v_archived_messages);
    
    -- Clean up old analytics events
    DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '2 years';
    GET DIAGNOSTICS v_cleaned_analytics = ROW_COUNT;
    v_maintenance_log := v_maintenance_log || jsonb_build_object('old_analytics_cleaned', v_cleaned_analytics);
    
    -- Update user activity status
    UPDATE users 
    SET status = 'inactive' 
    WHERE status = 'active' 
    AND last_active_at < NOW() - INTERVAL '90 days';
    
    -- Create monthly partitions if needed
    PERFORM create_monthly_partitions();
    v_maintenance_log := v_maintenance_log || jsonb_build_object('partitions_checked', true);
    
    -- Log maintenance completion
    PERFORM log_performance_metric(
        'enterprise_maintenance_completed',
        EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'seconds',
        v_maintenance_log
    );
    
    RETURN v_maintenance_log || jsonb_build_object(
        'maintenance_duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        'completed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive platform analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
    p_start_date DATE DEFAULT CURRENT_DATE - 30,
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    v_analytics JSONB := '{}';
BEGIN
    -- User metrics
    v_analytics := v_analytics || jsonb_build_object(
        'users', jsonb_build_object(
            'total_active', (SELECT COUNT(*) FROM users WHERE status = 'active'),
            'new_signups', (SELECT COUNT(*) FROM users WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date),
            'premium_users', (SELECT COUNT(*) FROM users WHERE subscription_tier IN ('premium', 'vip') AND status = 'active'),
            'users_with_complete_profiles', (SELECT COUNT(*) FROM user_profiles WHERE profile_completed_at IS NOT NULL),
            'users_with_guardians', (SELECT COUNT(DISTINCT user_id) FROM guardians)
        )
    );
    
    -- Matching metrics
    v_analytics := v_analytics || jsonb_build_object(
        'matching', jsonb_build_object(
            'total_matches', (SELECT COUNT(*) FROM matches WHERE DATE(matched_at) BETWEEN p_start_date AND p_end_date),
            'mutual_matches', (SELECT COUNT(*) FROM matches WHERE DATE(matched_at) BETWEEN p_start_date AND p_end_date AND user_a_status = 'mutual' AND user_b_status = 'mutual'),
            'average_compatibility_score', (SELECT ROUND(AVG(compatibility_score), 2) FROM matches WHERE DATE(matched_at) BETWEEN p_start_date AND p_end_date),
            'success_rate_percentage', (
                SELECT ROUND(
                    COUNT(*) FILTER (WHERE user_a_status = 'mutual' AND user_b_status = 'mutual')::DECIMAL / 
                    COUNT(*)::DECIMAL * 100, 2
                ) FROM matches WHERE DATE(matched_at) BETWEEN p_start_date AND p_end_date
            )
        )
    );
    
    -- Communication metrics
    v_analytics := v_analytics || jsonb_build_object(
        'communication', jsonb_build_object(
            'total_messages', (SELECT COUNT(*) FROM messages WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date),
            'active_conversations', (SELECT COUNT(*) FROM conversations WHERE is_active = true AND last_message_at >= p_start_date),
            'moderation_queue_size', (SELECT COUNT(*) FROM message_moderation_queue WHERE resolved_at IS NULL),
            'guardian_supervised_conversations', (SELECT COUNT(*) FROM conversations WHERE guardian_approved = false)
        )
    );
    
    -- Islamic compliance metrics
    v_analytics := v_analytics || jsonb_build_object(
        'islamic_compliance', jsonb_build_object(
            'users_with_islamic_practices', (SELECT COUNT(*) FROM islamic_practices),
            'guardian_approvals_pending', (SELECT COUNT(*) FROM family_approvals WHERE status = 'pending'),
            'prayer_frequency_distribution', (
                SELECT jsonb_object_agg(prayer_frequency, user_count)
                FROM (
                    SELECT prayer_frequency, COUNT(*) as user_count
                    FROM islamic_practices
                    GROUP BY prayer_frequency
                ) pf_dist
            ),
            'halal_communication_compliance', (
                SELECT ROUND(
                    (COUNT(*) - COUNT(*) FILTER (WHERE flagged_reason = 'islamic_guidelines_review'))::DECIMAL / 
                    COUNT(*)::DECIMAL * 100, 2
                ) FROM messages m
                LEFT JOIN message_moderation_queue mmq ON m.id = mmq.message_id
                WHERE DATE(m.created_at) BETWEEN p_start_date AND p_end_date
            )
        )
    );
    
    -- Performance metrics
    v_analytics := v_analytics || jsonb_build_object(
        'performance', jsonb_build_object(
            'average_response_time_ms', (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'advanced_matching_duration' AND DATE(measured_at) BETWEEN p_start_date AND p_end_date),
            'cache_hit_ratio_percentage', (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'user_discovery_cache_hit_ratio' AND DATE(measured_at) BETWEEN p_start_date AND p_end_date),
            'database_health_status', (SELECT status FROM system_health_metrics WHERE metric_category = 'database' ORDER BY last_updated DESC LIMIT 1)
        )
    );
    
    -- Business metrics summary
    v_analytics := v_analytics || jsonb_build_object(
        'business_summary', (
            SELECT jsonb_build_object(
                'total_revenue_estimate', SUM(subscription_revenue),
                'average_daily_active_users', AVG(active_users_count),
                'user_retention_trend', AVG(user_retention_rate),
                'platform_growth_rate', (
                    CASE WHEN LAG(new_users_count) OVER (ORDER BY metric_date) > 0 
                    THEN ROUND((new_users_count - LAG(new_users_count) OVER (ORDER BY metric_date))::DECIMAL / 
                               LAG(new_users_count) OVER (ORDER BY metric_date) * 100, 2)
                    ELSE 0 END
                )
            )
            FROM business_metrics 
            WHERE metric_date BETWEEN p_start_date AND p_end_date
        )
    );
    
    RETURN v_analytics || jsonb_build_object(
        'report_generated_at', NOW(),
        'date_range', jsonb_build_object('start', p_start_date, 'end', p_end_date)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on monitoring tables
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only access to monitoring tables (to be expanded with proper admin roles)
CREATE POLICY "Admin only access to health metrics" ON system_health_metrics FOR ALL USING (false);
CREATE POLICY "Admin only access to business metrics" ON business_metrics FOR ALL USING (false);
CREATE POLICY "Users can view own behavior analytics" ON user_behavior_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin only access to system alerts" ON system_alerts FOR ALL USING (false);

-- Schedule automated maintenance (to be called by cron job or Supabase Edge Functions)
COMMENT ON FUNCTION enterprise_maintenance() IS 'Run this function daily via cron job or Supabase Edge Function for automated maintenance';
COMMENT ON FUNCTION update_system_health() IS 'Run this function every 5 minutes for real-time health monitoring';
COMMENT ON FUNCTION generate_daily_business_metrics(DATE) IS 'Run this function daily to generate business intelligence metrics';