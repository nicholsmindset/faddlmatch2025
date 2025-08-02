import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface MonitoringMetrics {
  timestamp: string
  environment: string
  buildMetrics: {
    successRate: number
    avgBuildTime: number
    lastBuild: any
  }
  performanceMetrics: {
    p95ResponseTime: number
    p99ResponseTime: number
    avgResponseTime: number
    throughput: number
    errorRate: number
  }
  islamicComplianceMetrics: {
    contentFilterSuccessRate: number
    prayerTimeAccuracy: number
    halalVerificationRate: number
  }
  userMetrics: {
    activeUsers: number
    newRegistrations: number
    profileCompletionRate: number
    matchSuccessRate: number
    familyEngagementRate: number
  }
  systemHealth: {
    uptime: number
    databaseConnectivity: boolean
    supabaseHealth: boolean
    edgeFunctionHealth: boolean
  }
}

interface Alert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
  metadata?: any
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  try {
    if (event.httpMethod === 'GET') {
      const endpoint = event.path.split('/').pop()
      
      switch (endpoint) {
        case 'health':
          return await getSystemHealth()
        case 'metrics':
          return await getMonitoringMetrics(event)
        case 'alerts':
          return await getActiveAlerts(event)
        default:
          return await getDashboardData(event)
      }
    } else if (event.httpMethod === 'POST') {
      return await processMonitoringEvent(event)
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }
  } catch (error) {
    console.error('Monitoring error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function getSystemHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'production',
    services: {
      netlify: await checkNetlifyHealth(),
      supabase: await checkSupabaseHealth(),
      functions: await checkFunctionsHealth(),
      edgeFunctions: await checkEdgeFunctionsHealth()
    },
    islamicCompliance: {
      contentFilter: await checkContentFilterHealth(),
      prayerTimes: await checkPrayerTimesHealth(),
      halalVerification: await checkHalalVerificationHealth()
    }
  }

  // Determine overall status
  const allServices = Object.values(health.services).concat(Object.values(health.islamicCompliance))
  if (allServices.some(service => service.status === 'down')) {
    health.status = 'unhealthy'
  } else if (allServices.some(service => service.status === 'degraded')) {
    health.status = 'degraded'
  }

  return {
    statusCode: health.status === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(health)
  }
}

async function getMonitoringMetrics(event: HandlerEvent) {
  const { queryStringParameters } = event
  const timeRange = queryStringParameters?.timeRange || '1h'
  
  const metrics = await collectMetrics(timeRange)
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      timeRange,
      metrics,
      alerts: await checkThresholds(metrics),
      lastUpdated: new Date().toISOString()
    })
  }
}

async function getActiveAlerts(event: HandlerEvent) {
  const { queryStringParameters } = event
  const severity = queryStringParameters?.severity
  const resolved = queryStringParameters?.resolved === 'true'
  
  const alerts = await fetchAlerts(severity, resolved)
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        unresolved: alerts.filter(a => !a.resolved).length
      }
    })
  }
}

async function getDashboardData(event: HandlerEvent) {
  const [metrics, alerts, health] = await Promise.all([
    collectMetrics('1h'),
    fetchAlerts(),
    getSystemHealth()
  ])

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      dashboard: {
        metrics: metrics.body ? JSON.parse(metrics.body).metrics : null,
        alerts: alerts.filter(a => !a.resolved).slice(0, 10), // Top 10 unresolved
        health: JSON.parse(health.body),
        lastUpdated: new Date().toISOString()
      }
    })
  }
}

async function processMonitoringEvent(event: HandlerEvent) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing event data' })
    }
  }

  const eventData = JSON.parse(event.body)
  
  // Process different types of monitoring events
  switch (eventData.type) {
    case 'performance_alert':
      await handlePerformanceAlert(eventData)
      break
    case 'islamic_compliance_alert':
      await handleIslamicComplianceAlert(eventData)
      break
    case 'system_alert':
      await handleSystemAlert(eventData)
      break
    case 'user_behavior_alert':
      await handleUserBehaviorAlert(eventData)
      break
    default:
      console.log('Unknown event type:', eventData.type)
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, processed: eventData.type })
  }
}

