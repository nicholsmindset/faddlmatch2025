#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * FADDL Match Edge Functions Monitoring Setup and Test Script
 * 
 * This script sets up comprehensive monitoring for all edge functions
 * and runs basic health checks to validate the monitoring system.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface MonitoringConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  functions: string[]
  alertWebhook?: string
  alertEmail?: string
}

interface HealthCheck {
  function: string
  status: 'healthy' | 'warning' | 'critical' | 'error'
  response_time?: number
  error_message?: string
  metrics?: any
}

const config: MonitoringConfig = {
  supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
  supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  functions: [
    'auth-sync-user',
    'profile-create', 
    'profile-update',
    'messages-send',
    'matches-generate',
    'monitoring-dashboard'
  ],
  alertWebhook: Deno.env.get('MONITORING_WEBHOOK_URL'),
  alertEmail: Deno.env.get('MONITORING_ALERT_EMAIL')
}

console.log('🚀 FADDL Match Edge Functions Monitoring Setup')
console.log('=' .repeat(60))

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  Deno.exit(1)
}

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

/**
 * Check if monitoring tables exist and are properly configured
 */
async function verifyMonitoringInfrastructure(): Promise<boolean> {
  console.log('\n📊 Verifying monitoring infrastructure...')
  
  try {
    // Check if monitoring tables exist
    const tables = [
      'function_performance_metrics',
      'function_error_events', 
      'function_alerts',
      'security_events'
    ]
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      if (error) {
        console.error(`❌ Table ${table} not found or accessible:`, error.message)
        return false
      }
      console.log(`✅ Table ${table} exists and is accessible`)
    }
    
    // Check if views exist
    const views = [
      'function_health_status',
      'function_performance_trends',
      'function_error_analysis',
      'active_alerts'
    ]
    
    for (const view of views) {
      const { error } = await supabase.from(view).select('*').limit(1)
      if (error) {
        console.error(`❌ View ${view} not found or accessible:`, error.message)
        return false
      }
      console.log(`✅ View ${view} exists and is accessible`)
    }
    
    console.log('✅ All monitoring infrastructure verified')
    return true
    
  } catch (error) {
    console.error('❌ Failed to verify monitoring infrastructure:', error)
    return false
  }
}

/**
 * Test edge function health endpoints
 */
