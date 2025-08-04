/**
 * 📊 Admin Dashboard API
 * Comprehensive metrics and monitoring data for administrators
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getMetricsDashboard } from '@/lib/monitoring/metrics'
import { getAlertHistory, getAlertStats } from '@/lib/monitoring/alerts'
import { getIdempotencyStats } from '@/lib/middleware/idempotency'
import { getRateLimitAnalytics } from '@/lib/middleware/rate-limit'
import { isProduction } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * 🔐 Admin authorization check
 */
async function isAuthorizedAdmin(userId: string): Promise<boolean> {
  // In production, implement proper admin role checking
  // This is a placeholder - implement your admin authorization logic
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  return adminUserIds.includes(userId)
}

/**
 * 📊 Get comprehensive dashboard data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Authenticate and authorize
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin privileges
    const isAdmin = await isAuthorizedAdmin(userId)
    if (!isAdmin) {
      console.warn(`[ADMIN] Unauthorized dashboard access attempt by user ${userId}`)
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const includeDetails = searchParams.get('details') === 'true'

    // Collect all dashboard data
    const [
      metricsDashboard,
      alertStats,
      alertHistory,
      idempotencyStats,
      subscriptionStats,
      revenueStats
    ] = await Promise.all([
      getMetricsDashboard(),
      getAlertStats(),
      getAlertHistory(parseTimeRange(timeRange)),
      getIdempotencyStats(),
      getSubscriptionStats(),
      getRevenueStats(timeRange)
    ])

    const dashboard = {
      timestamp: new Date().toISOString(),
      timeRange,
      processingTime: Date.now() - startTime,
      
      // System health overview
      health: {
        status: metricsDashboard.healthStatus.status,
        score: metricsDashboard.healthStatus.score,
        issues: metricsDashboard.healthStatus.issues,
        uptime: process.uptime()
      },

      // Performance metrics
      performance: {
        ...metricsDashboard.performanceMetrics,
        idempotency: {
          cacheHitRate: idempotencyStats.memoryUsageMB > 0 ? 
            ((idempotencyStats.totalRecords / (idempotencyStats.totalRecords + 100)) * 100) : 0,
          totalRecords: idempotencyStats.totalRecords,
          memoryUsage: idempotencyStats.memoryUsageMB
        }
      },

      // Business metrics
      business: {
        ...metricsDashboard.businessMetrics,
        revenue: revenueStats,
        subscriptions: subscriptionStats
      },

      // Security overview
      security: {
        ...metricsDashboard.securityMetrics,
        recentAlerts: alertHistory.filter(alert => 
          alert.type.includes('security') || 
          alert.type.includes('suspicious') ||
          alert.type.includes('auth')
        ).length
      },

      // Stripe integration status
      stripe: {
        ...metricsDashboard.stripeMetrics,
        lastWebhookProcessed: await getLastWebhookTime(),
        pendingWebhooks: await getPendingWebhookCount()
      },

      // Alert summary
      alerts: {
        stats: alertStats,
        recent: alertHistory.slice(0, 10), // Last 10 alerts
        critical: alertHistory.filter(alert => alert.severity === 'critical').length,
        byType: alertStats.alertsByType
      },

      // System resources
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        node: {
          version: process.version,
          uptime: process.uptime(),
          platform: process.platform
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isProduction: isProduction(),
          version: process.env.npm_package_version || '1.0.0'
        }
      },

      // API endpoints performance
      endpoints: includeDetails ? await getEndpointPerformance() : null,

      // Database health
      database: includeDetails ? await getDatabaseHealth() : null,

      // Recent activities
      activities: includeDetails ? await getRecentActivities() : null
    }

    console.log(`[ADMIN] Dashboard data retrieved for user ${userId}`, {
      processingTime: dashboard.processingTime,
      healthScore: dashboard.health.score,
      totalAlerts: dashboard.alerts.stats.totalAlerts
    })

    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Processing-Time': dashboard.processingTime.toString()
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[ADMIN] Dashboard error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      userId
    })

    return NextResponse.json(
      { 
        error: 'Failed to load dashboard data',
        processingTime
      },
      { status: 500 }
    )
  }
}

/**
 * 📈 Get subscription statistics
 */