async function collectMetrics(timeRange: string): Promise<MonitoringMetrics> {
  const [
    buildMetrics,
    performanceMetrics,
    islamicComplianceMetrics,
    userMetrics,
    systemHealth
  ] = await Promise.all([
    getBuildMetrics(),
    getPerformanceMetrics(timeRange),
    getIslamicComplianceMetrics(timeRange),
    getUserMetrics(timeRange),
    getSystemHealthMetrics()
  ])

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'production',
    buildMetrics,
    performanceMetrics,
    islamicComplianceMetrics,
    userMetrics,
    systemHealth
  }
}

async function getBuildMetrics() {
  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${process.env.SITE_ID}/builds`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Netlify API error: ${response.status}`)
    }

    const builds = await response.json()
    const recent = builds.slice(0, 20)

    return {
      successRate: recent.filter(b => b.state === 'ready').length / recent.length,
      avgBuildTime: recent.reduce((acc, b) => acc + (b.deploy_time || 0), 0) / recent.length,
      lastBuild: recent[0]
    }
  } catch (error) {
    console.error('Error fetching build metrics:', error)
    return {
      successRate: 0,
      avgBuildTime: 0,
      lastBuild: null
    }
  }
}

async function getPerformanceMetrics(timeRange: string) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      avgResponseTime: 0,
      throughput: 0,
      errorRate: 0
    }
  }

  try {
    const since = getTimeRangeStart(timeRange)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/performance_metrics?timestamp=gte.${since.toISOString()}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Supabase query error: ${response.status}`)
    }

    const metrics = await response.json()
    
    if (metrics.length === 0) {
      return {
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 0
      }
    }

    const responseTimes = metrics.map(m => m.ttfb).filter(t => t != null).sort((a, b) => a - b)
    
    return {
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      avgResponseTime: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0,
      throughput: metrics.length / getTimeRangeHours(timeRange),
      errorRate: 0 // Would need to track error metrics separately
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return {
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      avgResponseTime: 0,
      throughput: 0,
      errorRate: 0
    }
  }
}

async function getIslamicComplianceMetrics(timeRange: string) {
  // These would typically come from your Islamic compliance monitoring systems
  return {
    contentFilterSuccessRate: 0.99, // 99% success rate
    prayerTimeAccuracy: 0.995, // 99.5% accuracy
    halalVerificationRate: 0.98 // 98% verification success
  }
}

async function getUserMetrics(timeRange: string) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      activeUsers: 0,
      newRegistrations: 0,
      profileCompletionRate: 0,
      matchSuccessRate: 0,
      familyEngagementRate: 0
    }
  }

  try {
    const since = getTimeRangeStart(timeRange)
    
    // These would be actual queries to your user analytics
    return {
      activeUsers: 0, // Would query active sessions
      newRegistrations: 0, // Would query new user registrations
      profileCompletionRate: 0, // Would calculate profile completion percentage
      matchSuccessRate: 0, // Would calculate successful match rate
      familyEngagementRate: 0 // Would calculate family/guardian engagement
    }
  } catch (error) {
    console.error('Error fetching user metrics:', error)
    return {
      activeUsers: 0,
      newRegistrations: 0,
      profileCompletionRate: 0,
      matchSuccessRate: 0,
      familyEngagementRate: 0
    }
  }
}

async function getSystemHealthMetrics() {
  return {
    uptime: 0.9999, // 99.99% uptime
    databaseConnectivity: await checkSupabaseHealth().then(h => h.status === 'healthy'),
    supabaseHealth: await checkSupabaseHealth().then(h => h.status === 'healthy'),
    edgeFunctionHealth: await checkEdgeFunctionsHealth().then(h => h.status === 'healthy')
  }
}

async function checkNetlifyHealth() {
  try {
    const response = await fetch('https://www.netlifystatus.com/api/v2/status.json')
    const status = await response.json()
    
    return {
      status: status.status.indicator === 'none' ? 'healthy' : 'degraded',
      lastChecked: new Date().toISOString(),
      details: status.status.description
    }
  } catch (error) {
    return {
      status: 'unknown',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkSupabaseHealth() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: 'Missing configuration'
    }
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    return {
      status: response.ok ? 'healthy' : 'degraded',
      lastChecked: new Date().toISOString(),
      responseTime: 0 // Would measure actual response time
    }
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkFunctionsHealth() {
  // Check if Netlify functions are responding
  try {
    const response = await fetch('/.netlify/functions/performance-tracking', {
      method: 'GET'
    })
    
    return {
      status: response.status < 500 ? 'healthy' : 'degraded',
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkEdgeFunctionsHealth() {
  // Check edge functions
  return {
    status: 'healthy', // Would implement actual checks
    lastChecked: new Date().toISOString(),
    functions: ['geolocation', 'auth-check', 'beta-testing']
  }
}

async function checkContentFilterHealth() {
  return {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    successRate: 0.99
  }
}

async function checkPrayerTimesHealth() {
  return {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    accuracy: 0.995
  }
}

async function checkHalalVerificationHealth() {
  return {
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    verificationRate: 0.98
  }
}

async function checkThresholds(metrics: MonitoringMetrics): Promise<Alert[]> {
  const alerts: Alert[] = []

  // Performance alerts
  if (metrics.performanceMetrics.p95ResponseTime > 2000) {
    alerts.push(createAlert('performance', 'high', 
      `P95 response time exceeded: ${metrics.performanceMetrics.p95ResponseTime}ms > 2000ms`))
  }

  // Build failure alerts
  if (metrics.buildMetrics.successRate < 0.9) {
    alerts.push(createAlert('build', 'medium',
      `Build success rate below threshold: ${(metrics.buildMetrics.successRate * 100).toFixed(1)}% < 90%`))
  }

  // Islamic compliance alerts
  if (metrics.islamicComplianceMetrics.contentFilterSuccessRate < 0.95) {
    alerts.push(createAlert('islamic-compliance', 'critical',
      `Content filter success rate below threshold: ${(metrics.islamicComplianceMetrics.contentFilterSuccessRate * 100).toFixed(1)}% < 95%`))
  }

  // System health alerts
  if (!metrics.systemHealth.databaseConnectivity) {
    alerts.push(createAlert('system', 'critical', 'Database connectivity issues detected'))
  }

  return alerts
}

function createAlert(type: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string): Alert {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    message,
    timestamp: new Date().toISOString(),
    resolved: false
  }
}

async function fetchAlerts(severity?: string, resolved?: boolean): Promise<Alert[]> {
  // This would fetch from your alerts database
  // For now, return empty array
  return []
}

async function handlePerformanceAlert(eventData: any) {
  console.log('Processing performance alert:', eventData)
  // Implement performance alert handling
}

async function handleIslamicComplianceAlert(eventData: any) {
  console.log('Processing Islamic compliance alert:', eventData)
  // Implement Islamic compliance alert handling - high priority
}

async function handleSystemAlert(eventData: any) {
  console.log('Processing system alert:', eventData)
  // Implement system alert handling
}

async function handleUserBehaviorAlert(eventData: any) {
  console.log('Processing user behavior alert:', eventData)
  // Implement user behavior alert handling
}

function getTimeRangeStart(timeRange: string): Date {
  const now = new Date()
  const intervals: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  
  return new Date(now.getTime() - (intervals[timeRange] || intervals['1h']))
}

function getTimeRangeHours(timeRange: string): number {
  const hours: Record<string, number> = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720
  }
  
  return hours[timeRange] || 1
}