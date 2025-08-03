# FADDL Match Edge Functions Monitoring & Incident Response Runbook

## Overview

This runbook provides comprehensive guidance for monitoring, troubleshooting, and resolving issues with FADDL Match edge functions. All edge functions are instrumented with real-time performance monitoring, error tracking, and automated alerting.

## 🏗️ Architecture Overview

### Monitored Edge Functions
- **auth-sync-user**: Clerk → Supabase user synchronization
- **profile-create**: Profile creation with Islamic compliance validation  
- **profile-update**: Profile modification workflows
- **messages-send**: Message handling with cultural compliance
- **matches-generate**: AI-powered matching algorithm
- **monitoring-dashboard**: Real-time monitoring API

### Monitoring Infrastructure
- **Performance Metrics**: Execution time, memory usage, cold starts
- **Error Tracking**: Comprehensive error logging with context
- **Real-time Alerts**: Automated notifications for critical issues
- **Health Monitoring**: Continuous health status tracking
- **SLA Tracking**: Uptime and performance SLA monitoring

## 📊 Performance Targets & SLAs

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Execution Time** | <500ms | >1s | >3s |
| **Error Rate** | <0.1% | >5% | >10% |
| **Cold Start Rate** | <5% | >10% | >20% |
| **Uptime** | >99.9% | <99.5% | <99% |
| **Memory Usage** | <100MB | >150MB | >200MB |

## 🚨 Alert Types & Severity

### Critical Alerts (Immediate Response Required)
- **critical_error**: Unhandled exceptions in edge functions
- **error_rate_critical**: Error rate >10% in 5-minute window
- **performance_critical**: Execution time >3 seconds

### Warning Alerts (Response within 1 hour)
- **error_rate_warning**: Error rate >5% in 5-minute window  
- **performance_warning**: Execution time >1 second
- **cold_start_warning**: Cold start rate >10% in 15-minute window

### Info Alerts (Response within 24 hours)
- **monitoring_test**: Test alerts from monitoring system
- **maintenance**: Scheduled maintenance notifications

## 🔍 Monitoring Dashboard Access

### Real-time Dashboard
```bash
# Get current health status
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=health"

# Get performance metrics for last 4 hours  
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/functions/v1/monitoring-dashboard?timeframe=4h&metric_type=performance"

# Get error analysis
curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/functions/v1/monitoring-dashboard?metric_type=errors"
```

### Database Queries
```sql
-- Check current health status
SELECT * FROM function_health_status ORDER BY health_status DESC;

-- View active alerts
SELECT * FROM active_alerts ORDER BY created_at DESC;

-- Performance trends (last 24 hours)
SELECT * FROM function_performance_trends 
WHERE hour > NOW() - INTERVAL '24 hours'
ORDER BY hour DESC;

-- Error analysis
SELECT * FROM function_error_analysis 
ORDER BY occurrence_count DESC;
```

## 🛠️ Troubleshooting Procedures

### High Error Rate Alert

**Symptoms**: Error rate >5% in 5-minute window

**Investigation Steps**:
1. Check error breakdown by function:
```sql
SELECT function_name, error_type, COUNT(*) as count
FROM function_error_events 
WHERE timestamp > NOW() - INTERVAL '15 minutes'
GROUP BY function_name, error_type
ORDER BY count DESC;
```

2. Check recent error details:
```sql
SELECT * FROM function_error_events 
WHERE timestamp > NOW() - INTERVAL '15 minutes'
  AND severity IN ('high', 'critical')
ORDER BY timestamp DESC;
```

3. Identify patterns:
   - **Database connectivity**: Check Supabase status
   - **Authentication issues**: Verify Clerk service status
   - **Rate limiting**: Check rate limit events
   - **Validation errors**: Review request data patterns

**Resolution Actions**:
- For database issues: Check connection pool, restart functions
- For auth issues: Verify Clerk webhook configuration
- For validation errors: Update validation logic or client requests
- For rate limiting: Adjust limits or implement queuing

### High Execution Time Alert

**Symptoms**: Average execution time >1 second

**Investigation Steps**:
1. Check performance breakdown:
```sql
SELECT function_name, 
       AVG(execution_time_ms) as avg_time,
       PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_time,
       COUNT(*) as request_count
FROM function_performance_metrics 
WHERE timestamp > NOW() - INTERVAL '15 minutes'
GROUP BY function_name
ORDER BY avg_time DESC;
```

2. Check for cold starts:
```sql
SELECT function_name, 
       SUM(CASE WHEN cold_start THEN 1 ELSE 0 END) as cold_starts,
       COUNT(*) as total_requests,
       (SUM(CASE WHEN cold_start THEN 1 ELSE 0 END)::float / COUNT(*)) as cold_start_rate
FROM function_performance_metrics 
WHERE timestamp > NOW() - INTERVAL '15 minutes'
GROUP BY function_name;
```

