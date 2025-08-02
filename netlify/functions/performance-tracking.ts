import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

interface PerformanceMetric {
  metricName: string
  value: number
  timestamp: string
  page: string
  userAgent?: string
  connection?: string
  deviceType?: string
  location?: string
}

interface PerformanceReport {
  timestamp: string
  metrics: {
    lcp?: number
    fid?: number
    cls?: number
    ttfb?: number
    tti?: number
    fcp?: number
  }
  page: string
  sessionId: string
  userId?: string
  deviceInfo: {
    type: string
    connection: string
    viewport: string
  }
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
    if (event.httpMethod === 'POST') {
      return await handlePerformanceReport(event)
    } else if (event.httpMethod === 'GET') {
      return await getPerformanceMetrics(event)
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }
  } catch (error) {
    console.error('Performance tracking error:', error)
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

async function handlePerformanceReport(event: HandlerEvent) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' })
    }
  }

  const report: PerformanceReport = JSON.parse(event.body)
  
  // Validate required fields
  if (!report.timestamp || !report.page || !report.metrics) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid performance report format' })
    }
  }

  // Store metrics in Supabase
  await storePerformanceMetrics(report)
  
  // Check for performance alerts
  const alerts = checkPerformanceThresholds(report)
  if (alerts.length > 0) {
    await sendPerformanceAlerts(alerts, report)
  }
  
  // Update real-time performance dashboard
  await updatePerformanceDashboard(report)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      success: true,
      alertsTriggered: alerts.length,
      message: 'Performance metrics recorded successfully'
    })
  }
}

async function getPerformanceMetrics(event: HandlerEvent) {
  const { queryStringParameters } = event
  const timeRange = queryStringParameters?.timeRange || '24h'
  const page = queryStringParameters?.page
  
  try {
    const metrics = await fetchPerformanceMetrics(timeRange, page)
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        timeRange,
        page,
        metrics,
        summary: calculatePerformanceSummary(metrics)
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function storePerformanceMetrics(report: PerformanceReport) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration for performance tracking')
    return
  }

  const metricsData = {
    timestamp: report.timestamp,
    page: report.page,
    session_id: report.sessionId,
    user_id: report.userId,
    lcp: report.metrics.lcp,
    fid: report.metrics.fid,
    cls: report.metrics.cls,
    ttfb: report.metrics.ttfb,
    tti: report.metrics.tti,
    fcp: report.metrics.fcp,
    device_type: report.deviceInfo.type,
    connection_type: report.deviceInfo.connection,
    viewport: report.deviceInfo.viewport,
    environment: process.env.CONTEXT || 'production'
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/performance_metrics`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(metricsData)
    })

    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Error storing performance metrics:', error)
  }
}

function checkPerformanceThresholds(report: PerformanceReport): string[] {
  const alerts: string[] = []
  const metrics = report.metrics

  // Core Web Vitals thresholds
  if (metrics.lcp && metrics.lcp > 2500) {
    alerts.push(`LCP threshold exceeded: ${metrics.lcp}ms > 2500ms on ${report.page}`)
  }
  
  if (metrics.fid && metrics.fid > 100) {
    alerts.push(`FID threshold exceeded: ${metrics.fid}ms > 100ms on ${report.page}`)
  }
  
  if (metrics.cls && metrics.cls > 0.1) {
    alerts.push(`CLS threshold exceeded: ${metrics.cls} > 0.1 on ${report.page}`)
  }
  
  if (metrics.ttfb && metrics.ttfb > 800) {
    alerts.push(`TTFB threshold exceeded: ${metrics.ttfb}ms > 800ms on ${report.page}`)
  }
  
  if (metrics.tti && metrics.tti > 3800) {
    alerts.push(`TTI threshold exceeded: ${metrics.tti}ms > 3800ms on ${report.page}`)
  }

  return alerts
}

async function sendPerformanceAlerts(alerts: string[], report: PerformanceReport) {
  // Send alerts to monitoring service (e.g., Slack, email, PagerDuty)
  const alertData = {
    alerts,
    report,
    severity: determineSeverity(alerts),
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'production'
  }

  try {
    // Send to Slack webhook if configured
    const slackWebhook = process.env.SLACK_PERFORMANCE_WEBHOOK
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Performance Alert - ${alertData.severity.toUpperCase()}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Performance Issues Detected*\nPage: ${report.page}\nEnvironment: ${alertData.environment}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: alerts.map(alert => `• ${alert}`).join('\n')
              }
            }
          ]
        })
      })
    }

    // Store alerts for dashboard
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/performance_alerts`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertData)
      })
    }
  } catch (error) {
    console.error('Error sending performance alerts:', error)
  }
}

function determineSeverity(alerts: string[]): string {
  if (alerts.some(alert => alert.includes('LCP') || alert.includes('FID'))) {
    return 'high'
  }
  if (alerts.some(alert => alert.includes('CLS') || alert.includes('TTFB'))) {
    return 'medium'
  }
  return 'low'
}

async function updatePerformanceDashboard(report: PerformanceReport) {
  // Update real-time performance dashboard data
  try {
    const dashboardData = {
      page: report.page,
      latest_metrics: report.metrics,
      last_updated: report.timestamp,
      device_breakdown: {
        [report.deviceInfo.type]: 1
      },
      connection_breakdown: {
        [report.deviceInfo.connection]: 1
      }
    }

    // This could be sent to a real-time dashboard service
    // For now, just log the dashboard update
    console.log('Dashboard update:', dashboardData)
    
  } catch (error) {
    console.error('Error updating performance dashboard:', error)
  }
}

async function fetchPerformanceMetrics(timeRange: string, page?: string) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  // Convert timeRange to SQL interval
  const intervals: Record<string, string> = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  }
  
  const interval = intervals[timeRange] || '24 hours'
  
  let query = `performance_metrics?timestamp=gte.${new Date(Date.now() - getMilliseconds(interval)).toISOString()}`
  if (page) {
    query += `&page=eq.${encodeURIComponent(page)}`
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.status}`)
  }

  return response.json()
}

function getMilliseconds(interval: string): number {
  const intervals: Record<string, number> = {
    '1 hour': 60 * 60 * 1000,
    '24 hours': 24 * 60 * 60 * 1000,
    '7 days': 7 * 24 * 60 * 60 * 1000,
    '30 days': 30 * 24 * 60 * 60 * 1000
  }
  return intervals[interval] || intervals['24 hours']
}

function calculatePerformanceSummary(metrics: any[]) {
  if (!metrics.length) {
    return { message: 'No metrics available' }
  }

  const summary = {
    totalSamples: metrics.length,
    averages: {} as Record<string, number>,
    p95: {} as Record<string, number>,
    trends: {} as Record<string, string>
  }

  const metricFields = ['lcp', 'fid', 'cls', 'ttfb', 'tti', 'fcp']
  
  for (const field of metricFields) {
    const values = metrics.map(m => m[field]).filter(v => v != null).sort((a, b) => a - b)
    
    if (values.length > 0) {
      summary.averages[field] = values.reduce((sum, val) => sum + val, 0) / values.length
      summary.p95[field] = values[Math.floor(values.length * 0.95)]
      
      // Simple trend calculation (improvement/degradation)
      const recent = values.slice(-Math.min(10, values.length))
      const older = values.slice(0, Math.min(10, values.length))
      
      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length
        
        if (recentAvg > olderAvg * 1.1) {
          summary.trends[field] = 'degrading'
        } else if (recentAvg < olderAvg * 0.9) {
          summary.trends[field] = 'improving'
        } else {
          summary.trends[field] = 'stable'
        }
      }
    }
  }

  return summary
}