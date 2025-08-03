-- Edge Function Monitoring Tables and Views
-- Comprehensive monitoring infrastructure for FADDL Match edge functions

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS function_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL CHECK (execution_time_ms >= 0),
  memory_used_mb DECIMAL(10,2) CHECK (memory_used_mb >= 0),
  cold_start BOOLEAN NOT NULL DEFAULT false,
  request_size_bytes INTEGER CHECK (request_size_bytes >= 0),
  response_size_bytes INTEGER CHECK (response_size_bytes >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Performance indexes
  INDEX idx_perf_function_timestamp (function_name, timestamp DESC),
  INDEX idx_perf_execution_time (execution_time_ms DESC),
  INDEX idx_perf_cold_start (cold_start, timestamp),
  INDEX idx_perf_timestamp (timestamp DESC)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for performance metrics (current + next 6 months)
CREATE TABLE function_performance_metrics_2025_01 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE function_performance_metrics_2025_02 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE function_performance_metrics_2025_03 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE function_performance_metrics_2025_04 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE function_performance_metrics_2025_05 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE function_performance_metrics_2025_06 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE function_performance_metrics_2025_07 PARTITION OF function_performance_metrics
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

-- Error Events Table
CREATE TABLE IF NOT EXISTS function_error_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  request_data JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Error tracking indexes
  INDEX idx_error_function_timestamp (function_name, timestamp DESC),
  INDEX idx_error_severity_timestamp (severity, timestamp DESC),
  INDEX idx_error_user_timestamp (user_id, timestamp DESC),
  INDEX idx_error_type (error_type),
  INDEX idx_error_unresolved (resolved, timestamp DESC) WHERE resolved = false
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS function_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  function_name TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Alert indexes
  INDEX idx_alerts_type_created (alert_type, created_at DESC),
  INDEX idx_alerts_function_created (function_name, created_at DESC),
  INDEX idx_alerts_unresolved (resolved, created_at DESC) WHERE resolved = false
);

-- Function Health Status View
CREATE OR REPLACE VIEW function_health_status AS
WITH recent_metrics AS (
  SELECT 
    function_name,
    COUNT(*) as total_requests,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    AVG(CASE WHEN memory_used_mb IS NOT NULL THEN memory_used_mb END) as avg_memory_usage,
    SUM(CASE WHEN cold_start THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) as cold_start_rate,
    MAX(timestamp) as last_request
  FROM function_performance_metrics
  WHERE timestamp > NOW() - INTERVAL '15 minutes'
  GROUP BY function_name
),
recent_errors AS (
  SELECT 
    function_name,
    COUNT(*) as error_count,
    COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as critical_errors,
    MAX(timestamp) as last_error
  FROM function_error_events
  WHERE timestamp > NOW() - INTERVAL '15 minutes'
  GROUP BY function_name
)
SELECT 
  COALESCE(rm.function_name, re.function_name) as function_name,
  COALESCE(rm.total_requests, 0) as total_requests,
  COALESCE(rm.avg_execution_time, 0) as avg_execution_time_ms,
  COALESCE(rm.max_execution_time, 0) as max_execution_time_ms,
  COALESCE(rm.avg_memory_usage, 0) as avg_memory_usage_mb,
  COALESCE(rm.cold_start_rate, 0) as cold_start_rate,
  COALESCE(re.error_count, 0) as error_count,
  COALESCE(re.critical_errors, 0) as critical_errors,
  CASE 
    WHEN rm.total_requests = 0 THEN 0
    ELSE COALESCE(re.error_count, 0)::DECIMAL / rm.total_requests
  END as error_rate,
  CASE
    WHEN re.critical_errors > 0 OR 
         (rm.total_requests > 0 AND COALESCE(re.error_count, 0)::DECIMAL / rm.total_requests > 0.1) OR
         rm.avg_execution_time > 3000 THEN 'critical'
    WHEN (rm.total_requests > 0 AND COALESCE(re.error_count, 0)::DECIMAL / rm.total_requests > 0.05) OR
         rm.avg_execution_time > 1000 OR
         rm.cold_start_rate > 0.1 THEN 'warning'
    ELSE 'healthy'
  END as health_status,
  rm.last_request,
  re.last_error
