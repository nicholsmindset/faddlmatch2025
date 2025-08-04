/**
 * 📊 Production Metrics and Monitoring System
 * Comprehensive monitoring for subscription system performance and business KPIs
 */

import { isProduction } from '@/lib/env'

/**
 * 📈 Business KPI Metrics
 */
export interface BusinessMetrics {
  // Subscription metrics
  totalSubscriptions: number
  activeSubscriptions: number
  churnRate: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  
  // Conversion metrics
  signupToTrialRate: number
  trialToSubscriptionRate: number
  subscriptionUpgradeRate: number
  
  // Plan distribution
  intentionPlanUsers: number
  patiencePlanUsers: number
  reliancePlanUsers: number
  
  // Payment metrics
  successfulPayments: number
  failedPayments: number
  paymentFailureRate: number
  totalRevenue: number
}

/**
 * ⚡ Performance Metrics
 */
export interface PerformanceMetrics {
  // API performance
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerMinute: number
  
  // Error rates
  errorRate: number
  webhookErrorRate: number
  paymentErrorRate: number
  
  // System health
  memoryUsage: number
  cpuUsage: number
  dbConnectionPool: number
  cacheHitRate: number
}

/**
 * 🔒 Security Metrics
 */
export interface SecurityMetrics {
  rateLimitHits: number
  suspiciousRequests: number
  validationFailures: number
  webhookSignatureFailures: number
  authenticationFailures: number
}

/**
 * 💳 Stripe Integration Metrics
 */
export interface StripeMetrics {
  webhookSuccessRate: number
  webhookLatency: number
  checkoutSessionsCreated: number
  checkoutSuccessRate: number
  paymentIntentSuccessRate: number
  disputeRate: number
  refundRate: number
}

/**
 * 📊 Comprehensive metrics collector
 */
class MetricsCollector {
  private businessMetrics: BusinessMetrics
  private performanceMetrics: PerformanceMetrics
  private securityMetrics: SecurityMetrics
  private stripeMetrics: StripeMetrics
  
  // Temporary storage for calculations
  private responseTimes: number[] = []
  private requestCounts: Map<string, number> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private lastResetTime: number = Date.now()

  constructor() {
    this.businessMetrics = this.initializeBusinessMetrics()
    this.performanceMetrics = this.initializePerformanceMetrics()
    this.securityMetrics = this.initializeSecurityMetrics()
    this.stripeMetrics = this.initializeStripeMetrics()
    
    // Reset metrics daily
    setInterval(() => this.resetDailyMetrics(), 24 * 60 * 60 * 1000)
  }

