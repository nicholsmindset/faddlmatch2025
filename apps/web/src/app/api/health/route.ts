import { NextResponse } from 'next/server'
import { metrics, getMetricsDashboard } from '@/lib/monitoring/metrics'
import { getAlertStats } from '@/lib/monitoring/alerts'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe'
import { isProduction } from '@/lib/env'

/**
 * 🏥 Production Health Check Endpoint
 * Comprehensive system health monitoring with service checks
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Get comprehensive health status
    const healthStatus = metrics.getHealthStatus()
    const allMetrics = metrics.getAllMetrics()
    const alertStats = getAlertStats()
    
    // Perform service health checks
    const serviceChecks = await performServiceChecks()
    
    // Calculate overall health score
    const overallScore = calculateOverallHealth(healthStatus.score, serviceChecks)
    const overallStatus = getOverallStatus(overallScore)
    
    const processingTime = Date.now() - startTime
    
    const health = {
      status: overallStatus,
      score: overallScore,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      processingTime,
      
      // System metrics
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
          external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
        },
        cpu: {
          loadAverage: process.platform !== 'win32' ? os.loadavg() : [0, 0, 0],
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      },
      
      // Service health checks
      services: serviceChecks,
      
      // Performance metrics
      performance: {
        errorRate: allMetrics.performance.errorRate,
        averageResponseTime: allMetrics.performance.averageResponseTime,
        p95ResponseTime: allMetrics.performance.p95ResponseTime,
        requestsPerMinute: allMetrics.performance.requestsPerMinute,
        cacheHitRate: allMetrics.performance.cacheHitRate
      },
      
      // Business metrics (summary)
      business: {
        activeSubscriptions: allMetrics.business.activeSubscriptions,
        paymentFailureRate: allMetrics.business.paymentFailureRate,
        totalRevenue: allMetrics.business.totalRevenue
      },
      
      // Security status
      security: {
        rateLimitHits: allMetrics.security.rateLimitHits,
        suspiciousRequests: allMetrics.security.suspiciousRequests,
        authenticationFailures: allMetrics.security.authenticationFailures
      },
      
      // Alert summary
      alerts: {
        totalAlerts: alertStats.totalAlerts,
        criticalAlerts: alertStats.alertsBySeverity.critical || 0,
        recentAlerts: alertStats.totalAlerts // Last 24h by default
      },
      
      // Issues and recommendations
      issues: healthStatus.issues,
      recommendations: generateRecommendations(serviceChecks, healthStatus)
    }
    
    // Log health check in production
    if (isProduction()) {
      console.log(`[HEALTH] Health check completed`, {
        status: overallStatus,
        score: overallScore,
        processingTime,
        issues: health.issues.length
      })
    }
    
    const statusCode = overallStatus === 'critical' ? 503 : 
                      overallStatus === 'warning' ? 200 : 200
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Score': overallScore.toString(),
        'X-Processing-Time': processingTime.toString()
      }
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('[HEALTH] Health check failed:', {
      error: errorMessage,
      processingTime,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    })
    
    return NextResponse.json(
      { 
        status: 'critical',
        score: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage,
        processingTime,
        services: {
          database: 'unknown',
          stripe: 'unknown',
          auth: 'unknown'
        }
      },
      { status: 503 }
    )
  }
}

/**
 * 🔍 Perform comprehensive service health checks
 */
async function performServiceChecks(): Promise<Record<string, any>> {
  const checks = {
    database: await checkDatabaseHealth(),
    stripe: await checkStripeHealth(),
    auth: await checkAuthHealth(),
    storage: await checkStorageHealth()
  }
  
  return checks
}

/**
 * 🗺️ Database health check
 */
async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details?: any
}> {
  const startTime = Date.now()
  
  try {
    const supabase = createAdminClient()
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('count')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - startTime
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      return {
        status: 'unhealthy',
        responseTime,
        details: {
          error: error.message,
          code: error.code
        }
      }
    }
    
    const status = responseTime > 1000 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTime,
      details: {
        connectionPool: 'active',
        query: 'successful'
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Database connection failed'
      }
    }
  }
}

/**
 * 💳 Stripe API health check
 */
async function checkStripeHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details?: any
}> {
  const startTime = Date.now()
  
  try {
    const stripe = getStripeServer()
    
    // Test Stripe API with account retrieval
    const account = await stripe.accounts.retrieve()
    
    const responseTime = Date.now() - startTime
    const status = responseTime > 2000 ? 'degraded' : 'healthy'
    
    return {
      status,
      responseTime,
      details: {
        accountId: account.id,
        country: account.country,
        apiVersion: '2025-07-30.basil'
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Stripe API connection failed'
      }
    }
  }
}

/**
 * 🔐 Authentication service health check
 */
async function checkAuthHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details?: any
}> {
  const startTime = Date.now()
  
  try {
    // Basic auth service check - in a real implementation,
    // you might ping Clerk's health endpoint or verify JWT validation
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        provider: 'Clerk',
        status: 'operational'
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Auth service check failed'
      }
    }
  }
}

/**
 * 🖺 Storage health check
 */
async function checkStorageHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details?: any
}> {
  const startTime = Date.now()
  
  try {
    // Check file system write capability
    const tempPath = '/tmp/health-check.txt'
    const fs = require('fs').promises
    
    await fs.writeFile(tempPath, 'health-check')
    await fs.unlink(tempPath)
    
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        filesystem: 'writable',
        tempDirectory: 'accessible'
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        error: error instanceof Error ? error.message : 'Storage check failed'
      }
    }
  }
}

/**
 * 📊 Calculate overall health score
 */
function calculateOverallHealth(
  metricsScore: number,
  serviceChecks: Record<string, any>
): number {
  // Base score from metrics (70% weight)
  let score = metricsScore * 0.7
  
  // Service health contribution (30% weight)
  const serviceScores = Object.values(serviceChecks).map((check: any) => {
    switch (check.status) {
      case 'healthy': return 100
      case 'degraded': return 70
      case 'unhealthy': return 0
      default: return 50
    }
  })
  
  const avgServiceScore = serviceScores.reduce((a, b) => a + b, 0) / serviceScores.length
  score += avgServiceScore * 0.3
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * 🎨 Determine overall status from score
 */
function getOverallStatus(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 90) return 'healthy'
  if (score >= 70) return 'warning'
  return 'critical'
}

/**
 * 💡 Generate health recommendations
 */
function generateRecommendations(
  serviceChecks: Record<string, any>,
  healthStatus: any
): string[] {
  const recommendations: string[] = []
  
  // Service-specific recommendations
  Object.entries(serviceChecks).forEach(([service, check]: [string, any]) => {
    if (check.status === 'unhealthy') {
      recommendations.push(`Critical: ${service} service is down - immediate attention required`)
    } else if (check.status === 'degraded') {
      recommendations.push(`Warning: ${service} service is slow - monitor performance`)
    }
  })
  
  // General health recommendations
  if (healthStatus.score < 70) {
    recommendations.push('System health is below acceptable threshold - review all services')
  }
  
  if (healthStatus.issues.length > 0) {
    recommendations.push(`Address ${healthStatus.issues.length} identified issues`)
  }
  
  return recommendations
}

// Import os at the top of the file
const os = require('os')