FROM recent_metrics rm
FULL OUTER JOIN recent_errors re ON rm.function_name = re.function_name;

-- Performance Trends View (hourly aggregated)
CREATE OR REPLACE VIEW function_performance_trends AS
SELECT 
  function_name,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as request_count,
  AVG(execution_time_ms) as avg_execution_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY execution_time_ms) as p50_execution_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99_execution_time,
  MAX(execution_time_ms) as max_execution_time,
  AVG(CASE WHEN memory_used_mb IS NOT NULL THEN memory_used_mb END) as avg_memory_usage,
  SUM(CASE WHEN cold_start THEN 1 ELSE 0 END) as cold_starts,
  SUM(CASE WHEN cold_start THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) as cold_start_rate,
  AVG(CASE WHEN request_size_bytes IS NOT NULL THEN request_size_bytes END) as avg_request_size,
  AVG(CASE WHEN response_size_bytes IS NOT NULL THEN response_size_bytes END) as avg_response_size
FROM function_performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY function_name, DATE_TRUNC('hour', timestamp)
ORDER BY function_name, hour DESC;

-- Error Analysis View
CREATE OR REPLACE VIEW function_error_analysis AS
SELECT 
  function_name,
  error_type,
  COUNT(*) as occurrence_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count,
  COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
  COUNT(*) FILTER (WHERE severity = 'low') as low_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence,
  AVG(CASE WHEN resolved THEN 
    EXTRACT(EPOCH FROM (resolved_at - timestamp))/60 
  END) as avg_resolution_time_minutes
FROM function_error_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY function_name, error_type
ORDER BY occurrence_count DESC;

-- Active Alerts View
CREATE OR REPLACE VIEW active_alerts AS
SELECT 
  id,
  alert_type,
  function_name,
  metric,
  value,
  threshold,
  message,
  alert_data,
  created_at,
  NOW() - created_at as age
FROM function_alerts
WHERE resolved = false
ORDER BY 
  CASE alert_type
    WHEN 'critical_error' THEN 1
    WHEN 'error_rate_critical' THEN 2
    WHEN 'performance_critical' THEN 3
    ELSE 4
  END,
  created_at DESC;

