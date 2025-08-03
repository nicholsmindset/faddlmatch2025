/**
 * Edge Functions Monitoring Library for FADDL Match Platform
 * 
 * Provides comprehensive monitoring, error tracking, performance analysis,
 * and real-time alerting for all edge functions.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Performance Monitoring Interfaces
interface PerformanceMetrics {
  function_name: string
  execution_time_ms: number
  memory_used_mb?: number
  cold_start: boolean
  request_size_bytes?: number
  response_size_bytes?: number
  timestamp: string
}

interface ErrorEvent {
  function_name: string
  error_type: string
  error_message: string
  error_stack?: string
  request_data?: any
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

interface AlertConfig {
  metric: string
  threshold: number
  window_minutes: number
  alert_type: 'email' | 'webhook' | 'both'
  enabled: boolean
}

interface MonitoringContext {
  functionName: string
  startTime: number
  userId?: string
  sessionId?: string
  requestId: string
  coldStart: boolean
  requestSize?: number
}

// Performance Thresholds
const PERFORMANCE_THRESHOLDS = {
  execution_time_warning: 1000, // 1 second
  execution_time_critical: 3000, // 3 seconds
  memory_warning: 100, // 100MB
  memory_critical: 200, // 200MB
  error_rate_warning: 0.05, // 5%
  error_rate_critical: 0.1, // 10%
  cold_start_threshold: 0.05 // 5%
}

// Alert Configurations
const DEFAULT_ALERTS: AlertConfig[] = [
  {
    metric: 'error_rate',
    threshold: 0.05,
    window_minutes: 5,
    alert_type: 'both',
    enabled: true
  },
  {
    metric: 'avg_execution_time',
    threshold: 2000,
    window_minutes: 10,
    alert_type: 'webhook',
    enabled: true
  },
  {
    metric: 'memory_usage',
    threshold: 150,
    window_minutes: 5,
    alert_type: 'webhook',
    enabled: true
  },
  {
    metric: 'cold_start_rate',
    threshold: 0.1,
    window_minutes: 15,
    alert_type: 'email',
    enabled: true
  }
]

/**
 * Initialize monitoring context for an edge function
 */
export function initializeMonitoring(
  functionName: string,
  req: Request,
  userId?: string,
  sessionId?: string
): MonitoringContext {
  const requestId = crypto.randomUUID()
  const coldStart = !globalThis.initialized
  globalThis.initialized = true
  
  const requestSize = req.headers.get('content-length') 
    ? parseInt(req.headers.get('content-length')!) 
    : undefined

  return {
    functionName,
    startTime: Date.now(),
    userId,
    sessionId,
    requestId,
    coldStart,
    requestSize
  }
}

/**
 * Record performance metrics for function execution
 */
export async function recordPerformanceMetrics(
  context: MonitoringContext,
  responseSize?: number
): Promise<void> {
  const executionTime = Date.now() - context.startTime
  
  const metrics: PerformanceMetrics = {
    function_name: context.functionName,
    execution_time_ms: executionTime,
    cold_start: context.coldStart,
    request_size_bytes: context.requestSize,
    response_size_bytes: responseSize,
    timestamp: new Date().toISOString()
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient
      .from('function_performance_metrics')
      .insert(metrics)

    // Check for performance alerts
    await checkPerformanceAlerts(context.functionName, executionTime, supabaseClient)
    
  } catch (error) {
    console.error('Failed to record performance metrics:', error)
  }
}

/**
 * Record error event with comprehensive context
 */
export async function recordError(
  context: MonitoringContext,
  error: Error | any,
  requestData?: any,
  req?: Request,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const errorEvent: ErrorEvent = {
    function_name: context.functionName,
    error_type: error.name || 'UnknownError',
    error_message: error.message || String(error),
    error_stack: error.stack,
    request_data: requestData,
    user_id: context.userId,
    session_id: context.sessionId,
    ip_address: req?.headers.get('cf-connecting-ip') || 
                req?.headers.get('x-forwarded-for') || 
                req?.headers.get('x-real-ip'),
    user_agent: req?.headers.get('user-agent'),
    severity,
    timestamp: new Date().toISOString()
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient
      .from('function_error_events')
      .insert(errorEvent)

    // Trigger immediate alert for critical errors
    if (severity === 'critical') {
      await triggerCriticalAlert(errorEvent, supabaseClient)
    }

    // Check for error rate alerts
    await checkErrorRateAlerts(context.functionName, supabaseClient)
    
  } catch (logError) {
    console.error('Failed to record error event:', logError)
  }
}

/**
 * Check and trigger performance-based alerts
 */