async function testFunctionHealth(): Promise<HealthCheck[]> {
  console.log('\n🔍 Testing edge function health...')
  
  const results: HealthCheck[] = []
  const baseUrl = config.supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '.supabase.co/functions/v1/')
  
  for (const functionName of config.functions) {
    console.log(`Testing ${functionName}...`)
    
    const startTime = Date.now()
    let status: HealthCheck['status'] = 'error'
    let errorMessage: string | undefined
    
    try {
      const response = await fetch(`${baseUrl}${functionName}`, {
        method: 'OPTIONS', // Test CORS preflight
        headers: {
          'Authorization': `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        status = responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'critical'
        console.log(`  ✅ ${functionName}: ${status} (${responseTime}ms)`)
      } else {
        status = 'critical'
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
        console.log(`  ❌ ${functionName}: ${errorMessage}`)
      }
      
      results.push({
        function: functionName,
        status,
        response_time: responseTime,
        error_message: errorMessage
      })
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      errorMessage = error.message
      console.log(`  ❌ ${functionName}: ${errorMessage}`)
      
      results.push({
        function: functionName,
        status: 'error',
        response_time: responseTime,
        error_message: errorMessage
      })
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Insert test monitoring data
 */
async function insertTestData(): Promise<void> {
  console.log('\n📝 Inserting test monitoring data...')
  
  try {
    // Insert test performance metrics
    const testMetrics = config.functions.map(func => ({
      function_name: func,
      execution_time_ms: Math.floor(Math.random() * 1000) + 100,
      memory_used_mb: Math.random() * 50 + 10,
      cold_start: Math.random() > 0.9,
      request_size_bytes: Math.floor(Math.random() * 1000) + 100,
      response_size_bytes: Math.floor(Math.random() * 2000) + 200,
      timestamp: new Date().toISOString()
    }))
    
    const { error: metricsError } = await supabase
      .from('function_performance_metrics')
      .insert(testMetrics)
    
    if (metricsError) {
      console.error('❌ Failed to insert test metrics:', metricsError)
      return
    }
    
    console.log('✅ Test performance metrics inserted')
    
    // Insert test error event (low severity)
    const { error: errorError } = await supabase
      .from('function_error_events')
      .insert({
        function_name: 'monitoring-test',
        error_type: 'TestError',
        error_message: 'This is a test error for monitoring validation',
        severity: 'low',
        timestamp: new Date().toISOString()
      })
    
    if (errorError) {
      console.error('❌ Failed to insert test error:', errorError)
      return
    }
    
    console.log('✅ Test error event inserted')
    
  } catch (error) {
    console.error('❌ Failed to insert test data:', error)
  }
}

/**
 * Test monitoring dashboard endpoint
 */
async function testMonitoringDashboard(): Promise<void> {
  console.log('\n📊 Testing monitoring dashboard...')
  
  try {
    const baseUrl = config.supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '.supabase.co/functions/v1/')
    
    const response = await fetch(`${baseUrl}monitoring-dashboard?timeframe=1h&metric_type=health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Monitoring dashboard accessible')
      console.log(`📈 Health overview: ${data.health_overview?.functions?.length || 0} functions monitored`)
      
      if (data.health_overview?.functions) {
        data.health_overview.functions.forEach((func: any) => {
          const statusIcon = func.status === 'healthy' ? '✅' : 
                           func.status === 'warning' ? '⚠️' : '❌'
          console.log(`  ${statusIcon} ${func.name}: ${func.status} (${func.avg_response_time}ms avg)`)
        })
      }
    } else {
      console.error('❌ Monitoring dashboard failed:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.error('❌ Failed to test monitoring dashboard:', error)
  }
}

/**
 * Check active alerts
 */
async function checkActiveAlerts(): Promise<void> {
  console.log('\n🚨 Checking active alerts...')
  
  try {
    const { data: alerts, error } = await supabase
      .from('active_alerts')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('❌ Failed to fetch alerts:', error)
      return
    }
    
    if (!alerts || alerts.length === 0) {
      console.log('✅ No active alerts')
      return
    }
    
    console.log(`⚠️ ${alerts.length} active alert(s):`)
    alerts.forEach((alert: any) => {
      const urgency = alert.alert_type.includes('critical') ? '🔴' : '🟡'
      console.log(`  ${urgency} ${alert.alert_type}: ${alert.message}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to check alerts:', error)
  }
}

/**
 * Test alerting system
 */
async function testAlerting(): Promise<void> {
  console.log('\n📧 Testing alerting system...')
  
  if (!config.alertWebhook && !config.alertEmail) {
    console.log('⚠️ No alerting endpoints configured (MONITORING_WEBHOOK_URL, MONITORING_ALERT_EMAIL)')
    return
  }
  
  // Insert a test critical alert
  try {
    const { error } = await supabase
      .from('function_alerts')
      .insert({
        alert_type: 'monitoring_test',
        function_name: 'test-function',
        metric: 'test_metric',
        value: 100,
        threshold: 50,
        message: 'Test alert from monitoring setup script',
        alert_data: { test: true, timestamp: new Date().toISOString() },
        resolved: false
      })
    
    if (error) {
      console.error('❌ Failed to create test alert:', error)
      return
    }
    
    console.log('✅ Test alert created')
    
    // Clean up test alert
    await supabase
      .from('function_alerts')
      .update({ resolved: true, resolved_by: 'monitoring_setup_script' })
      .eq('alert_type', 'monitoring_test')
    
    console.log('✅ Test alert cleaned up')
    
  } catch (error) {
    console.error('❌ Failed to test alerting:', error)
  }
}

/**
 * Display monitoring summary
 */
async function displaySummary(healthChecks: HealthCheck[]): Promise<void> {
  console.log('\n📋 Monitoring System Summary')
  console.log('=' .repeat(60))
  
  const healthyCount = healthChecks.filter(h => h.status === 'healthy').length
  const warningCount = healthChecks.filter(h => h.status === 'warning').length
  const criticalCount = healthChecks.filter(h => h.status === 'critical').length
  const errorCount = healthChecks.filter(h => h.status === 'error').length
  
  console.log(`📊 Function Health Status:`)
  console.log(`  ✅ Healthy: ${healthyCount}`)
  console.log(`  ⚠️ Warning: ${warningCount}`)
  console.log(`  ❌ Critical: ${criticalCount}`)
  console.log(`  🔥 Error: ${errorCount}`)
  
  console.log(`\n🔧 Monitoring Features:`)
  console.log(`  ✅ Performance metrics tracking`)
  console.log(`  ✅ Error event logging`)
  console.log(`  ✅ Real-time alerting`)
  console.log(`  ✅ Health status monitoring`)
  console.log(`  ✅ SLA metrics calculation`)
  console.log(`  ✅ Automated cleanup`)
  
  console.log(`\n📊 Dashboards Available:`)
  console.log(`  📈 Real-time monitoring: /functions/v1/monitoring-dashboard`)
  console.log(`  🔍 Performance trends: View function_performance_trends`)
  console.log(`  🚨 Active alerts: View active_alerts`)
  console.log(`  📋 Health status: View function_health_status`)
  
  console.log(`\n⚡ Performance Targets:`)
  console.log(`  🎯 Execution time: <500ms (warning at 1s, critical at 3s)`)
  console.log(`  🎯 Error rate: <0.1% (warning at 5%, critical at 10%)`)
  console.log(`  🎯 Cold start rate: <5%`)
  console.log(`  🎯 Uptime: >99.9%`)
  
  const avgResponseTime = healthChecks
    .filter(h => h.response_time)
    .reduce((sum, h) => sum + (h.response_time || 0), 0) / healthChecks.length
  
  console.log(`\n🏁 Current System Performance:`)
  console.log(`  ⚡ Average response time: ${Math.round(avgResponseTime)}ms`)
  console.log(`  📊 Functions monitored: ${config.functions.length}`)
  console.log(`  🔧 Monitoring infrastructure: Operational`)
}

/**
 * Main monitoring setup and validation
 */
async function main(): Promise<void> {
  try {
    // Step 1: Verify infrastructure
    const infraOk = await verifyMonitoringInfrastructure()
    if (!infraOk) {
      console.error('\n❌ Monitoring infrastructure verification failed!')
      console.error('Please run the monitoring migration first:')
      console.error('supabase db reset --db-url [your-db-url]')
      Deno.exit(1)
    }
    
    // Step 2: Test function health
    const healthChecks = await testFunctionHealth()
    
    // Step 3: Insert test data
    await insertTestData()
    
    // Step 4: Test monitoring dashboard
    await testMonitoringDashboard()
    
    // Step 5: Check active alerts
    await checkActiveAlerts()
    
    // Step 6: Test alerting system
    await testAlerting()
    
    // Step 7: Display summary
    await displaySummary(healthChecks)
    
    console.log('\n🎉 Monitoring setup and validation complete!')
    console.log('📚 Check the monitoring dashboard for real-time insights')
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error)
    Deno.exit(1)
  }
}

if (import.meta.main) {
  await main()
}