-- Function to auto-resolve old alerts
CREATE OR REPLACE FUNCTION auto_resolve_alerts()
RETURNS void AS $$
BEGIN
  -- Auto-resolve performance alerts older than 1 hour if conditions improved
  UPDATE function_alerts 
  SET 
    resolved = true,
    resolved_at = NOW(),
    resolved_by = 'auto_resolution'
  WHERE 
    resolved = false 
    AND alert_type LIKE '%_warning'
    AND created_at < NOW() - INTERVAL '1 hour';
    
  -- Auto-resolve error alerts if no recent errors
  WITH recent_errors AS (
    SELECT DISTINCT function_name
    FROM function_error_events
    WHERE timestamp > NOW() - INTERVAL '30 minutes'
  )
  UPDATE function_alerts 
  SET 
    resolved = true,
    resolved_at = NOW(),
    resolved_by = 'auto_resolution'
  WHERE 
    resolved = false 
    AND alert_type LIKE 'error_rate_%'
    AND created_at < NOW() - INTERVAL '30 minutes'
    AND function_name NOT IN (SELECT function_name FROM recent_errors);
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old performance metrics (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM function_performance_metrics 
  WHERE timestamp < NOW() - INTERVAL '7 days';
  
  DELETE FROM function_error_events 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  DELETE FROM function_alerts 
  WHERE resolved = true AND resolved_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup jobs
SELECT cron.schedule(
  'cleanup-performance-metrics',
  '0 3 * * *', -- 3 AM daily
  'SELECT cleanup_old_performance_metrics();'
);

SELECT cron.schedule(
  'auto-resolve-alerts',
  '*/15 * * * *', -- Every 15 minutes
  'SELECT auto_resolve_alerts();'
);

-- Function-specific monitoring functions
CREATE OR REPLACE FUNCTION get_function_sla_metrics(
  p_function_name TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  uptime_percentage DECIMAL(5,2),
  avg_response_time_ms DECIMAL(10,2),
  error_rate DECIMAL(5,4),
  p99_response_time_ms DECIMAL(10,2),
  total_requests BIGINT,
  total_errors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH function_stats AS (
    SELECT 
      COUNT(*) as requests,
      AVG(execution_time_ms) as avg_time,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99_time
    FROM function_performance_metrics
    WHERE function_name = p_function_name
      AND timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  ),
  error_stats AS (
    SELECT COUNT(*) as errors
    FROM function_error_events
    WHERE function_name = p_function_name
      AND timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  )
  SELECT 
    CASE 
      WHEN fs.requests = 0 THEN 0::DECIMAL(5,2)
      ELSE ((fs.requests - COALESCE(es.errors, 0))::DECIMAL / fs.requests * 100)::DECIMAL(5,2)
    END as uptime_percentage,
    COALESCE(fs.avg_time, 0)::DECIMAL(10,2) as avg_response_time_ms,
    CASE 
      WHEN fs.requests = 0 THEN 0::DECIMAL(5,4)
      ELSE (COALESCE(es.errors, 0)::DECIMAL / fs.requests)::DECIMAL(5,4)
    END as error_rate,
    COALESCE(fs.p99_time, 0)::DECIMAL(10,2) as p99_response_time_ms,
    COALESCE(fs.requests, 0) as total_requests,
    COALESCE(es.errors, 0) as total_errors
  FROM function_stats fs
  CROSS JOIN error_stats es;
END;
$$ LANGUAGE plpgsql;

-- Real-time monitoring view for dashboard
CREATE OR REPLACE VIEW real_time_monitoring AS
SELECT 
  function_name,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 minute') as requests_last_minute,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes') as requests_last_5min,
  AVG(execution_time_ms) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes') as avg_response_time_5min,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '5 minutes' AND cold_start = true) as cold_starts_5min,
  (SELECT COUNT(*) FROM function_error_events fe 
   WHERE fe.function_name = fpm.function_name 
   AND fe.timestamp > NOW() - INTERVAL '5 minutes') as errors_last_5min,
  MAX(timestamp) as last_request_time
FROM function_performance_metrics fpm
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY function_name
ORDER BY requests_last_minute DESC;

-- Row Level Security
ALTER TABLE function_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for service role access (edge functions)
CREATE POLICY "Service role full access performance" ON function_performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access errors" ON function_error_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access alerts" ON function_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for authenticated admin users
CREATE POLICY "Admins can view performance metrics" ON function_performance_metrics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can view error events" ON function_error_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can manage alerts" ON function_alerts
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE function_performance_metrics IS 'Tracks performance metrics for all edge functions including execution time, memory usage, and cold starts';
COMMENT ON TABLE function_error_events IS 'Records all errors that occur in edge functions with full context for debugging';
COMMENT ON TABLE function_alerts IS 'Stores alerts triggered by performance or error thresholds';
COMMENT ON VIEW function_health_status IS 'Real-time health status for all edge functions';
COMMENT ON VIEW function_performance_trends IS 'Hourly performance trends for capacity planning and optimization';
COMMENT ON VIEW function_error_analysis IS 'Error pattern analysis for debugging and improvements';
COMMENT ON VIEW active_alerts IS 'Currently active alerts requiring attention';
COMMENT ON FUNCTION get_function_sla_metrics IS 'Calculates SLA metrics for a specific function over a time period';