async function checkPerformanceAlerts(
  functionName: string,
  executionTime: number,
  supabaseClient: any
): Promise<void> {
  try {
    // Check execution time alerts
    if (executionTime > PERFORMANCE_THRESHOLDS.execution_time_critical) {
      await triggerAlert({
        type: 'performance_critical',
        function_name: functionName,
        metric: 'execution_time',
        value: executionTime,
        threshold: PERFORMANCE_THRESHOLDS.execution_time_critical,
        message: `Critical: Function ${functionName} took ${executionTime}ms to execute`
      }, supabaseClient)
    } else if (executionTime > PERFORMANCE_THRESHOLDS.execution_time_warning) {
      await triggerAlert({
        type: 'performance_warning',
        function_name: functionName,
        metric: 'execution_time',
        value: executionTime,
        threshold: PERFORMANCE_THRESHOLDS.execution_time_warning,
        message: `Warning: Function ${functionName} took ${executionTime}ms to execute`
      }, supabaseClient)
    }

    // Check cold start frequency (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    
    const { data: recentMetrics, error } = await supabaseClient
      .from('function_performance_metrics')
      .select('cold_start')
      .eq('function_name', functionName)
      .gte('timestamp', fifteenMinutesAgo)

    if (!error && recentMetrics && recentMetrics.length > 10) {
      const coldStartCount = recentMetrics.filter(m => m.cold_start).length
      const coldStartRate = coldStartCount / recentMetrics.length

      if (coldStartRate > PERFORMANCE_THRESHOLDS.cold_start_threshold) {
        await triggerAlert({
          type: 'cold_start_warning',
          function_name: functionName,
          metric: 'cold_start_rate',
          value: coldStartRate,
          threshold: PERFORMANCE_THRESHOLDS.cold_start_threshold,
          message: `High cold start rate for ${functionName}: ${(coldStartRate * 100).toFixed(1)}%`
        }, supabaseClient)
      }
    }
  } catch (error) {
    console.error('Failed to check performance alerts:', error)
  }
}

/**
 * Check and trigger error rate alerts
 */
async function checkErrorRateAlerts(
  functionName: string,
  supabaseClient: any
): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    // Get total requests (from performance metrics)
    const { data: totalRequests, error: totalError } = await supabaseClient
      .from('function_performance_metrics')
      .select('timestamp')
      .eq('function_name', functionName)
      .gte('timestamp', fiveMinutesAgo)

    // Get error count
    const { data: errorEvents, error: errorError } = await supabaseClient
      .from('function_error_events')
      .select('timestamp')
      .eq('function_name', functionName)
      .gte('timestamp', fiveMinutesAgo)

    if (!totalError && !errorError && totalRequests && totalRequests.length > 0) {
      const errorRate = (errorEvents?.length || 0) / totalRequests.length

      if (errorRate > PERFORMANCE_THRESHOLDS.error_rate_critical) {
        await triggerAlert({
          type: 'error_rate_critical',
          function_name: functionName,
          metric: 'error_rate',
          value: errorRate,
          threshold: PERFORMANCE_THRESHOLDS.error_rate_critical,
          message: `Critical error rate for ${functionName}: ${(errorRate * 100).toFixed(1)}%`
        }, supabaseClient)
      } else if (errorRate > PERFORMANCE_THRESHOLDS.error_rate_warning) {
        await triggerAlert({
          type: 'error_rate_warning',
          function_name: functionName,
          metric: 'error_rate',
          value: errorRate,
          threshold: PERFORMANCE_THRESHOLDS.error_rate_warning,
          message: `Warning error rate for ${functionName}: ${(errorRate * 100).toFixed(1)}%`
        }, supabaseClient)
      }
    }
  } catch (error) {
    console.error('Failed to check error rate alerts:', error)
  }
}

/**
 * Trigger critical error alert
 */
async function triggerCriticalAlert(
  errorEvent: ErrorEvent,
  supabaseClient: any
): Promise<void> {
  await triggerAlert({
    type: 'critical_error',
    function_name: errorEvent.function_name,
    metric: 'error',
    value: 1,
    threshold: 1,
    message: `Critical error in ${errorEvent.function_name}: ${errorEvent.error_message}`,
    error_details: {
      error_type: errorEvent.error_type,
      user_id: errorEvent.user_id,
      ip_address: errorEvent.ip_address
    }
  }, supabaseClient)
}

/**
 * Generic alert triggering function
 */