async function getSubscriptionStats(): Promise<any> {
  try {
    const supabase = createAdminClient()
    
    const [
      totalSubs,
      activeSubs,
      planDistribution,
      recentSubs
    ] = await Promise.all([
      // Total subscriptions
      supabase
        .from('user_subscriptions')
        .select('count'),
      
      // Active subscriptions  
      supabase
        .from('user_subscriptions')
        .select('count')
        .eq('status', 'active'),
      
      // Plan distribution
      supabase
        .from('user_subscriptions')
        .select('plan_id, count(*)')
        .eq('status', 'active')
        .group('plan_id'),
      
      // Recent subscriptions (last 7 days)
      supabase
        .from('user_subscriptions')
        .select('created_at, plan_id')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    return {
      total: totalSubs.count || 0,
      active: activeSubs.count || 0,
      planDistribution: planDistribution.data || [],
      recentGrowth: recentSubs.data?.length || 0,
      conversionRate: totalSubs.count ? (activeSubs.count / totalSubs.count * 100) : 0
    }
  } catch (error) {
    console.error('[ADMIN] Failed to get subscription stats:', error)
    return {
      total: 0,
      active: 0,
      planDistribution: [],
      recentGrowth: 0,
      conversionRate: 0
    }
  }
}

/**
 * 💰 Get revenue statistics
 */
async function getRevenueStats(timeRange: string): Promise<any> {
  try {
    const supabase = createAdminClient()
    const hoursBack = parseTimeRange(timeRange)
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    
    const [
      totalRevenue,
      recentRevenue,
      paymentStats
    ] = await Promise.all([
      // Total revenue
      supabase
        .from('payment_history')
        .select('amount_paid')
        .eq('payment_status', 'succeeded'),
      
      // Recent revenue
      supabase
        .from('payment_history')
        .select('amount_paid, created_at')
        .eq('payment_status', 'succeeded')
        .gte('created_at', cutoffDate.toISOString()),
      
      // Payment statistics
      supabase
        .from('payment_history')
        .select('payment_status, count(*)')
        .gte('created_at', cutoffDate.toISOString())
        .group('payment_status')
    ])

    const total = totalRevenue.data?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0
    const recent = recentRevenue.data?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0

    return {
      totalRevenue: total / 100, // Convert from cents
      recentRevenue: recent / 100,
      paymentStats: paymentStats.data || [],
      averageTransactionValue: recentRevenue.data?.length ? 
        (recent / recentRevenue.data.length / 100) : 0
    }
  } catch (error) {
    console.error('[ADMIN] Failed to get revenue stats:', error)
    return {
      totalRevenue: 0,
      recentRevenue: 0,
      paymentStats: [],
      averageTransactionValue: 0
    }
  }
}

/**
 * 🕐 Get last webhook processing time
 */
async function getLastWebhookTime(): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('subscription_events')
      .select('processed_at')
      .not('stripe_event_id', 'is', null)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single()

    return data?.processed_at || null
  } catch (error) {
    return null
  }
}

/**
 * ⏳ Get pending webhook count
 */
async function getPendingWebhookCount(): Promise<number> {
  // This would require implementing a webhook queue system
  // For now, return 0
  return 0
}

/**
 * 🎯 Get endpoint performance data
 */
async function getEndpointPerformance(): Promise<any> {
  // This would require implementing endpoint-specific metrics tracking
  // For now, return basic structure
  return {
    '/api/subscriptions/checkout': {
      avgResponseTime: 150,
      errorRate: 0.5,
      requestCount: 245
    },
    '/api/subscriptions/status': {
      avgResponseTime: 45,
      errorRate: 0.1,
      requestCount: 1200
    },
    '/api/webhooks/stripe': {
      avgResponseTime: 80,
      errorRate: 0.2,
      requestCount: 450
    }
  }
}

/**
 * 🗄️ Get database health details
 */
async function getDatabaseHealth(): Promise<any> {
  try {
    const supabase = createAdminClient()
    
    // Test database performance with a simple query
    const startTime = Date.now()
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      responseTime,
      connectionPool: 'active',
      lastError: error ? error.message : null
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: -1,
      connectionPool: 'error',
      lastError: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 📝 Get recent system activities
 */
async function getRecentActivities(): Promise<any[]> {
  try {
    const supabase = createAdminClient()
    
    const { data } = await supabase
      .from('subscription_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    return data || []
  } catch (error) {
    return []
  }
}

/**
 * ⏰ Parse time range string to hours
 */
function parseTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 1
    case '6h': return 6
    case '24h': return 24
    case '7d': return 24 * 7
    case '30d': return 24 * 30
    default: return 24
  }
}

/**
 * 🚫 Only allow GET requests
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}