**Resolution Actions**:
- **High cold start rate**: Implement keep-warm strategy
- **Database queries**: Optimize slow queries, add indexes
- **External API calls**: Add timeout and retry logic
- **Large payloads**: Implement compression or pagination
- **Memory usage**: Profile and optimize memory-intensive operations

### Function Unavailable

**Symptoms**: Function returning 500 errors or not responding

**Investigation Steps**:
1. Check function deployment status in Supabase dashboard
2. Review recent error logs:
```sql
SELECT * FROM function_error_events 
WHERE function_name = 'failing-function-name'
  AND timestamp > NOW() - INTERVAL '30 minutes'
ORDER BY timestamp DESC;
```

3. Test function directly:
```bash
curl -X OPTIONS \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/functions/v1/function-name"
```

**Resolution Actions**:
- Redeploy function if deployment issue
- Check environment variables and secrets
- Review recent code changes
- Scale up if resource exhaustion

### Security Alert Investigation

**Symptoms**: High-risk security events or suspicious activity

**Investigation Steps**:
1. Check high-risk security events:
```sql
SELECT * FROM high_risk_security_events 
ORDER BY risk_score DESC, created_at DESC;
```

2. Analyze IP reputation:
```sql
SELECT * FROM ip_reputation 
WHERE reputation = 'HIGH_RISK'
ORDER BY avg_risk_score DESC;
```

3. Check JWT validation failures:
```sql
SELECT ip_address, COUNT(*) as failures
FROM security_events 
WHERE event_type = 'jwt_validation_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY failures DESC;
```

**Resolution Actions**:
- Block suspicious IPs at CDN/firewall level
- Implement additional rate limiting
- Review authentication configuration
- Alert security team for investigation

## 🔄 Recovery Procedures

### Function Restart
```bash
# Redeploy specific function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy
```

### Database Connection Issues
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill hanging queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
  AND query_start < NOW() - INTERVAL '1 hour';
```

### Cache Clear (if applicable)
```bash
# Clear function cache (implementation dependent)
curl -X POST \
  -H "Authorization: Bearer $ADMIN_KEY" \
  "$SUPABASE_URL/rest/v1/rpc/clear_function_cache"
```

## 📞 Escalation Procedures

### Level 1: Development Team
- **Trigger**: Warning alerts, performance degradation
- **Response Time**: 1 hour during business hours
- **Contact**: Development team Slack channel

### Level 2: Infrastructure Team  
- **Trigger**: Critical alerts, service unavailable
- **Response Time**: 30 minutes, 24/7
- **Contact**: Infrastructure on-call rotation

### Level 3: Executive Team
- **Trigger**: Extended outage (>1 hour), security incident
- **Response Time**: 15 minutes, 24/7
- **Contact**: CTO, CEO notification

## 🔧 Maintenance Procedures

### Daily Maintenance
- Review performance trends and error patterns
- Check for new alerts and resolve warnings
- Verify monitoring system health
- Update performance baselines if needed

### Weekly Maintenance
- Analyze performance trends for optimization opportunities
- Review and resolve non-critical alerts
- Update monitoring thresholds based on traffic patterns
- Clean up old monitoring data (automated)

### Monthly Maintenance
- Review SLA performance and adjust targets
- Analyze error patterns for code improvements
- Update monitoring documentation
- Test disaster recovery procedures

## 📈 Performance Optimization

### Query Optimization
```sql
-- Find slow functions
SELECT function_name, AVG(execution_time_ms) as avg_time
FROM function_performance_metrics 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY function_name
HAVING AVG(execution_time_ms) > 1000
ORDER BY avg_time DESC;
```

### Memory Optimization
```sql
-- Check memory usage patterns
SELECT function_name, AVG(memory_used_mb) as avg_memory
FROM function_performance_metrics 
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND memory_used_mb IS NOT NULL
GROUP BY function_name
ORDER BY avg_memory DESC;
```

### Cold Start Reduction
- Implement keep-warm strategies
- Optimize import statements and initialization
- Use lighter runtime dependencies
- Consider connection pooling

## 🚨 Emergency Contacts

| Role | Contact Method | Response Time |
|------|---------------|---------------|
| **DevOps Engineer** | Slack: @devops-oncall | 15 minutes |
| **Backend Lead** | Phone: +1-xxx-xxx-xxxx | 30 minutes |
| **CTO** | Emergency: +1-xxx-xxx-xxxx | 1 hour |
| **Supabase Support** | support@supabase.com | 2-4 hours |

## 📚 Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Performance Monitoring Best Practices](internal-wiki/monitoring-best-practices)
- [Incident Response Playbook](internal-wiki/incident-response)
- [Security Incident Procedures](internal-wiki/security-incidents)

---

**Last Updated**: January 2025  
**Next Review**: February 2025  
**Document Owner**: DevOps Team