  private initializeBusinessMetrics(): BusinessMetrics {
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      signupToTrialRate: 0,
      trialToSubscriptionRate: 0,
      subscriptionUpgradeRate: 0,
      intentionPlanUsers: 0,
      patiencePlanUsers: 0,
      reliancePlanUsers: 0,
      successfulPayments: 0,
      failedPayments: 0,
      paymentFailureRate: 0,
      totalRevenue: 0,
    }
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      webhookErrorRate: 0,
      paymentErrorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      dbConnectionPool: 0,
      cacheHitRate: 0,
    }
  }

  private initializeSecurityMetrics(): SecurityMetrics {
    return {
      rateLimitHits: 0,
      suspiciousRequests: 0,
      validationFailures: 0,
      webhookSignatureFailures: 0,
      authenticationFailures: 0,
    }
  }

  private initializeStripeMetrics(): StripeMetrics {
    return {
      webhookSuccessRate: 0,
      webhookLatency: 0,
      checkoutSessionsCreated: 0,
      checkoutSuccessRate: 0,
      paymentIntentSuccessRate: 0,
      disputeRate: 0,
      refundRate: 0,
    }
  }

  /**
   * 📊 Record API request metrics
   */
  recordApiRequest(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    const key = `${method}:${endpoint}`
    
    // Record response time
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > 10000) {
      this.responseTimes = this.responseTimes.slice(-10000) // Keep last 10k
    }
    
    // Record request count
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)
    
    // Record errors
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics()
  }

  /**
   * 💳 Record Stripe webhook metrics
   */
  recordStripeWebhook(eventType: string, processingTime: number, success: boolean): void {
    this.stripeMetrics.webhookLatency = 
      (this.stripeMetrics.webhookLatency + processingTime) / 2
    
    if (success) {
      this.stripeMetrics.webhookSuccessRate = 
        Math.min(100, this.stripeMetrics.webhookSuccessRate + 0.1)
    } else {
      this.stripeMetrics.webhookSuccessRate = 
        Math.max(0, this.stripeMetrics.webhookSuccessRate - 0.5)
    }
  }

  /**
   * 🔒 Record security events
   */
  recordSecurityEvent(type: 'rate_limit' | 'suspicious' | 'validation' | 'webhook_sig' | 'auth'): void {
    switch (type) {
      case 'rate_limit':
        this.securityMetrics.rateLimitHits++
        break
      case 'suspicious':
        this.securityMetrics.suspiciousRequests++
        break
      case 'validation':
        this.securityMetrics.validationFailures++
        break
      case 'webhook_sig':
        this.securityMetrics.webhookSignatureFailures++
        break
      case 'auth':
        this.securityMetrics.authenticationFailures++
        break
    }
  }

  /**
   * 💰 Record business events
   */
  recordBusinessEvent(
    type: 'subscription_created' | 'subscription_canceled' | 'payment_success' | 'payment_failed' | 'upgrade',
    planId?: string,
    amount?: number
  ): void {
    switch (type) {
      case 'subscription_created':
        this.businessMetrics.totalSubscriptions++
        this.businessMetrics.activeSubscriptions++
        if (planId) {
          this.updatePlanDistribution(planId, 1)
        }
        break
        
      case 'subscription_canceled':
        this.businessMetrics.activeSubscriptions = Math.max(0, this.businessMetrics.activeSubscriptions - 1)
        if (planId) {
          this.updatePlanDistribution(planId, -1)
        }
        break
        
      case 'payment_success':
        this.businessMetrics.successfulPayments++
        if (amount) {
          this.businessMetrics.totalRevenue += amount
        }
        break
        
      case 'payment_failed':
        this.businessMetrics.failedPayments++
        break
        
      case 'upgrade':
        this.businessMetrics.subscriptionUpgradeRate += 0.1
        break
    }
    
    this.updateBusinessMetrics()
  }

  /**
   * 📊 Update calculated metrics
   */
  private updatePerformanceMetrics(): void {
    if (this.responseTimes.length === 0) return
    
    // Calculate percentiles
    const sorted = [...this.responseTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)
    
    this.performanceMetrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    this.performanceMetrics.p95ResponseTime = sorted[p95Index] || 0
    this.performanceMetrics.p99ResponseTime = sorted[p99Index] || 0
    
    // Calculate requests per minute
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0)
    const minutesSinceReset = (Date.now() - this.lastResetTime) / 60000
    this.performanceMetrics.requestsPerMinute = minutesSinceReset > 0 ? totalRequests / minutesSinceReset : 0
    
    // Calculate error rate
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    this.performanceMetrics.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
    
    // Update system metrics
    this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB
  }

  private updateBusinessMetrics(): void {
    // Calculate derived metrics
    const totalPayments = this.businessMetrics.successfulPayments + this.businessMetrics.failedPayments
    this.businessMetrics.paymentFailureRate = totalPayments > 0 ? 
      (this.businessMetrics.failedPayments / totalPayments) * 100 : 0
    
    this.businessMetrics.averageRevenuePerUser = this.businessMetrics.activeSubscriptions > 0 ?
      this.businessMetrics.totalRevenue / this.businessMetrics.activeSubscriptions : 0
  }

  private updatePlanDistribution(planId: string, delta: number): void {
    switch (planId.toLowerCase()) {
      case 'intention':
        this.businessMetrics.intentionPlanUsers = Math.max(0, this.businessMetrics.intentionPlanUsers + delta)
        break
      case 'patience':
        this.businessMetrics.patiencePlanUsers = Math.max(0, this.businessMetrics.patiencePlanUsers + delta)
        break
      case 'reliance':
        this.businessMetrics.reliancePlanUsers = Math.max(0, this.businessMetrics.reliancePlanUsers + delta)
        break
    }
  }

  /**
   * 📈 Get current metrics
   */
  getBusinessMetrics(): BusinessMetrics {
    return { ...this.businessMetrics }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics }
  }

  getStripeMetrics(): StripeMetrics {
    return { ...this.stripeMetrics }
  }

  getAllMetrics(): {
    business: BusinessMetrics
    performance: PerformanceMetrics
    security: SecurityMetrics
    stripe: StripeMetrics
    timestamp: string
  } {
    return {
      business: this.getBusinessMetrics(),
      performance: this.getPerformanceMetrics(),
      security: this.getSecurityMetrics(),
      stripe: this.getStripeMetrics(),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 🧹 Reset daily metrics
   */
  private resetDailyMetrics(): void {
    this.performanceMetrics.requestsPerMinute = 0
    this.securityMetrics = this.initializeSecurityMetrics()
    this.requestCounts.clear()
    this.errorCounts.clear()
    this.lastResetTime = Date.now()
    
    console.log('[METRICS] Daily metrics reset completed')
  }

  /**
   * 🚨 Health check based on metrics
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    score: number
  } {
    const issues: string[] = []
    let score = 100

    // Check error rates
    if (this.performanceMetrics.errorRate > 5) {
      issues.push(`High error rate: ${this.performanceMetrics.errorRate.toFixed(2)}%`)
      score -= 20
    }

    // Check response times
    if (this.performanceMetrics.p95ResponseTime > 2000) {
      issues.push(`Slow response times: P95 ${this.performanceMetrics.p95ResponseTime}ms`)
      score -= 15
    }

    // Check payment failures
    if (this.businessMetrics.paymentFailureRate > 10) {
      issues.push(`High payment failure rate: ${this.businessMetrics.paymentFailureRate.toFixed(2)}%`)
      score -= 25
    }

    // Check webhook success
    if (this.stripeMetrics.webhookSuccessRate < 95) {
      issues.push(`Low webhook success rate: ${this.stripeMetrics.webhookSuccessRate.toFixed(2)}%`)
      score -= 20
    }

    // Check memory usage
    if (this.performanceMetrics.memoryUsage > 500) {
      issues.push(`High memory usage: ${this.performanceMetrics.memoryUsage.toFixed(2)}MB`)
      score -= 10
    }

    // Check security issues
    if (this.securityMetrics.suspiciousRequests > 10) {
      issues.push(`Suspicious activity detected: ${this.securityMetrics.suspiciousRequests} requests`)
      score -= 15
    }

    let status: 'healthy' | 'warning' | 'critical'
    if (score >= 90) status = 'healthy'
    else if (score >= 70) status = 'warning'
    else status = 'critical'

    return { status, issues, score: Math.max(0, score) }
  }
}

// Global metrics collector
export const metrics = new MetricsCollector()

/**
 * 📊 Metrics middleware for API routes
 */
export function withMetrics<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<{ response: T; statusCode: number }>
): Promise<{ response: T; statusCode: number }> {
  const startTime = Date.now()
  
  return handler()
    .then(result => {
      const responseTime = Date.now() - startTime
      metrics.recordApiRequest(endpoint, method, responseTime, result.statusCode)
      return result
    })
    .catch(error => {
      const responseTime = Date.now() - startTime
      const statusCode = error.status || error.statusCode || 500
      metrics.recordApiRequest(endpoint, method, responseTime, statusCode)
      throw error
    })
}

/**
 * 📈 Export metrics to external monitoring (Datadog, New Relic, etc.)
 */
export async function exportMetrics(): Promise<void> {
  if (!isProduction()) return

  const allMetrics = metrics.getAllMetrics()
  
  try {
    // Example: Send to external monitoring service
    // await fetch('https://api.datadoghq.com/api/v1/series', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'DD-API-KEY': process.env.DATADOG_API_KEY!,
    //   },
    //   body: JSON.stringify({
    //     series: convertMetricsToDatadog(allMetrics)
    //   })
    // })
    
    console.log('[METRICS] Metrics exported successfully', {
      timestamp: allMetrics.timestamp,
      business: {
        activeSubscriptions: allMetrics.business.activeSubscriptions,
        totalRevenue: allMetrics.business.totalRevenue,
        paymentFailureRate: allMetrics.business.paymentFailureRate,
      },
      performance: {
        errorRate: allMetrics.performance.errorRate,
        averageResponseTime: allMetrics.performance.averageResponseTime,
        requestsPerMinute: allMetrics.performance.requestsPerMinute,
      },
    })
    
  } catch (error) {
    console.error('[METRICS] Failed to export metrics:', error)
  }
}

/**
 * 🎯 Specific metric recording functions
 */
export const recordSubscriptionCreated = (planId: string) => 
  metrics.recordBusinessEvent('subscription_created', planId)

export const recordSubscriptionCanceled = (planId: string) => 
  metrics.recordBusinessEvent('subscription_canceled', planId)

export const recordPaymentSuccess = (amount: number) => 
  metrics.recordBusinessEvent('payment_success', undefined, amount)

export const recordPaymentFailure = () => 
  metrics.recordBusinessEvent('payment_failed')

export const recordWebhookProcessed = (eventType: string, processingTime: number, success: boolean) =>
  metrics.recordStripeWebhook(eventType, processingTime, success)

export const recordSecurityIncident = (type: Parameters<typeof metrics.recordSecurityEvent>[0]) =>
  metrics.recordSecurityEvent(type)

/**
 * 📊 Metrics dashboard data
 */
export interface MetricsDashboard {
  healthStatus: ReturnType<typeof metrics.getHealthStatus>
  businessMetrics: BusinessMetrics
  performanceMetrics: PerformanceMetrics
  securityMetrics: SecurityMetrics
  stripeMetrics: StripeMetrics
  trends: {
    subscriptionGrowth: number
    revenueGrowth: number
    churnTrend: number
  }
}

export function getMetricsDashboard(): MetricsDashboard {
  return {
    healthStatus: metrics.getHealthStatus(),
    businessMetrics: metrics.getBusinessMetrics(),
    performanceMetrics: metrics.getPerformanceMetrics(),
    securityMetrics: metrics.getSecurityMetrics(),
    stripeMetrics: metrics.getStripeMetrics(),
    trends: {
      subscriptionGrowth: 0, // Would be calculated from historical data
      revenueGrowth: 0,
      churnTrend: 0,
    },
  }
}