async function triggerAlert(
  alert: {
    type: string
    function_name: string
    metric: string
    value: number
    threshold: number
    message: string
    error_details?: any
  },
  supabaseClient: any
): Promise<void> {
  try {
    // Record alert in database
    await supabaseClient
      .from('function_alerts')
      .insert({
        alert_type: alert.type,
        function_name: alert.function_name,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
        alert_data: alert.error_details || {},
        resolved: false,
        created_at: new Date().toISOString()
      })

    // Send webhook notification for critical alerts
    if (alert.type.includes('critical')) {
      await sendWebhookNotification(alert)
    }

    console.warn(`🚨 ALERT: ${alert.message}`)
  } catch (error) {
    console.error('Failed to trigger alert:', error)
  }
}

/**
 * Send webhook notification for alerts
 */
async function sendWebhookNotification(alert: any): Promise<void> {
  const webhookUrl = Deno.env.get('MONITORING_WEBHOOK_URL')
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('MONITORING_WEBHOOK_TOKEN')}`
      },
      body: JSON.stringify({
        text: `🚨 FADDL Match Alert: ${alert.message}`,
        alert_type: alert.type,
        function_name: alert.function_name,
        timestamp: new Date().toISOString(),
        details: alert
      })
    })
  } catch (error) {
    console.error('Failed to send webhook notification:', error)
  }
}

/**
 * Get function health status
 */
export async function getFunctionHealth(
  functionName: string,
  windowMinutes: number = 15
): Promise<{
  status: 'healthy' | 'warning' | 'critical'
  metrics: {
    avg_execution_time: number
    error_rate: number
    cold_start_rate: number
    total_requests: number
  }
  issues: string[]
}> {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
    
    // Get performance metrics
    const { data: perfMetrics, error: perfError } = await supabaseClient
      .from('function_performance_metrics')
      .select('*')
      .eq('function_name', functionName)
      .gte('timestamp', windowStart)

    // Get error events
    const { data: errorEvents, error: errorError } = await supabaseClient
      .from('function_error_events')
      .select('*')
      .eq('function_name', functionName)
      .gte('timestamp', windowStart)

    if (perfError || errorError) {
      throw new Error('Failed to fetch health metrics')
    }

    const totalRequests = perfMetrics?.length || 0
    const totalErrors = errorEvents?.length || 0
    const avgExecutionTime = totalRequests > 0 
      ? perfMetrics!.reduce((sum, m) => sum + m.execution_time_ms, 0) / totalRequests 
      : 0
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0
    const coldStartRate = totalRequests > 0 
      ? perfMetrics!.filter(m => m.cold_start).length / totalRequests 
      : 0

    const issues: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check thresholds
    if (avgExecutionTime > PERFORMANCE_THRESHOLDS.execution_time_critical) {
      issues.push(`Critical execution time: ${avgExecutionTime.toFixed(0)}ms`)
      status = 'critical'
    } else if (avgExecutionTime > PERFORMANCE_THRESHOLDS.execution_time_warning) {
      issues.push(`High execution time: ${avgExecutionTime.toFixed(0)}ms`)
      if (status !== 'critical') status = 'warning'
    }

    if (errorRate > PERFORMANCE_THRESHOLDS.error_rate_critical) {
      issues.push(`Critical error rate: ${(errorRate * 100).toFixed(1)}%`)
      status = 'critical'
    } else if (errorRate > PERFORMANCE_THRESHOLDS.error_rate_warning) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`)
      if (status !== 'critical') status = 'warning'
    }

    if (coldStartRate > PERFORMANCE_THRESHOLDS.cold_start_threshold) {
      issues.push(`High cold start rate: ${(coldStartRate * 100).toFixed(1)}%`)
      if (status !== 'critical') status = 'warning'
    }

    return {
      status,
      metrics: {
        avg_execution_time: avgExecutionTime,
        error_rate: errorRate,
        cold_start_rate: coldStartRate,
        total_requests: totalRequests
      },
      issues
    }
  } catch (error) {
    return {
      status: 'critical',
      metrics: {
        avg_execution_time: 0,
        error_rate: 1,
        cold_start_rate: 0,
        total_requests: 0
      },
      issues: [`Health check failed: ${error.message}`]
    }
  }
}

/**
 * Monitoring middleware wrapper for edge functions
 */
export function withMonitoring<T extends (...args: any[]) => Promise<Response>>(
  functionName: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    const req = args[0] as Request
    let context: MonitoringContext | undefined
    let response: Response

    try {
      // Initialize monitoring
      context = initializeMonitoring(functionName, req)
      
      // Execute the handler
      response = await handler(...args)
      
      // Record successful execution
      await recordPerformanceMetrics(context, 
        response.headers.get('content-length') 
          ? parseInt(response.headers.get('content-length')!) 
          : undefined
      )

      return response
    } catch (error) {
      // Record error
      if (context) {
        await recordError(context, error, undefined, req, 'high')
      }
      
      // Re-throw the error
      throw error
    }
  }) as T
}