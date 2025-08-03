-- Security Events Table for JWT Validation and Monitoring
-- Tracks authentication events, failed attempts, and suspicious activity

CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'jwt_validation_success',
    'jwt_validation_failed', 
    'suspicious_activity',
    'rate_limit_exceeded',
    'account_lockout',
    'unauthorized_access_attempt'
  )),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  event_data JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_security_events_type_created (event_type, created_at),
  INDEX idx_security_events_user_created (user_id, created_at),
  INDEX idx_security_events_ip_created (ip_address, created_at),
  INDEX idx_security_events_risk_score (risk_score DESC)
);

-- Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (edge functions)
CREATE POLICY "Service role full access" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users to view their own events
CREATE POLICY "Users can view own security events" ON security_events
  FOR SELECT USING (auth.uid() = user_id);

-- Automated cleanup for old security events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily
SELECT cron.schedule(
  'cleanup-security-events',
  '0 2 * * *', -- 2 AM daily
  'SELECT cleanup_old_security_events();'
);

-- Function to calculate risk score based on event patterns
CREATE OR REPLACE FUNCTION calculate_event_risk_score(
  p_event_type TEXT,
  p_ip_address INET,
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 0;
  recent_failures INTEGER := 0;
  ip_reputation INTEGER := 0;
BEGIN
  -- Base scores by event type
  CASE p_event_type
    WHEN 'jwt_validation_failed' THEN base_score := 20;
    WHEN 'suspicious_activity' THEN base_score := 50;
    WHEN 'rate_limit_exceeded' THEN base_score := 30;
    WHEN 'unauthorized_access_attempt' THEN base_score := 40;
    ELSE base_score := 10;
  END CASE;

  -- Check recent failures from same IP (last hour)
  SELECT COUNT(*) INTO recent_failures
  FROM security_events
  WHERE ip_address = p_ip_address
    AND event_type IN ('jwt_validation_failed', 'suspicious_activity')
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Increase score based on recent failures
  IF recent_failures > 10 THEN
    base_score := base_score + 30;
  ELSIF recent_failures > 5 THEN
    base_score := base_score + 20;
  ELSIF recent_failures > 2 THEN
    base_score := base_score + 10;
  END IF;

  -- Cap at 100
  RETURN LEAST(base_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate risk scores
CREATE OR REPLACE FUNCTION set_security_event_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.risk_score := calculate_event_risk_score(
    NEW.event_type,
    NEW.ip_address,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_events_risk_score_trigger
  BEFORE INSERT ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION set_security_event_risk_score();

-- View for security monitoring dashboard
CREATE OR REPLACE VIEW security_monitoring AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_type
ORDER BY hour DESC, avg_risk_score DESC;

-- High-risk events view for alerting
CREATE OR REPLACE VIEW high_risk_security_events AS
SELECT
  id,
  event_type,
  user_id,
  ip_address,
  user_agent,
  risk_score,
  event_data,
  created_at
FROM security_events
WHERE risk_score >= 70
  AND created_at > NOW() - INTERVAL '24 hours'
  AND resolved = false
ORDER BY risk_score DESC, created_at DESC;

-- IP reputation tracking
CREATE OR REPLACE VIEW ip_reputation AS
SELECT
  ip_address,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_type = 'jwt_validation_failed') as failed_auth_count,
  COUNT(*) FILTER (WHERE event_type = 'suspicious_activity') as suspicious_count,
  AVG(risk_score) as avg_risk_score,
  MAX(created_at) as last_activity,
  CASE
    WHEN AVG(risk_score) > 70 THEN 'HIGH_RISK'
    WHEN AVG(risk_score) > 40 THEN 'MEDIUM_RISK'
    ELSE 'LOW_RISK'
  END as reputation
FROM security_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY avg_risk_score DESC;

-- Comment on table
COMMENT ON TABLE security_events IS 'Tracks security events for JWT validation monitoring and threat detection';
COMMENT ON COLUMN security_events.risk_score IS 'Calculated risk score (0-100) based on event type and patterns';
COMMENT ON COLUMN security_events.event_data IS 'Additional event-specific data in JSON format';
COMMENT ON VIEW security_monitoring IS 'Hourly aggregated security events for monitoring dashboard';
COMMENT ON VIEW high_risk_security_events IS 'High-risk security events requiring immediate attention';
COMMENT ON VIEW ip_reputation IS 'IP address reputation based on recent security events';